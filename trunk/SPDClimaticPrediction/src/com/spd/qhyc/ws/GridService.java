package com.spd.qhyc.ws;

import java.awt.geom.Point2D;
import java.awt.geom.Rectangle2D;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.DecimalFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.TreeMap;

import javax.ejb.Stateless;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.springframework.web.context.ContextLoader;

import com.alibaba.druid.pool.DruidDataSource;
import com.alibaba.druid.pool.DruidPooledConnection;
import com.mg.objects.Analyst;
import com.mg.objects.Dataset;
import com.mg.objects.DatasetRaster;
import com.mg.objects.DatasetVector;
import com.mg.objects.Datasource;
import com.mg.objects.GeoPoint;
import com.mg.objects.GeoRegion;
import com.mg.objects.Recordset;
import com.mg.objects.Scanline;
import com.mg.objects.Workspace;
import com.spd.qhyc.domain.Application;
import com.spd.qhyc.domain.ApplicationContextFactory;
import com.spd.qhyc.domain.DatasourceConnectionConfigInfo;
import com.spd.qhyc.domain.FileInfo;
import com.spd.qhyc.domain.ForecastData;
import com.spd.qhyc.domain.ForecastDataElementHourSpans;
import com.spd.qhyc.domain.GridInfo;
import com.spd.qhyc.domain.OutputSetting;
import com.spd.qhyc.domain.Scheme;
import com.spd.qhyc.domain.Station;
import com.spd.qhyc.jdbc.DataSource;
import com.spd.qhyc.jdbc.DataSourceSingleton;
import com.spd.qhyc.pojo.CommonConfig;
import com.spd.qhyc.service.IForecastfineService;
import com.spd.qhyc.tool.BaoWenFileFilter;
import com.spd.qhyc.tool.GridUtil;
import com.spd.qhyc.tool.LogTool;
import com.spd.qhyc.tool.RasterService;
import com.spd.weathermap.domain.GridData;
import com.spd.weathermap.domain.GridValueInfo;
import com.spd.weathermap.domain.LastGridInfo;
import com.spd.weathermap.util.CommonTool;
import com.spd.weathermap.util.Toolkit;

/*
 * 
 * 格点服务
 * by zouwei, 2015-05-10
 * 
 * */
@Stateless
@Path("GridService")
public class GridService {
	private static ArrayList<String> m_datasetRefreshList = new ArrayList<String>();
	private static Map<String,Integer> m_datasetUpdateTime = new HashMap<String,Integer>();
	private static Datasource m_datasource = null;	//格点数据源
   // ExecutorService exec = Executors.newSingleThreadExecutor();
	//Thread[] thread = new Thread[5];
	private static final int DATA_CHUNK = 128 * 1024 * 1024; 
	 // total data size is 2G
	private static final long LEN = 2L * 1024 * 1024 * 1024L; 
	
	public static DatasourceConnectionConfigInfo datasourceConnectionConfigInfo;
	static {
		datasourceConnectionConfigInfo = (DatasourceConnectionConfigInfo)ApplicationContextFactory.getInstance().getBean("datasourceConnectionConfigInfo");
		String strJson = String.format("{\"Type\":\"%s\",\"Alias\":\"%s\",\"Server\":\"%s\",\"User\":\"%s\",\"Password\":\"%s\",\"DB\":\"%s\",\"Port\":\"%s\"}",
				datasourceConnectionConfigInfo.getType(), datasourceConnectionConfigInfo.getAlias(), datasourceConnectionConfigInfo.getServer(), 
				datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword(), datasourceConnectionConfigInfo.getDatabase(), 
				datasourceConnectionConfigInfo.getPort());
		m_datasource = Application.m_workspace.OpenDatasource(strJson);		
		try {
			Class.forName("com.mysql.jdbc.Driver"); //加载MySql的驱动类
		} catch (ClassNotFoundException e) {
			System.out.println("找不到驱动程序类 ，加载驱动失败！");
			e.printStackTrace();
		}
	}
	
	/*
	 * 获取格点数据集名
	 * */
	public String getGridDatasetName(String type,String level,String element,Date maketime,String version,Date date,Integer hour)
	{
		String result = "";
		if(level==null || level.equals("") || level.equals("null") || level.equals("undefined")) //不含层次的是格点产品
			level = "1000";
		result = String.format("t_%s_%s_%s_%s_%s_%s_%s", type, element, new SimpleDateFormat("yyMMddHHmm").format(maketime), version, new SimpleDateFormat("yyMMddHH").format(date), new DecimalFormat("000").format(hour), level);
		return result;
	}
	
	/**
	 * 获取/打开格点数据源
	 * @return
	 */
	private Datasource getGridDBDatasource()
	{
		try
		{
			if(m_datasource == null)
			{
				long begintime = System.currentTimeMillis();
				
				String strJson = String.format("{\"Type\":\"%s\",\"Alias\":\"%s\",\"Server\":\"%s\",\"User\":\"%s\",\"Password\":\"%s\",\"DB\":\"%s\",\"Port\":\"%s\"}",
						datasourceConnectionConfigInfo.getType(), datasourceConnectionConfigInfo.getAlias(), datasourceConnectionConfigInfo.getServer(), 
						datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword(), datasourceConnectionConfigInfo.getDatabase(), 
						datasourceConnectionConfigInfo.getPort());	
				if(Application.m_workspace == null)
					Application.m_workspace = new Workspace();
				m_datasource = Application.m_workspace.OpenDatasource(strJson);
				LogTool.logger.info("打开数据源");
				
				long endtime = System.currentTimeMillis();
				LogTool.logger.info("打开数据源耗时：" + String.valueOf(endtime - begintime));
			}			
		}
		catch(Exception e)
		{
			LogTool.logger.error("打开格点数据源，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return m_datasource; 
	}
	
	/**
	 * 获取数据集
	 * @return
	 */
	public Dataset getDataset(String datasetName, Boolean findFromMetaData)
	{
		Dataset dataset = null;
		if(m_datasource == null)
			m_datasource = this.getGridDBDatasource();
		if(m_datasource == null)
			return dataset;
		else
			dataset = m_datasource.GetDataset(datasetName);
		
		if(dataset == null && findFromMetaData){ 
			if(this.existDataset(datasetName)){
				Application.m_workspace.CloseDatasource(m_datasource.GetAlias());
				LogTool.logger.info("关闭数据源");
				m_datasource = null;				
				m_datasource = this.getGridDBDatasource();
				if(m_datasource != null)
					dataset = m_datasource.GetDataset(datasetName);
				
				LogTool.logger.info("刷新数据源前："+m_datasource.GetDatasetCount());
				m_datasource.Refresh();
				LogTool.logger.info("刷新数据源后："+m_datasource.GetDatasetCount());
				dataset = m_datasource.GetDataset(datasetName);
			}
		}
		return dataset;
	}
	
	/*
	 * （根据MySQL的数据源元数据表）判断数据集是否存在
	 * */
	private Boolean existDataset(String datasetName){
		Boolean result = false;
		try {
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select count(*) as rowCount from mgdatasetrasterinfo where MGName='%s'", datasetName);
			ResultSet resultSet = stmt.executeQuery(sql);
			resultSet.next();
			int rowCount = resultSet.getInt("rowCount");
			result = rowCount>0;
			stmt.close();
			conn.close();
		 } 
		 catch (Exception e){
			 e.printStackTrace();
		 } 
		 return result;
	}
	
	/*
	 * 获取有效的数据源别名
	 * */
	private String getValidDatasourceAlias(String strAlias)
	{
		String result = strAlias;
		if(Application.m_workspace.GetDatasource(strAlias) != null)
		{
			int i = 0;
			while(true)
			{
				result = strAlias + String.valueOf(i);
				if(Application.m_workspace.GetDatasource(result) == null)
					break;
				i++;
			}	
		}		
		return result;
	}
	
//	private Boolean isGridProductType(String type)
//	{
//		return type.equals("BJ") || type.equals("OBJ") || type.equals("PRVN") || type.equals("CTY");
//	}
	
	/*
	 * 获取最新格点数据信息
	 * 参数：格点类型（数值模式类型或格点产品类型）
	 * 返回：时次、时效列表、要素列表、层次列表
	 * @return 
	 * */
	@POST
	@Path("getLastGridInfo")
	@Produces("application/json")
	public Object getLastGridInfo(@FormParam("para") String para)
	{
		LastGridInfo info  = new LastGridInfo();
		try {
		JSONObject jsonObject = new JSONObject(para);
		String type = CommonTool.getJSONStr(jsonObject, "type");
		
		String strStartWith = "t_" + type;
		ArrayList<String> datasetNamesArrayList = this.getDatasetNames(strStartWith);
		
		String strLastDateTime = null;
		int nIndexDateTime = 5; //时次索引
		ArrayList<String> strDatasetNames = new ArrayList<String>();
		ArrayList<String> datetimeSerial = new ArrayList<String>();       //时序，便于客户端上下翻
		for(Integer i=0; i<datasetNamesArrayList.size(); i++)
		{
			String strDatasetName = datasetNamesArrayList.get(i).toLowerCase();
			strDatasetNames.add(strDatasetName);
			String[] strs = strDatasetName.split("_");
			if(strs != null && strs.length >= 8)
			{			
				String strDateTime = strs[nIndexDateTime];
				if(strLastDateTime == null || strLastDateTime.compareTo(strDateTime) < 0)
					strLastDateTime = strDateTime;
				
				//记录历史时次
				String strDateTimeEntire = String.format("20%s-%s-%s %s:00:00", strDateTime.substring(0,2), strDateTime.substring(2,4), strDateTime.substring(4,6), strDateTime.substring(6,8));
				if(!datetimeSerial.contains(strDateTimeEntire))
					datetimeSerial.add(strDateTimeEntire);
			}
		}
		if(datetimeSerial.size() == 0)
		{
			System.out.println("getLastGridInfo 时序为空");
			return info;
		}
		Collections.sort(datetimeSerial); //时次排序
		ArrayList<String> strElements = new ArrayList<String>();
		ArrayList<String> strLevels = new ArrayList<String>();
		ArrayList<String> strHourSpans = new ArrayList<String>();
		for(Integer i=0; i<strDatasetNames.size(); i++)
		{
			String strDatasetName = strDatasetNames.get(i);
			String[] strs = strDatasetName.split("_");
			if(strs.length >= 8)
			{
				if(!strElements.contains(strs[2])) //要素要返回所有时次的预报要素
					strElements.add(strs[2]);	
				if(strDatasetName.contains(strLastDateTime))
				{	
						if(!strHourSpans.contains(strs[6]))
							strHourSpans.add(strs[6]);
						if(strs.length >= 8)
						{
							if(!strLevels.contains(strs[7]))
								strLevels.add(strs[7]);
						}
				}	
			}						
		}
		String elements = "";
		for(Integer i=0; i<strElements.size(); i++)
			elements+=strElements.get(i)+",";
		elements = elements.substring(0, elements.length() - 1);
		String levels = "";
		if(strLevels.size() > 0)
		{
			for(Integer i=0; i<strLevels.size(); i++)
				levels+=strLevels.get(i)+",";
			levels = levels.substring(0, levels.length() - 1);
		}		
		String hourspans = "";
		for(Integer i=0; i<strHourSpans.size(); i++)
		{
			Integer nHourSpan = Integer.valueOf(strHourSpans.get(i)); //去掉前面的0
			hourspans+=nHourSpan.toString()+",";
		}
		hourspans = hourspans.substring(0, hourspans.length() - 1);
		strLastDateTime = String.format("20%s-%s-%s %s:00:00", strLastDateTime.substring(0,2), strLastDateTime.substring(2,4), strLastDateTime.substring(4,6), strLastDateTime.substring(6,8)); 
		info.setDateTime(strLastDateTime);
		info.setElements(elements);
		info.setHourSpans(hourspans);
		info.setLevels(levels);
		info.setDatetimeSerial(datetimeSerial);
		} catch (Exception e) {
			LogTool.logger.error("获取最新格点数据信息，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return info;
	}
	
	/*
	 * （根据MySQL的数据源元数据表）获取数据集名
	 * */
	private ArrayList<String> getDatasetNames(String datasetNamePrefix){
		ArrayList<String> result = new ArrayList<String>();
		try {
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select MGName from mgdatasetrasterinfo where MGName like '%s%%'", datasetNamePrefix);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				result.add(resultSet.getString("MGName"));
			}
			stmt.close();
			conn.close();
		 } 
		 catch (Exception e){
			 e.printStackTrace();
		 } 
		 return result;
	}
	
	/*
	 * 根据要素，获取所有时效。不同要素，时效不同，比如24小时降水，时效为：24、48、72等
	 * 参数：类型
	 * 返回：时次
	 * @return 
	 * */
	@POST
	@Path("getHourSpanWithElement")
	@Produces("application/json")
	public Object getHourSpanWithElement(@FormParam("para") String para)
	{
		ArrayList<Integer> arrayHourSpan = new ArrayList<Integer>(); 
		try {
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			Date dateMake = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			String prefix = String.format("t_%s_%s_%s_%s_%s", type, element, new SimpleDateFormat("yyMMddHHmm").format(dateMake), version, new SimpleDateFormat("yyMMddHH").format(date));
			Integer nIndexHourSpan = 6;
			
			ArrayList<String> datasetNames = getDatasetNames(prefix);
			for(Integer i=0; i<datasetNames.size(); i++){
				String[] strs = datasetNames.get(i).split("_");
				if(strs != null && strs.length >= nIndexHourSpan)
				{			
					if(!arrayHourSpan.contains(strs[nIndexHourSpan]))
						arrayHourSpan.add(Integer.valueOf(strs[nIndexHourSpan]));
				}
			}
		} catch (Exception e) {
			LogTool.logger.error("根据要素，获取所有时效，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return arrayHourSpan;
	}
	
	/*
	 * 获取默认方案
	 * @return 
	 * */
	@POST
	@Path("getGridDefaultScheme")
	@Produces("application/json")
	public Object getGridDefaultScheme(@FormParam("para") String para)
	{
		ArrayList<Scheme> arrayScheme = new ArrayList<Scheme>(); 
		try {
			arrayScheme = this.getDefaultScheme();
		} catch (Exception e) {
			LogTool.logger.error("获取默认方案错误：" + e.getMessage());
			e.printStackTrace();
		}
		return arrayScheme;
	}
		
	/**
	 * 获取格点数据
	 * @return
	 */
	@POST
	@Path("getGrid")
	@Produces("application/json")
	public Object getGrid(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		GridData grid = new GridData();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");
			
			if(element.equals("10uv") || element.equals("wmax"))
			{
				String strDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
				String strDatasetNameU = strDatasetName+"_u";
				String strDatasetNameV = strDatasetName+"_v";
				Dataset dtU = this.getDataset(strDatasetNameU, true);
				Dataset dtV = this.getDataset(strDatasetNameV, true);
				if(dtU == null || dtV == null)
				{
					LogTool.logger.error("数据集不存在，详情【" + strDatasetName + "】");
				}	
				else
				{
					DatasetRaster dgU  = (DatasetRaster)dtU;
					dgU.CalcExtreme(); //极值未保存，放在内存，打开要算，数据修改后也要算
					DatasetRaster dgV  = (DatasetRaster)dtV;
					dgV.CalcExtreme(); //极值未保存，放在内存，打开要算，数据修改后也要算
					ArrayList<Double> dValues = new ArrayList<Double>();
					int cols = dgU.GetWidth();
					int rows = dgU.GetHeight();
					double noDataValue = dgU.GetNoDataValue();
					Scanline slU = new Scanline(dgU.GetValueType(), cols);
					Scanline slV = new Scanline(dgV.GetValueType(), cols);
					for(int i = rows - 1; i >= 0; i--)
					{	
						dgU.GetScanline(0, i, slU);
						dgV.GetScanline(0, i, slV);
						for(int j = 0; j<cols; j++)
						{							
							double u = slU.GetValue(j);
							double v = slV.GetValue(j);
							if(u == noDataValue || v == noDataValue)
							{
								dValues.add(noDataValue);
								dValues.add(noDataValue);	
							}
							else
							{
								Double dSpeed = Math.sqrt(u*u + v*v);
								Double dDirection = 270.0-Math.atan2(v, u)*180.0/Math.PI;
								dSpeed = Math.round(dSpeed*10.0)/10.0;
								dDirection = Math.round(dDirection*10.0)/10.0;
								dValues.add(dDirection);
								dValues.add(dSpeed);					
							}
						}
					}
					slU.Destroy();
					slV.Destroy();
					grid.setLeft(dgU.GetBounds().getX());
					grid.setBottom(dgU.GetBounds().getY());
					grid.setRight(dgU.GetBounds().getX() + dgU.GetBounds().getWidth());
					grid.setTop(dgU.GetBounds().getY() + dgU.GetBounds().getHeight());
					grid.setRows(dgU.GetHeight());
					grid.setCols(dgU.GetWidth());
					grid.setDValues(dValues);
					grid.setNoDataValue(dgU.GetNoDataValue());
				}	
			}
			else
			{
				String strDatasetName = getGridDatasetName(type, level, element ,maketime, version, date, hour);
				Dataset dt = this.getDataset(strDatasetName, true);
				if(dt == null)
				{
					LogTool.logger.error("数据集不存在，详情【" + strDatasetName + "】");
				}	
				else
				{
//					DatasetRaster dg  = (DatasetRaster)dt;
//					grid = Toolkit.convertDatasetRasterToGridData(dg);
					String strDatasetNameTag = strDatasetName+"_t";
					Dataset dtTag = this.getDataset(strDatasetNameTag, false);
					if(dtTag != null){ //有Tag属性
						DatasetRaster dg  = (DatasetRaster)dt;
						dg.Open();
						dg.CalcExtreme();
						DatasetRaster dgTag  = (DatasetRaster)dtTag;
						dgTag.CalcExtreme();
						ArrayList<Double> dValues = new ArrayList<Double>();
						int cols = dg.GetWidth();
						int rows = dg.GetHeight();
						Scanline sl = new Scanline(dg.GetValueType(), cols);
						Scanline slTag = new Scanline(dgTag.GetValueType(), cols);
						for(int i = rows - 1; i >= 0; i--)
						{	
							dg.GetScanline(0, i, sl);
							dgTag.GetScanline(0, i, slTag);
							for(int j = 0; j<cols; j++)
							{
								double val = sl.GetValue(j);
								double tag = slTag.GetValue(j);
								dValues.add(val);
								dValues.add(tag);	
							}
						}							
						grid.setLeft(dg.GetBounds().getX());
						grid.setBottom(dg.GetBounds().getY());
						grid.setRight(dg.GetBounds().getX() + dg.GetBounds().getWidth());
						grid.setTop(dg.GetBounds().getY() + dg.GetBounds().getHeight());
						grid.setRows(dg.GetHeight());
						grid.setCols(dg.GetWidth());
						grid.setDValues(dValues);
						grid.setNoDataValue(dg.GetNoDataValue());
					}
					else{ //无Tag属性
						DatasetRaster dg  = (DatasetRaster)dt;
						dg.CalcExtreme();
						grid = Toolkit.convertDatasetRasterToGridData(dg);
					}	
				}	
			}			
		} catch (Exception e) {
			LogTool.logger.error("获取格点数据失败，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("获取格点数据耗时：" + String.valueOf(endtime - begintime));
		return grid;
		//return result;
	}
	/**
	 * 获取格点数据
	 * @return
	 */
	@POST
	@Path("getGridHosAndIDW")
	@Produces("application/json")
	public Object getGridHosAndIDW(@FormParam("para") String para,@Context HttpServletRequest request) {
		GridData grid = new GridData();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String element = CommonTool.getJSONStr(jsonObject, "element");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");
			
			
			//数据日期
			Calendar cal=Calendar.getInstance();
			cal.add(Calendar.DAY_OF_MONTH,(hour/24)-1);
			Date useDate=cal.getTime();
			String strUseDate=new SimpleDateFormat("?MM?dd").format(useDate);
			strUseDate=strUseDate.replace("?", "%s");
			strUseDate=String.format(strUseDate, "M","D");
			
			String strStartDate=new SimpleDateFormat("?MM?dd").format(maketime);
			strStartDate=strStartDate.replace("?", "%s");
			strStartDate=String.format(strStartDate, "M","D");
			//获取数据库数据
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(),datasourceConnectionConfigInfo.getPort(),datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String tableName="";
			if(element.equals("2tjp"))
			{
				tableName="t_hos_avgtemp";
			}
			else
			{
				tableName="t_hos_rain";
			}
			String sql = String.format("select ts.StationNum,ts.Longitude,ts.Latitude,%s from %s tha left join t_station ts on tha.STATION_ID_C=ts.StationNum where STARTTIME='%s'",strUseDate,tableName,strStartDate);
			ResultSet resultSet = stmt.executeQuery(sql);
			//打开参照数据
			String realPath =  request.getSession().getServletContext().getRealPath("/");
			realPath=realPath.replace("\\", "/");
			String strAlias="T_CLIP";
			Datasource dsCLIP = Application.m_workspace.GetDatasource(strAlias);
			if(dsCLIP==null){
				String strJson = String.format("{\"Type\":\"ESRI Shapefile\",\"Alias\":\"%s\",\"Server\":\"%s\"}", "dsClip", realPath + "WEB-INF/data/T_CLIP.shp");
				dsCLIP = Application.m_workspace.OpenDatasource(strJson);
			}
			if(dsCLIP.GetDatasetCount()==0){
				System.out.println("数据集个数为0");
				return null;
			}
			Dataset datasetCLIP=dsCLIP.GetDataset(0);
			String str = "{\"Type\":\"Memory\",\"Alias\":\"dsHos\",\"Server\":\"\"}";
			Datasource ds=Application.m_workspace.CreateDatasource(str);
			str = "{\"Name\":\"dtHos\",\"Type\":\"Point\"}";
			DatasetVector dv=ds.CreateDatasetVector(str);
			dv.SetProjection(datasetCLIP.GetProjection().GetParams());
			dv.SetBounds(datasetCLIP.GetBounds());
			dv.AddField("{\"Name\":\"StationNum\",\"Type\":\"String\"}");
			dv.AddField("{\"Name\":\"Longitude\",\"Type\":\"Double\"}");
			dv.AddField("{\"Name\":\"Latitude\",\"Type\":\"Double\"}");
			dv.AddField("{\"Name\":\"Score\",\"Type\":\"Double\"}");
			Recordset prs=dv.Query(null, null);
			prs.MoveFirst();
			while(resultSet.next()){
				String sn=resultSet.getString(1);
				Double lon=resultSet.getDouble(2);
				Double lat=resultSet.getDouble(3);
				Double val=resultSet.getDouble(4);
				GeoPoint gp=new GeoPoint(lon,lat);
				prs.AddNew(gp);
				prs.SetFieldValue("StationNum", sn);
				prs.SetFieldValue("Score",val);
				prs.Update();
			}
			prs.Destroy();
			//插值
			Analyst pAnalyst = Analyst.CreateInstance("IDW", Application.m_workspace);
			str = "{\"Datasource\":\"dsHos\",\"Dataset\":\"dtHos\"}";
			pAnalyst.SetPropertyValue("Point", str);
			pAnalyst.SetPropertyValue("Field", "Score");//插值字段
			Rectangle2D rc = new Rectangle2D.Double(96.5, 25.5, 12.5, 9.0);
			str = String.format("{\"left\":%f,\"bottom\":%f,\"right\":%f,\"top\":%f}",rc.getX(), rc.getY(), rc.getX() + rc.getWidth(), rc.getY() + rc.getHeight());
			pAnalyst.SetPropertyValue("Bounds", str);
			pAnalyst.SetPropertyValue("CellSize", "0.05 0.05");
			pAnalyst.SetPropertyValue("CellValueType", "Single");
			pAnalyst.SetPropertyValue("SearchMode", "RadiusVariable");
			str = String.format("{\"PointCount\":%d,\"MaxRadius\":%d}", 12, 0);
			pAnalyst.SetPropertyValue("RadiusVariable", str);
			pAnalyst.SetPropertyValue("Power", "2");
			pAnalyst.SetPropertyValue("CrossValidation", "false"); //是否交叉验证，默认值为false
			str = "{\"Type\":\"Memory\",\"Alias\":\"Score\",\"Server\":\"\"}";
			Application.m_workspace.CloseDatasource("Score");
			Datasource DSOut=Application.m_workspace.CreateDatasource(str);
			str = "{\"Datasource\":\"Score\",\"Dataset\":\"Raster\"}";
			pAnalyst.SetPropertyValue("Raster", str);
			pAnalyst.Execute();
			DatasetRaster dsResult=(DatasetRaster) DSOut.GetDataset(0);
			dsResult.CalcExtreme();
			
			dsResult.Open();
			ArrayList<Double> dValues = new ArrayList<Double>();
			int cols = dsResult.GetWidth()-1;
			int rows = dsResult.GetHeight()-1;
			Scanline sl = new Scanline(dsResult.GetValueType(), cols);
			DecimalFormat df= new DecimalFormat("#0.00");
			for(int i = rows - 1; i >= 0; i--)
			{	
				dsResult.GetScanline(0, i, sl);
				for(int j = 0; j<cols; j++)
				{
					double val = sl.GetValue(j);
					dValues.add(val);
				}
			}								
			grid.setLeft(dsResult.GetBounds().getX());
			grid.setBottom(dsResult.GetBounds().getY());
			grid.setRight(dsResult.GetBounds().getX() + dsResult.GetBounds().getWidth());
			grid.setTop(dsResult.GetBounds().getY() + dsResult.GetBounds().getHeight());
			grid.setRows(rows);
			grid.setCols(cols);
			grid.setDValues(dValues);
			grid.setNoDataValue(dsResult.GetNoDataValue());
		}
		catch(Exception ex){
			ex.printStackTrace();
		}
			
		return grid;
	}
	
	/**
	 * 批量获取格点数据集合，按要素获取全部时效的格点预报产品
	 * @return
	 */
	@POST
	@Path("getGrids")
	@Produces("application/json")
	public Object getGrids(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		ArrayList<GridData> grids = new ArrayList<GridData>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			String strHourSpans = CommonTool.getJSONStr(jsonObject, "hourspans");
			String[] hourSpans = strHourSpans.split(",");
			
			int nindex = 0;
			for(String hourSpan : hourSpans){
				GridData grid = new GridData();
				try
				{					
					Integer hour = Integer.valueOf(hourSpan);
					if(element.equals("10uv") || element.equals("wmax"))
					{
						String strDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
						String strDatasetNameU = strDatasetName+"_u";
						String strDatasetNameV = strDatasetName+"_v";
						Dataset dtU = this.getDataset(strDatasetNameU, nindex==0);
						Dataset dtV = this.getDataset(strDatasetNameV, nindex==0);
						if(dtU == null || dtV == null)
						{
							//LogTool.logger.error("数据集不存在，详情【" + strDatasetName + "】");
						}	
						else
						{
							DatasetRaster dgU  = (DatasetRaster)dtU;
							dgU.CalcExtreme(); //极值未保存，放在内存，打开要算，数据修改后也要算
							DatasetRaster dgV  = (DatasetRaster)dtV;
							dgV.CalcExtreme(); //极值未保存，放在内存，打开要算，数据修改后也要算
							ArrayList<Double> dValues = new ArrayList<Double>();
							int cols = dgU.GetWidth();
							int rows = dgU.GetHeight();
							double noDataValue = dgU.GetNoDataValue();
							Scanline slU = new Scanline(dgU.GetValueType(), cols);
							Scanline slV = new Scanline(dgV.GetValueType(), cols);
							for(int i = rows - 1; i >= 0; i--)
							{	
								dgU.GetScanline(0, i, slU);
								dgV.GetScanline(0, i, slV);
								for(int j = 0; j<cols; j++)
								{
									double u = slU.GetValue(j);
									double v = slV.GetValue(j);
									if(u == noDataValue || v == noDataValue)
									{
										dValues.add(noDataValue);
										dValues.add(noDataValue);	
									}
									else
									{
										Double dSpeed = Math.sqrt(u*u + v*v);
										Double dDirection = 270.0-Math.atan2(v, u)*180.0/Math.PI;
										dSpeed = Math.round(dSpeed*10.0)/10.0;
										dDirection = Math.round(dDirection*10.0)/10.0;
										dValues.add(dDirection);
										dValues.add(dSpeed);					
									}
								}
							}							
							grid.setLeft(dgU.GetBounds().getX());
							grid.setBottom(dgU.GetBounds().getY());
							grid.setRight(dgU.GetBounds().getX() + dgU.GetBounds().getWidth());
							grid.setTop(dgU.GetBounds().getY() + dgU.GetBounds().getHeight());
							grid.setRows(dgU.GetHeight());
							grid.setCols(dgU.GetWidth());
							grid.setDValues(dValues);
							grid.setNoDataValue(dgU.GetNoDataValue());
						}	
					}
					else
					{
						String strDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
						Dataset dt = this.getDataset(strDatasetName, nindex == 0);
						if(dt == null)
						{
							//LogTool.logger.error("数据集不存在，详情【" + strDatasetName + "】");
						}	
						else
						{
							String strDatasetNameTag = strDatasetName+"_t";
							Dataset dtTag = this.getDataset(strDatasetNameTag, false);
							if(dtTag != null){ //有Tag属性
								DatasetRaster dg  = (DatasetRaster)dt;
								dg.CalcExtreme();
								DatasetRaster dgTag  = (DatasetRaster)dtTag;
								dgTag.CalcExtreme();
								ArrayList<Double> dValues = new ArrayList<Double>();
								int cols = dg.GetWidth();
								int rows = dg.GetHeight();
								Scanline sl = new Scanline(dg.GetValueType(), cols);
								Scanline slTag = new Scanline(dgTag.GetValueType(), cols);
								for(int i = rows - 1; i >= 0; i--)
								{	
									dg.GetScanline(0, i, sl);
									dgTag.GetScanline(0, i, slTag);
									for(int j = 0; j<cols; j++)
									{
										double val = sl.GetValue(j);
										double tag = slTag.GetValue(j);
										dValues.add(val);
										dValues.add(tag);	
									}
								}							
								grid.setLeft(dg.GetBounds().getX());
								grid.setBottom(dg.GetBounds().getY());
								grid.setRight(dg.GetBounds().getX() + dg.GetBounds().getWidth());
								grid.setTop(dg.GetBounds().getY() + dg.GetBounds().getHeight());
								grid.setRows(dg.GetHeight());
								grid.setCols(dg.GetWidth());
								grid.setDValues(dValues);
								grid.setNoDataValue(dg.GetNoDataValue());
							}
							else{ //无Tag属性
								DatasetRaster dg  = (DatasetRaster)dt;
								grid = Toolkit.convertDatasetRasterToGridData(dg);
							}							
						}	
					}					
				}
				catch(Exception ex){
					LogTool.logger.error("时效："+ hourSpan +"小时，获取格点数据失败，详情【" + ex.getMessage() + "】");
				}
				grids.add(grid);
				nindex++;
			}
		} catch (Exception e) {
			LogTool.logger.error("批量获取格点数据失败，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("批量获取格点数据耗时：" + String.valueOf(endtime - begintime));
		return grids;
	}
	/**
	 * 批量获取格点数据集合，按要素获取全部时效的格点预报产品
	 * @return
	 */
	@POST
	@Path("get11to30JuPingGrids")
	@Produces("application/json")
	public Object get11to30JuPingGrids(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		GridData resultGrid=new GridData();//结果格点
		ArrayList<GridData> grids = new ArrayList<GridData>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			String[] hourSpans ={"264","288","312","336","360","384","408","432","456","480","504","528","552","576","600","624","648","672","696","720"};
			if(element.contains("2t"))//先这样设计
			{
				element="2t";
			}
			else if(element.contains("r24"))
			{
				element="r24";
			}
			else
			{
				
			}
			int nindex = 0;
			for(String hourSpan : hourSpans){
				GridData grid = new GridData();
				try
				{					
					Integer hour = Integer.valueOf(hourSpan);
					String strDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
					Dataset dt = this.getDataset(strDatasetName, nindex == 0);
					if(dt == null)
					{
					}	
					else
					{
						String strDatasetNameTag = strDatasetName+"_t";
						Dataset dtTag = this.getDataset(strDatasetNameTag, false);
						if(dtTag != null){ //有Tag属性
							DatasetRaster dg  = (DatasetRaster)dt;
							dg.CalcExtreme();
							DatasetRaster dgTag  = (DatasetRaster)dtTag;
							dgTag.CalcExtreme();
							ArrayList<Double> dValues = new ArrayList<Double>();
							int cols = dg.GetWidth();
							int rows = dg.GetHeight();
							Scanline sl = new Scanline(dg.GetValueType(), cols);
							Scanline slTag = new Scanline(dgTag.GetValueType(), cols);
							for(int i = rows - 1; i >= 0; i--)
							{	
								dg.GetScanline(0, i, sl);
								dgTag.GetScanline(0, i, slTag);
								for(int j = 0; j<cols; j++)
								{
									double val = sl.GetValue(j);
									double tag = slTag.GetValue(j);
									dValues.add(val);
									dValues.add(tag);	
								}
							}							
							grid.setLeft(dg.GetBounds().getX());
							grid.setBottom(dg.GetBounds().getY());
							grid.setRight(dg.GetBounds().getX() + dg.GetBounds().getWidth());
							grid.setTop(dg.GetBounds().getY() + dg.GetBounds().getHeight());
							grid.setRows(dg.GetHeight());
							grid.setCols(dg.GetWidth());
							grid.setDValues(dValues);
							grid.setNoDataValue(dg.GetNoDataValue());
						}
						else{ //无Tag属性
							DatasetRaster dg  = (DatasetRaster)dt;
							grid = Toolkit.convertDatasetRasterToGridData(dg);
						}							
					}						
				}
				catch(Exception ex){
					LogTool.logger.error("时效："+ hourSpan +"小时，获取格点数据失败，详情【" + ex.getMessage() + "】");
				}
				grids.add(grid);
				nindex++;
			}
			//初始化结果数据集
			resultGrid.setLeft(grids.get(0).getLeft());
			resultGrid.setBottom(grids.get(0).getBottom());
			resultGrid.setRight(grids.get(0).getRight());
			resultGrid.setTop(grids.get(0).getTop());
			resultGrid.setRows(grids.get(0).getRows());
			resultGrid.setCols(grids.get(0).getCols());
			resultGrid.setNoDataValue(grids.get(0).getNoDataValue());
			Boolean bFirst=true;
			ArrayList<Double> dValues = new ArrayList<Double>();
			if(element.equals("2t")){//气温求平均
				for(GridData gd:grids){
					if(bFirst){//第一个
						dValues=gd.getDValues();
						bFirst=false;
					}
					else{
						ArrayList<Double> thisValues=gd.getDValues();
						for(int i=0;i<dValues.size();i++){
							Double oldVal=dValues.get(i);
							Double newVal=thisValues.get(i);
							dValues.set(i, (oldVal+newVal)/2.0);
						}
					}
				}
			}
			else if(element.equals("r24")){//降水累加
				for(GridData gd:grids){
					if(bFirst){//第一个
						dValues=gd.getDValues();
						bFirst=false;
					}
					else{
						ArrayList<Double> thisValues=gd.getDValues();
						for(int i=0;i<dValues.size();i++){
							Double oldVal=dValues.get(i);
							Double newVal=thisValues.get(i);
							dValues.set(i, oldVal+newVal);
						}
					}
				}
			}
			else
			{
				
			}
			resultGrid.setDValues(dValues);
			//获取11到30天的历史资料
			DataSource dataSource=DataSource.getInstance();
			Connection conn=dataSource.getConnection();
			Statement  stmt = conn.createStatement();
			String tableName="";
			if(element.equals("2t"))
			{
				tableName="t_hos_avgtemp";
			}
			else
			{
				tableName="t_hos_rain";
			}
			//获取日期列
			String strStartDate=new SimpleDateFormat("?MM?dd").format(maketime);
			strStartDate=strStartDate.replace("?", "%s");
			strStartDate=String.format(strStartDate, "M","D");
			
			Calendar cal=Calendar.getInstance();
			cal.setTime(maketime);
			cal.add(Calendar.DAY_OF_MONTH,10);
			String dateCol="";
			for(int d=10;d<30;d++){//11到30天
				Date useDate=cal.getTime();
				String strUseDate=new SimpleDateFormat("?MM?dd").format(useDate);
				strUseDate=strUseDate.replace("?", "%s");
				strUseDate=String.format(strUseDate, "M","D");
				dateCol+=strUseDate+",";
				cal.add(Calendar.DAY_OF_MONTH,1);//每次加1天
			}
			dateCol=dateCol.substring(0,dateCol.length()-1);
			String sql = String.format("select ts.StationNum,ts.Longitude,ts.Latitude,%s from %s tha left join t_station ts on tha.STATION_ID_C=ts.StationNum where STARTTIME='%s'",dateCol,tableName,strStartDate);
			LogTool.logger.info("sql:"+sql);
			ResultSet resultSet = stmt.executeQuery(sql);
			//新建站点失量数据
			String str = "{\"Type\":\"Memory\",\"Alias\":\"dsHos\",\"Server\":\"\"}";
			Datasource dsStation=null;
			DatasetVector dvStation=null;
			try{
				Application.m_workspace.CloseDatasource("dsHos");//不管有没有，先关闭
				dsStation=Application.m_workspace.CreateDatasource(str);
				str = "{\"Name\":\"dtHos\",\"Type\":\"Point\"}";
				dvStation=dsStation.CreateDatasetVector(str);
				dvStation.SetProjection("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
				dvStation.AddField("{\"Name\":\"StationNum\",\"Type\":\"String\"}");
				dvStation.AddField("{\"Name\":\"Longitude\",\"Type\":\"Double\"}");
				dvStation.AddField("{\"Name\":\"Latitude\",\"Type\":\"Double\"}");
				dvStation.AddField("{\"Name\":\"Score\",\"Type\":\"Double\"}");
				Recordset prs=dvStation.Query(null, null);
				prs.MoveFirst();
				double left=9999;
				double bottom=9999;
				double right=-9999;
				double top=-9999;
				while(resultSet.next()){
					String sn=resultSet.getString(1);
					Double lon=resultSet.getDouble(2);
					Double lat=resultSet.getDouble(3);
					//计算值
					Double sum=0.0;
					for(int c=4;c<24;c++){
						sum+=resultSet.getDouble(c);
					}
					GeoPoint gp=new GeoPoint(lon,lat);
					prs.AddNew(gp);
					prs.SetFieldValue("StationNum", sn);
					if(element.equals("2t"))//计算11-30天平均气温
					{
						prs.SetFieldValue("Score",sum/20);
					}
					else
					{
						prs.SetFieldValue("Score",sum);
					}
					prs.Update();
					
					if(lon < left)
						left = lon;
					if(lat < bottom)
						bottom = lat;
					if(lon > right)
						right = lon;
					if(lat > top)
						top = lat;
				}
				dvStation.SetBounds(new Rectangle2D.Double(left, bottom, right-left, top-bottom));		
				prs.Destroy();
			}
			catch(Exception ex){
				LogTool.logger.error("创建失量数据出错!");
			}
			finally{
				stmt.close();
				conn.close();
			}
			//插值
			RasterService rs=new RasterService();
			Rectangle2D rc = new Rectangle2D.Double(resultGrid.getLeft(),resultGrid.getBottom(),resultGrid.getRight()-resultGrid.getLeft(),resultGrid.getTop() - resultGrid.getBottom());
			rs.IDW(dvStation, "Score", rc, 0.05, "tempDS","tempDR");
			Datasource resultDS=Application.m_workspace.GetDatasource("tempDS");
			if(resultDS==null)
			{
				LogTool.logger.error("返回目标数据源不存在!");
			}
			DatasetRaster drResult=(DatasetRaster)resultDS.GetDataset("tempDR");
			if(drResult==null)
			{
				LogTool.logger.error("返回目标数据集不存在!");
			}
			drResult.Open();
			dValues = new ArrayList<Double>();
			int cols = drResult.GetWidth()-1;//不知为何多了一行一列
			int rows = drResult.GetHeight()-1;
			Scanline sl = new Scanline(drResult.GetValueType(), cols);
			for(int i = rows - 1; i >= 0; i--)
			{	
				drResult.GetScanline(0, i, sl);
				for(int j = 0; j<cols; j++)
				{
					double val = sl.GetValue(j);
					dValues.add(val);
				}
			}
			//resultGrid.setDValues(dValues);//写到此处只为测试
			//求温度的距平，降水的距平率
			ArrayList<Double> dValuesOld=resultGrid.getDValues();
			for(int a=0;a<dValuesOld.size();a++){
				if(a<dValues.size()){
					Double oldVal=dValuesOld.get(a);
					Double newVal=dValues.get(a);
					Double val=oldVal-newVal;
					if(element.equals("2t")){
						dValues.set(a, val);
					}
					else if(element.equals("r24")){
						if(oldVal==0){
							val=0.0;
						}
						else{
							val=100*val/newVal;
						}
						dValues.set(a, val);
					}
				}
			}
			resultGrid.setDValues(dValues);
		} catch (Exception e) {
			LogTool.logger.error("批量获取格点数据失败，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("批量获取格点数据耗时：" + String.valueOf(endtime - begintime));
		return resultGrid;
	}
	
	/**
	 * 获取格点产品信息
	 * @return
	 */
	@POST
	@Path("getGridInfo")
	@Produces("application/json")
	public Object getGridInfo(@FormParam("para") String para) {
		ArrayList<GridInfo> gis = new ArrayList<GridInfo>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String departCode = CommonTool.getJSONStr(jsonObject, "departCode");
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String maketime = CommonTool.getJSONStr(jsonObject, "maketime");
			String version = CommonTool.getJSONStr(jsonObject, "version");
			String forecastTime = CommonTool.getJSONStr(jsonObject, "datetime");
			gis = this.queryGridInfo(departCode, type, element, maketime, version, forecastTime);
		} catch (Exception e) {
			LogTool.logger.error("获取格点产品信息，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return gis;
	}
	
	/**
	 * 获取（全部要素）格点产品信息
	 * @return
	 */
	@POST
	@Path("getGridInfos")
	@Produces("application/json")
	public Object getGridInfos(@FormParam("para") String para) {
		ArrayList<GridInfo> gis = new ArrayList<GridInfo>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String departCode = CommonTool.getJSONStr(jsonObject, "departCode");
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String maketime = CommonTool.getJSONStr(jsonObject, "maketime");
			String version = CommonTool.getJSONStr(jsonObject, "version");
			String forecastTime = CommonTool.getJSONStr(jsonObject, "datetime");
			gis = this.queryGridInfo(departCode, type, maketime, version, forecastTime);
		} catch (Exception e) {
			LogTool.logger.error("获取格点产品信息，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return gis;
	}
	
	/**
	 * 调用（时效对应的）数值模式
	 * @return
	 */
	@POST
	@Path("callModel")
	@Produces("application/json")
	public Object callModel(@FormParam("para") String para) {
		GridData plot = new GridData();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String model = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String strMakeTime = CommonTool.getJSONStr(jsonObject, "maketime");
			Date dateModelMake = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strMakeTime); //（原始参考场）制作时次
			String strDateTime = CommonTool.getJSONStr(jsonObject, "datetime");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strDateTime); //（目标场）预报时次
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");
			
			Date dateModel = null;
			if(model.equals("prvn") || model.equals("cty")|| model.equals("cnty")) //省市县：根据制作时间获取预报时间
			{
//				List<Date> dts = this.getGridProductLastDateTime(model, element, strDateTime);
//				if(dts.size() == 2){
//					dateModel = dts.get(0);
//					dateModelMake = dts.get(1);
//				}

				String strMakeTimeHHmm = new SimpleDateFormat("HH:mm").format(dateModelMake);
				Class.forName("com.mysql.jdbc.Driver");
				Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
						datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
				Statement  stmt = conn.createStatement();
				String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", model, strMakeTimeHHmm);
				ResultSet resultSet = stmt.executeQuery(sql);
				int forecastHour = -1;
				while(resultSet.next()) {
					forecastHour = resultSet.getInt("forecastHour");
					break;
				}
				stmt.close();
				conn.close();
				dateModel = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strMakeTime);
				dateModel.setHours(forecastHour);
			}
			else //模式：预报时间等于制作时间
			{
//				dateModel = this.getLastDateTime(model, element);
//				dateModelMake = dateModel;
				dateModel = dateModelMake;
			}
			
			if(dateModel != null)
			{
				long diff = date.getTime() - dateModel.getTime();
				int offsetHours = (int)(diff / (1000 * 60 * 60));
				
				int nHourSpan = hour;
				int nHourSpanModel = nHourSpan + offsetHours;
				String strDateModelMake = new SimpleDateFormat("yyMMddHHmm").format(dateModelMake);
				String strDateModel = new SimpleDateFormat("yyMMddHH").format(dateModel);
				String strDatasetName = String.format("t_%s_%s_%s_%s_%s_%s_%s", model, element, strDateModelMake, "p", strDateModel, new DecimalFormat("000").format(nHourSpanModel), level);				
				if(element.toLowerCase().equals("10uv") || element.toLowerCase().equals("wmax"))
				{
					String strDatasetNameU = strDatasetName+"_u";
					String strDatasetNameV = strDatasetName+"_v";
					Dataset dtU = this.getDataset(strDatasetNameU, true);
					Dataset dtV = this.getDataset(strDatasetNameV, true);
					if(dtU == null || dtV == null)
					{
						LogTool.logger.error("调用模式预报：未找到" + strDatasetName);
					}	
					else
					{
						DatasetRaster dgU  = (DatasetRaster)dtU;
						dgU.CalcExtreme();
						DatasetRaster dgV  = (DatasetRaster)dtV;
						dgV.CalcExtreme();
						ArrayList<Double> dValues = new ArrayList<Double>();
						int cols = dgU.GetWidth();
						int rows = dgU.GetHeight();
						double noDataValue = dgU.GetNoDataValue();
						for(int i = rows - 1; i >= 0; i--)
						{	
							for(int j = 0; j<cols; j++)
							{							
								double u = dgU.GetValue(j, i);
								double v = dgV.GetValue(j, i);
								if(u == noDataValue || v == noDataValue)
								{
									dValues.add(noDataValue);
									dValues.add(noDataValue);	
								}
								else
								{
									Double dSpeed = Math.sqrt(u*u + v*v);
									Double dDirection = 270.0-Math.atan2(v, u)*180.0/Math.PI;
									dValues.add(dDirection);
									dValues.add(dSpeed);					
								}
							}
						}
						plot.setLeft(dgU.GetBounds().getX());
						plot.setBottom(dgU.GetBounds().getY());
						plot.setRight(dgU.GetBounds().getX() + dgU.GetBounds().getWidth());
						plot.setTop(dgU.GetBounds().getY() + dgU.GetBounds().getHeight());
						plot.setRows(dgU.GetHeight());
						plot.setCols(dgU.GetWidth());
						plot.setDValues(dValues);
						plot.setNoDataValue(dgU.GetNoDataValue());						
					}	
				}
				else
				{
					Dataset dt = this.getDataset(strDatasetName, true);
					if(dt == null)
					{
						LogTool.logger.error("调用模式预报：未找到" + strDatasetName);
					}	
					else
					{
						DatasetRaster dg  = (DatasetRaster)dt;
						plot = Toolkit.convertDatasetRasterToGridData(dg);
					}	
				}
				plot.setNWPModelTime(new SimpleDateFormat("yyMMddHH").format(dateModel));
			}
		} catch (Exception e) {
			LogTool.logger.error("调用模式预报，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return  plot;
	}
	
	/**
	 * 调用（时效对应的）数值模式集合，要素所有时效
	 * @return
	 */
	@POST
	@Path("callModels")
	@Produces("application/json")
	public Object callModels(@FormParam("para") String para) {
		ArrayList<GridData> grids = new ArrayList<GridData>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String model = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String strMakeTime = CommonTool.getJSONStr(jsonObject, "maketime");
			Date dateModelMake = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strMakeTime); //（原始参考场）制作时次
			String strDateTime = CommonTool.getJSONStr(jsonObject, "datetime");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strDateTime); //（目标场）预报时次
			String strHourSpans = CommonTool.getJSONStr(jsonObject, "hourspans");
			String[] hourSpans = strHourSpans.split(",");
			
			//Date dateModel = this.getLastDateTime(model, element);
			Date dateModel = null;
			if(model.equals("prvn") || model.equals("cty")|| model.equals("cnty")) //省市县：根据制作时间获取预报时间
			{
//				List<Date> dts = this.getGridProductLastDateTime(model, element, strDateTime);
//				if(dts.size() == 2){
//					dateModel = dts.get(0);
//					dateModelMake = dts.get(1);
//				}

				String strMakeTimeHHmm = new SimpleDateFormat("HH:mm").format(dateModelMake);
				Class.forName("com.mysql.jdbc.Driver");
				Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
						datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
				Statement  stmt = conn.createStatement();
				String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", model, strMakeTimeHHmm);
				ResultSet resultSet = stmt.executeQuery(sql);
				int forecastHour = -1;
				while(resultSet.next()) {
					forecastHour = resultSet.getInt("forecastHour");
					break;
				}
				stmt.close();
				conn.close();
				dateModel = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strMakeTime);
				dateModel.setHours(forecastHour);
			}
			else //模式：预报时间等于制作时间
			{
//				dateModel = this.getLastDateTime(model, element);
//				dateModelMake = dateModel;
				dateModel = dateModelMake;
			}
			
			if(dateModel != null)
			{				
				int nindex = 0;
				long diff = date.getTime() - dateModel.getTime();
				int offsetHours = (int)(diff / (1000 * 60 * 60));
				Boolean hasRefresh=false;
				for(String hourSpan : hourSpans){
					Integer hour = Integer.valueOf(hourSpan);
					GridData grid = new GridData();
					try
					{
						int nHourSpan = hour;
						int nHourSpanModel = nHourSpan + offsetHours;
						
						//String strDatasetName = String.format("t_%s_%s_%s_%s_%s", model, element, new SimpleDateFormat("yyMMddHH").format(dateModel), new DecimalFormat("000").format(nHourSpanModel), level);
						String strDateModelMake = new SimpleDateFormat("yyMMddHHmm").format(dateModelMake);
						String strDateModel = new SimpleDateFormat("yyMMddHH").format(dateModel);
						String strDatasetName = String.format("t_%s_%s_%s_%s_%s_%s_%s", model, element, strDateModelMake, "p", strDateModel, new DecimalFormat("000").format(nHourSpanModel), level);
						if(element.toLowerCase().equals("10uv") || element.toLowerCase().equals("wmax"))
						{
							String strDatasetNameU = strDatasetName+"_u";
							String strDatasetNameV = strDatasetName+"_v";
							Dataset dtU = this.getDataset(strDatasetNameU, false);
							Dataset dtV = this.getDataset(strDatasetNameV, false);
							//保证只刷新一次
							if(dtU == null && !hasRefresh){
								dtU = this.getDataset(strDatasetNameU, true);
								dtV = this.getDataset(strDatasetNameV, false);
								hasRefresh = true;
							}
							
							if(dtU == null || dtV == null)
							{
								LogTool.logger.error("调用模式预报：未找到" + strDatasetName);
							}	
							else
							{
								DatasetRaster dgU  = (DatasetRaster)dtU;
								dgU.CalcExtreme();
								DatasetRaster dgV  = (DatasetRaster)dtV;
								dgV.CalcExtreme();
								ArrayList<Double> dValues = new ArrayList<Double>();
								int cols = dgU.GetWidth();
								int rows = dgU.GetHeight();
								double noDataValue = dgU.GetNoDataValue();
								for(int i = rows - 1; i >= 0; i--)
								{	
									for(int j = 0; j<cols; j++)
									{							
										double u = dgU.GetValue(j, i);
										double v = dgV.GetValue(j, i);
										if(u == noDataValue || v == noDataValue)
										{
											dValues.add(noDataValue);
											dValues.add(noDataValue);	
										}
										else
										{
											Double dSpeed = Math.sqrt(u*u + v*v);
											Double dDirection = 270.0-Math.atan2(v, u)*180.0/Math.PI;
											dValues.add(dDirection);
											dValues.add(dSpeed);					
										}
									}
								}
								grid.setLeft(dgU.GetBounds().getX());
								grid.setBottom(dgU.GetBounds().getY());
								grid.setRight(dgU.GetBounds().getX() + dgU.GetBounds().getWidth());
								grid.setTop(dgU.GetBounds().getY() + dgU.GetBounds().getHeight());
								grid.setRows(dgU.GetHeight());
								grid.setCols(dgU.GetWidth());
								grid.setDValues(dValues);
								grid.setNoDataValue(dgU.GetNoDataValue());						
							}	
						}
						else
						{
							Dataset dt = this.getDataset(strDatasetName, false);
							//保证只刷新一次
							if(dt == null && !hasRefresh){
								dt = this.getDataset(strDatasetName, true);
								hasRefresh = true;
							}
							
							if(dt == null)
							{
								if((element.equals("tmax") || element.equals("tmin")) && offsetHours%24==12){
									Integer offsetHoursTemp = 0;
									Integer nHourForecast = date.getHours();
									Integer nHourModel = dateModel.getHours();
									if(element.equals("tmax")){
										offsetHoursTemp = offsetHours/24*24 + nHourForecast==20&&nHourModel==8?24:0;
									}
									else if(element.equals("tmin")){
										offsetHoursTemp = offsetHours/24*24 + nHourForecast==20&&nHourModel==8?0:24;
									}
									nHourSpanModel = nHourSpan + offsetHoursTemp;
									strDatasetName = String.format("t_%s_%s_%s_%s_%s_%s_%s", model, element, strDateModelMake, "p", strDateModel, new DecimalFormat("000").format(nHourSpanModel), level);
									dt = this.getDataset(strDatasetName, nindex==0);
								}
								
								LogTool.logger.error("调用模式预报：未找到" + strDatasetName);
							}	
							
							if(dt != null)
							{
								DatasetRaster dg  = (DatasetRaster)dt;
								grid = Toolkit.convertDatasetRasterToGridData(dg);
							}	
						}
						grid.setNWPModelTime(new SimpleDateFormat("yyMMddHH").format(dateModel));
					}
					catch(Exception ex){
						LogTool.logger.error("时效："+ hourSpan +"小时，获取格点数据失败，详情【" + ex.getMessage() + "】");
					}
					grids.add(grid);
					nindex++;
				}	
			}
		} catch (Exception e) {
			LogTool.logger.error("调用数值模式集合，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return  grids;
	}
	
	/**
	 * 获取数值模式预报最新时次
	 * @return
	 */
	@POST
	@Path("getNWPModelLastDate")
	@Produces("application/json")
	public Object getNWPModelLastDate(@FormParam("para") String para) {
		String result = "";
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String model = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			
			Date dateModel = this.getLastDateTime(model, element);
			if(dateModel != null)
				result = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dateModel);
		} catch (Exception e) {
			LogTool.logger.error("获取数值模式预报最新时次，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result;
	}

	/*
	 * 获取指定模式最新预报时间 
	 * 
	 * */
	private Date getLastDateTime(String type, String element)
	{
		String strStartWith = String.format("t_%s_%s", type, element);
		ArrayList<String> datasetNames = getDatasetNames(strStartWith);
		
		String strLastDateTime = null;
		int nIndexDateTime = 5; //时次索引
		for(Integer i=0; i<datasetNames.size(); i++)
		{
			String strDatasetName = datasetNames.get(i).toLowerCase();
			String[] strs = strDatasetName.split("_");
			if(strs != null && strs.length >= 8)
			{			
				String strDateTime = strs[nIndexDateTime];
				if(strLastDateTime == null || strLastDateTime.compareTo(strDateTime) < 0)
					strLastDateTime = strDateTime;
			}
		}
		
		Date date = null;
		SimpleDateFormat sdf =  new SimpleDateFormat("yyyyMMddHH:mm:ss");
		if(strLastDateTime != null){
			try {
				strLastDateTime = "20"+strLastDateTime+":00:00";
				date = sdf.parse(strLastDateTime);
			} catch (ParseException e) {
				e.printStackTrace();
			}	
		}		
		return date;
	}
	
	/**
	 * 获取（格点预报产品）上一期时间
	 * @return
	 */
	@POST
	@Path("getGridProductLastDate")
	@Produces("application/json")
	public Object getGridProductLastDate(@FormParam("para") String para) {
		//ArrayList<String> result = new ArrayList<String>();
		String result = "";
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String forecastTime = CommonTool.getJSONStr(jsonObject, "forecastTime");
			List<Date> dts = this.getGridProductLastDateTime(type, element, forecastTime);
			if(dts.size() == 2){
				Date dtForecastTime = dts.get(0);
				Date dtMakeTime = dts.get(1);
				if(dtForecastTime != null && dtMakeTime != null){
//					result.add(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dtMakeTime));
//					result.add(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dtForecastTime));	
					result = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dtMakeTime);
				}	
			}
		} catch (Exception e) {
			LogTool.logger.error("获取上一期预报时间，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result;
	}
	
	private List<Date> getGridProductLastDateTime(String type, String element, String forecastTime)
	{
		List<Date> result = new ArrayList<Date>();
		try {
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement(); 
			String sql = String.format("select max(forecastTime) as forecastTime from t_gridproduct where type='%s' and element='%s' and forecastTime<'%s' and version='p' ", type, element, forecastTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				String strForecastTime = resultSet.getString("forecastTime");
				SimpleDateFormat sdf =  new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
				if(strForecastTime != null){
					try {
						result.add(sdf.parse(strForecastTime));
						
						sql = String.format("select max(makeTime) as makeTime from t_gridproduct where type='%s' and element='%s' and forecastTime='%s' and version='p' ", type, element, strForecastTime);
						ResultSet resultSet1 = stmt.executeQuery(sql);
						while(resultSet1.next()) {
							String strMakeTime = resultSet1.getString("makeTime");
							if(strMakeTime != null){
								try {
									result.add(sdf.parse(strMakeTime));
								} catch (ParseException e) {
									e.printStackTrace();
								}	
							}
						}						
						resultSet1.close();
					} catch (ParseException e) {
						e.printStackTrace();
					}	
				}
				break;
			}
			resultSet.close();
			conn.close();
		} catch (Exception e) {
			LogTool.logger.error("获取上一期预报时间，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result;
	}
	
	/**
	 * 获取等值线，已弃用，在客户端已实现
	 * @return
	 */	
	@POST
	@Path("getContour")
	@Produces("application/json")
	public Object getContour(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		String result =  new String();
		try
		{
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");	
			
			String strDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
			Dataset dt  = this.getDataset(strDatasetName, true);
			if(dt != null)
			{
				DatasetRaster dr = (DatasetRaster)dt;
				dr.SetNoDataValue(9999.0);
				dr.CalcExtreme(); //计算极值，底层没有自动计算
				Analyst pAnalyst = Analyst.CreateInstance("Contour", Application.m_workspace);
				String str = "{\"Datasource\":\"" + m_datasource.GetAlias() + "\",\"Dataset\":\"" + dr.GetName() + "\"}";
				pAnalyst.SetPropertyValue("Raster", str);
				
				String strValues = "";
				Double dStep = 2.0;					
				if(element.equals("2t"))
					dStep = (type.equals("EC") || type.equals("t639") || type.equals("JAPAN")) ? 2.0 : 1.0;
				if(element.equals("rh"))
					dStep = 5.0;					
				if(element.equals("div"))
					dStep = 10.0;
				if(element.equals("r1") || element.equals("r3") || element.equals("r6") || element.equals("r12") || element.equals("r24"))
					strValues = "0.1, 10.0, 25.0, 50.0, 100.0, 250.0";
					//strValues = "0.09, 9.9, 24.9, 49.9, 99.9, 249.9";
				
				if(strValues.length() == 0)
				{
					dr.SetNoDataValue(9999.0);
					dr.CalcExtreme();		
					double d = (int)dr.GetMinValue();
					double dMax = dr.GetMaxValue();					
					while (d <= dMax)
					{
						strValues += String.format("%f", d);
						strValues += " ";
						d += dStep;
					}	
				}
				
				pAnalyst.SetPropertyValue("Values", strValues);				
				pAnalyst.SetPropertyValue("Smoothness", "3");
				
				String strAlias = getValidDatasourceAlias("dsGridContour");				
				str = String.format("{\"Type\":\"%s\",\"Alias\":\"%s\",\"Server\":\"\"}", "Memory",strAlias);
				Datasource dsOutput = Application.m_workspace.CreateDatasource(str);
				str = String.format("{\"Datasource\":\"%s\",\"Dataset\":\"dtContour\"}", dsOutput.GetAlias());
				pAnalyst.SetPropertyValue("Contour", str);
				
				pAnalyst.Execute();
				pAnalyst.Destroy();
				
				DatasetVector dtv = (DatasetVector)dsOutput.GetDataset("dtContour");
				LogTool.logger.info("提取等值线耗时：" + String.valueOf(System.currentTimeMillis() - begintime));
				result = Toolkit.convertDatasetVectorToJson(dtv, "LINE");
				Application.m_workspace.CloseDatasource(dsOutput.GetAlias());
			}
		} catch (Exception e) {
			LogTool.logger.error("获取等值线，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("获取等值线耗时：" + String.valueOf(endtime - begintime));
		return result;
	}	
	
	/**
	 * 获取等值面
	 * @return
	 */	
	@POST
	@Path("getIsoRegion")
	@Produces("application/json")
	public Object getIsoRegion(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		String result =  new String();
		try
		{
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");	
			
			String strDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
			Dataset dt  = this.getDataset(strDatasetName, true);
			if(dt != null)
			{
				DatasetRaster dr = (DatasetRaster)dt;
				dr.SetNoDataValue(9999.0);
				dr.CalcExtreme(); //计算极值，底层没有自动计算
				Analyst pAnalyst = Analyst.CreateInstance("Contour", Application.m_workspace);
				String str = "{\"Datasource\":\"" + m_datasource.GetAlias() + "\",\"Dataset\":\"" + dr.GetName() + "\"}";
				pAnalyst.SetPropertyValue("Raster", str);
				
				String strValues = "";
				Double dStep = 2.0;					
				if(element.equals("2t"))
					dStep = (type.equals("EC") || type.equals("t639") || type.equals("JAPAN")) ? 2.0 : 1.0;
				if(element.equals("rh"))
					dStep = 5.0;					
				if(element.equals("r1") || element.equals("r3") || element.equals("r6") || element.equals("r12") || element.equals("r24"))
					strValues = "0.1, 10.0, 25.0, 50.0, 100.0, 250.0";
					//strValues = "0.09, 9.9, 24.9, 49.9, 99.9, 249.9";
				
				if(strValues.length() == 0)
				{
					dr.SetNoDataValue(9999.0);
					dr.CalcExtreme();		
					double d = (int)dr.GetMinValue();
					double dMax = dr.GetMaxValue();					
					while (d <= dMax)
					{
						strValues += String.format("%f", d);
						strValues += " ";
						d += dStep;
					}	
				}
				
				pAnalyst.SetPropertyValue("Values", strValues);				
				pAnalyst.SetPropertyValue("Smoothness", "3");
				
				String strAlias = getValidDatasourceAlias("dsGridContour");
				str = String.format("{\"Type\":\"%s\",\"Alias\":\"%s\",\"Server\":\"\"}", "Memory",strAlias);
				Datasource dsOutput = Application.m_workspace.CreateDatasource(str);
				str = String.format("{\"Datasource\":\"%s\",\"Dataset\":\"dtContour\"}", dsOutput.GetAlias());
				pAnalyst.SetPropertyValue("Contour", str);
				
				pAnalyst.Execute();
				pAnalyst.Destroy();
				
				//填色
				pAnalyst = Analyst.CreateInstance("FilledContour", Application.m_workspace);
				str =String.format( "{\"Datasource\":\"%s\",\"Dataset\":\"%s\"}", dsOutput.GetAlias(), "dtContour");
				pAnalyst.SetPropertyValue("Contour", str);
				str = "{\"Datasource\":\"" + m_datasource.GetAlias() + "\",\"Dataset\":\"" + dr.GetName() + "\"}";
                pAnalyst.SetPropertyValue("Ref", str);
                str = String.format("{\"Name\":\"ZValue\",\"MinValue\":%f,\"MaxValue\":%f}", dr.GetMinValue() - 1.0, dr.GetMaxValue() + 1.0);
                pAnalyst.SetPropertyValue("Field", str);
				str = String.format("{\"Datasource\":\"%s\",\"Dataset\":\"%s\"}", dsOutput.GetAlias(), "dtIsoSurface");
				pAnalyst.SetPropertyValue("FilledContour", str);				
				pAnalyst.Execute();
				pAnalyst.Destroy();  
				
				DatasetVector dtv = (DatasetVector)dsOutput.GetDataset("dtIsoSurface");
				result = Toolkit.convertDatasetVectorToJson(dtv, "REGION");
				Application.m_workspace.CloseDatasource(dsOutput.GetAlias());
			}
		} catch (Exception e) {
			LogTool.logger.error("获取等值面，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("获取等值面耗时：" + String.valueOf(endtime - begintime));
		return result.toString();
	}	
	
	/**
	 * 根据区域范围（落区）更新格点
	 * @return
	 */
	@POST
	@Path("updateGridByRegion")
	@Produces("application/json")
	public Object updateGridByRegion(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		Boolean result = false;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");	
			
			String strGridDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
			DatasetRaster dg  = (DatasetRaster)this.getDataset(strGridDatasetName, true);
			if(dg == null)
				return result;
			
			//多边形（落区）边界点
			String coordinates = CommonTool.getJSONStr(jsonObject, "coordinates");
			//目标值
			double dvalue = CommonTool.getJSONDouble(jsonObject, "value");
			//构造多边形（落区）
			ArrayList<Point2D> points = new ArrayList<Point2D>();
			String[] xys = coordinates.split(" ");
			for(int i=0; i<xys.length; i++)
			{
				String[] xy = xys[i].split(",");				
				points.add(new Point2D.Double(java.lang.Double.valueOf(xy[0]), java.lang.Double.valueOf(xy[1])));
			}			
			GeoRegion geoRegion = new GeoRegion((Point2D[]) points.toArray());
			//更新格点值
			result = FillRegion(dg, geoRegion, dvalue, 0, element); //0：统一赋值
			if(result)
			{
				m_datasetRefreshList.add(dg.GetName());
				
				SimpleDateFormat df = new SimpleDateFormat("MMddHHmmss");
				String strTime = df.format(new Date());
				Integer nTime = Integer.parseInt(strTime);
				m_datasetUpdateTime.put(dg.GetName(),nTime);
			}
		} catch (Exception e) {
			LogTool.logger.error("根据区域范围（落区）更新格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("更新格点耗时：" + String.valueOf(endtime - begintime));
		return result;
	}
	
	/*
	 * 
	 * 通过多边形订正格点
	 * method：0：统一赋值，value=x；1：统一加减值，value+=x；2：统一增量（百分比），value*=(1+x))
	 * element：要素名称，主要是解决降水量不能为负
	 * *
	 */
	private Boolean FillRegion(DatasetRaster dg, GeoRegion gr, double dvalue, Integer method, String element)
	{
		if(method == 0 && dvalue<0 && (element.equals("R1") || element.equals("R3") || element.equals("R6") || element.equals("R12") || element.equals("R24"))) //降水不能为负
    		return false;
		
		Boolean result = false;
		try {
			if (dg == null || gr == null)
                return result;
			Point2D ptMin = dg.PointToCell(new Point2D.Double(gr.GetBounds().getX(), gr.GetBounds().getY()));
            Point2D ptMax = dg.PointToCell(new Point2D.Double(gr.GetBounds().getX() + gr.GetBounds().getWidth(), gr.GetBounds().getY() + gr.GetBounds().getHeight()));
            if (ptMin.getX() > ptMax.getX())
            {
                int nSwap = (int) ptMin.getX();
                ptMin = new Point2D.Double(ptMax.getX(), ptMin.getY());
                ptMax = new Point2D.Double(nSwap, ptMax.getY());
            }
            if (ptMin.getY() > ptMax.getY())
            {
                int nSwap = (int) ptMin.getY();
                ptMin = new Point2D.Double(ptMin.getX(), ptMax.getY());
                ptMax = new Point2D.Double(ptMax.getX(), nSwap);
            }
            ptMin = new Point2D.Double(Math.max(ptMin.getX(), 0), Math.max(ptMin.getY(), 0));
            ptMax = new Point2D.Double(Math.min(ptMax.getX(), dg.GetWidth() - 1), Math.min(ptMax.getY(), dg.GetHeight() - 1));
            Analyst pAnalyst = Analyst.CreateInstance("SpatialRel", Application.m_workspace);
            String str = String.format("\"Geometry\":\"%d\"", gr.GetHandle());
            pAnalyst.SetPropertyValue("A", "{" + str + "}");
            pAnalyst.SetPropertyValue("SpatialRel", "Contain");
            for (int i = (int) ptMin.getY(); i <= ptMax.getY(); i++)
            {
                for (int j = (int) ptMin.getX(); j <= ptMax.getX(); j++)
                {
                    //Point2D pt2d = dg.CellToPoint(new Point(j, i));
                	Point2D pt2d = dg.CellToPoint(new Point2D.Double(j, i));
                    GeoPoint geoPoint = new GeoPoint(pt2d.getX(), pt2d.getY());
                    str = String.format("\"Geometry\":\"%d\"", geoPoint.GetHandle());
                    pAnalyst.SetPropertyValue("B", "{" + str + "}");
                    pAnalyst.Execute();
                    String strOutput = pAnalyst.GetPropertyValue("Output");
                    if(strOutput.equals("FALSE"))
                    	continue;
                    
                    if(method == 0) //统一赋值，value=x
                    {                    	
                    	dg.SetValue(j, i, dvalue);
                    }
                    else if(method == 1) //统一加减值，value+=x
                    {
                    	double valueTemp = dg.GetValue(j, i);
                    	valueTemp+=dvalue;
                    	
                    	if(valueTemp<0 && (element.equals("R1") || element.equals("R3") || element.equals("R6") || element.equals("R12") || element.equals("R24"))) //降水不能为负， 就置为0吧
                    		valueTemp = 0;
                    	
                    	dg.SetValue(j, i, valueTemp);
                    }
                    else if(method == 2) //统一增量（百分比），value*=(1+x)
                    {
                    	double valueTemp = dg.GetValue(j, i);
                    	valueTemp*=(1+dvalue);
                    	
                    	if(valueTemp<0 && (element.equals("R1") || element.equals("R3") || element.equals("R6") || element.equals("R12") || element.equals("R24"))) //降水不能为负， 就置为0吧，这里原则上不会为负，保险起见，还是判断下
                    		valueTemp = 0;
                    	
                    	dg.SetValue(j, i, valueTemp);
                    }
                }
            }
            pAnalyst.Destroy();
            dg.FlushCache();
			result = true;
		}
		catch(Exception e)
		{
			LogTool.logger.error("更新格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result;
	}
	
	/**
	 * 判断数据是否脏了
	 * @return
	 */
	@POST
	@Path("getIsDirty")
	@Produces("application/json")
	public Object getIsDirty(@FormParam("para") String para) {
		StringBuffer result =  new StringBuffer();
		try {
			JSONObject jsonObject = new JSONObject(para);
			Integer nTime = CommonTool.getJSONInt(jsonObject, "time");
			String m_strDatasetName = "test";	//服务端重构了，这个全局变量删掉了，该功能以后再说，可能用不上
			if(m_datasetUpdateTime.containsKey(m_strDatasetName)) //这个应该是作为参数传过来的
			{
				if(nTime < m_datasetUpdateTime.get(m_strDatasetName))
				{
					result.append(String.format("{\"time\":%d}", m_datasetUpdateTime.get(m_strDatasetName)));
				}
			}
		} catch (Exception e) {
			LogTool.logger.error("判断数据是否脏了，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result.toString();
	}
	
	/**
	 * 根据气候区划订正格点。已弃用，在客户端已实现
	 * 参数：数据集名、区划子项名称、订正方法（0：统一赋值，value=x；1：统一加减值，value+=x；2：统一增量（百分比），value*=(1+x))）等
	 * 返回：是否成功
	 * @return
	 */
	@POST
	@Path("updateGridByClimaticRegion")
	@Produces("application/json")
	public Object updateGridByClimaticRegion(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		Boolean result = false;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");	
			double dValue= CommonTool.getJSONDouble(jsonObject, "value");
			Integer method= CommonTool.getJSONInt(jsonObject, "method");
			String datasetName = CommonTool.getJSONStr(jsonObject, "datasetName");
			Integer regionId = CommonTool.getJSONInt(jsonObject, "regionId");
			
			String strGridDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
			Dataset dt  = this.getDataset(strGridDatasetName, true);
			if(dt == null)
				return result;
			
			DatasetRaster dg  = (DatasetRaster)dt;
			GeoRegion geo = null;
			DatasetVector dtv = (DatasetVector)this.getDataset(datasetName, true);
			if(dtv != null)
			{
				Recordset rs = dtv.Query("", null);
				if(rs.Seek(regionId))
					geo = (GeoRegion)rs.GetGeometry();
				rs.Destroy();
				
				if(geo != null)
				{
					result = FillRegion(dg, geo, dValue, method, element);
					if(result)
					{
						m_datasetRefreshList.add(dg.GetName());
						
						SimpleDateFormat df = new SimpleDateFormat("MMddHHmmss");
						String strTime = df.format(new Date());
						Integer nTime = Integer.parseInt(strTime);
						m_datasetUpdateTime.put(dg.GetName(),nTime);
					}
				}
			}
		} catch (Exception e) {
			LogTool.logger.error("根据气候区划订正格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("根据气候区划订正格点：" + String.valueOf(endtime - begintime));
		return result;
	}
	
	/*
	 * 
	 * 获取格点值序列
	 * */
	@POST
	@Path("getGridValueSerial")
	@Produces("application/json")
	public Object getGridValueSerial(@FormParam("para") String para){
		ArrayList<GridValueInfo> result = null;
		try
		{
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			Double x = CommonTool.getJSONDouble(jsonObject, "x");
			Double y = CommonTool.getJSONDouble(jsonObject, "y");
			Point2D pt2d = new Point2D.Double(x, y);
			String prefix = String.format("t_%s_%s_%s", type, element, new SimpleDateFormat("yyMMddHH").format(date));
			Datasource ds = this.getGridDBDatasource();
			Map<Integer,Double> valMap = new TreeMap<Integer,Double>(); //TreeMap能自动排列
			for(int i=0; i<ds.GetDatasetCount(); i++)
			{
				String dtname = ds.GetDataset(i).GetName().toLowerCase();
				if(dtname.startsWith(prefix) && ds.GetDataset(i).GetType().equals("Raster"))
				{
					if(level == null) //格点产品
					{
						DatasetRaster dg = (DatasetRaster)ds.GetDataset(i);
						Point2D pt = dg.PointToCell(pt2d);
						if(pt.getX() > 0 && pt.getX()<dg.GetWidth() && pt.getY()>0 && pt.getY()<dg.GetHeight())
						{
							Double v = Double.valueOf(Math.round(dg.GetValue((int)pt.getX(), (int)pt.getY())*100)/100.0); //保留两位小数
							String[] strs = dtname.split("_");
							Integer hourspan = Integer.valueOf(strs[4]); //时效，最好不要用常量
							valMap.put(hourspan, v);	
						}						
					}
					else //模式产品
					{
						if(dtname.endsWith(level))
						{
							
						}
					}
				}
			}
			
			if(valMap.size() > 0)
			{
				result = new ArrayList<GridValueInfo>(); 
				for(Map.Entry<Integer, Double> entry:valMap.entrySet()){    
				     result.add(new GridValueInfo(entry.getKey(), entry.getValue()));    
				}   
			}
		}
		catch(Exception e)
		{
			LogTool.logger.error("获取格点值序列，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result;
	}
	
	/**
	 * 根据格点值序列订正格点。已弃用，在客户端已实现
	 * 参数：数据集名、区划子项ID、订正方法（0：统一赋值，value=x；1：统一加减值，value+=x；2：统一增量（百分比），value*=(1+x))）等
	 * 返回：是否成功
	 * @return
	 */
	@POST
	@Path("updateGridByGridValueSerial")
	@Produces("application/json")
	public Object updateGridByGridValueSerial(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		Boolean result = false;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "datetime"));
			//double dValue= CommonTool.getJSONDouble(jsonObject, "value");
			Integer method= CommonTool.getJSONInt(jsonObject, "method");
			String datasetName = CommonTool.getJSONStr(jsonObject, "datasetName");
			Integer regionId = CommonTool.getJSONInt(jsonObject, "regionId");
			String hourSpans = CommonTool.getJSONStr(jsonObject, "hourSpans");
			String gridValues = CommonTool.getJSONStr(jsonObject, "gridValues");
			
			String[] arrayHourSpan = hourSpans.split(",");
			String[] arrayGridValue = gridValues.split(",");
			for(int i=0; i<arrayHourSpan.length; i++)
			{
				Integer hour = Integer.valueOf(arrayHourSpan[i]);
				Double dValue = Double.valueOf(arrayGridValue[i]);
				if(dValue == 0.0) //没有发生变化，不订正
					continue;
				String strGridDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
				Dataset dt  = this.getDataset(strGridDatasetName, true);
				if(dt == null)
					return result;
				DatasetRaster dg = (DatasetRaster)dt;
				GeoRegion geo = null;
				DatasetVector dtv = (DatasetVector)this.getDataset(datasetName, true);
				if(dtv != null)
				{
					Recordset rs = dtv.Query("", null);
					if(rs.Seek(regionId))
						geo = (GeoRegion)rs.GetGeometry();
					rs.Destroy();
					
					if(geo != null)
					{
						result = FillRegion(dg, geo, dValue, method, element);
						if(result)
						{
							m_datasetRefreshList.add(dg.GetName());
							
							SimpleDateFormat df = new SimpleDateFormat("MMddHHmmss");
							String strTime = df.format(new Date());
							Integer nTime = Integer.parseInt(strTime);
							m_datasetUpdateTime.put(dg.GetName(),nTime);
						}
					}
				}
			}
			//Datasource ds = App.getGridDatasource();
			//ds.refresh(); //刷新一下数据源
		} catch (Exception e) {
			LogTool.logger.error("根据气候区划订正格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("根据气候区划订正格点：" + String.valueOf(endtime - begintime));
		return result;
	}
	
	/*
	 * 添加格点产品信息
	 * */
	private Integer addGridInfo(Statement stmt, String departCode, String type,String element,String forecastTime,int hourSpan,int totalHourSpan,int level,
			String version,String tabelName,String nwpModel, String nwpModelTime,String userName,String  forecaster,String issuer,
			String makeTime,String lastModifyTime,Integer subjective,String remark){
		Integer key = -1;
		 try {
			String sql = String.format("INSERT INTO `t_gridproduct` (`departCode`, `type`, `element`, `forecastTime`, `hourSpan`, `totalHourSpan`, `level`, `version`, `tabelName`, `nwpModel`, `nwpModelTime`, `userName`, `forecaster`, `issuer`, `makeTime`, `lastModifyTime`, `subjective`, `remark`) VALUES ('%s', '%s', '%s', '%s', %d, %d, %d, '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s');",
						departCode, type, element, forecastTime, hourSpan, totalHourSpan, level, version, tabelName, nwpModel, nwpModelTime, userName, forecaster, issuer, makeTime, lastModifyTime, subjective, remark);
			Integer row = stmt.executeUpdate(sql, Statement.RETURN_GENERATED_KEYS);
			ResultSet rs = stmt.getGeneratedKeys ();
			if (rs.next()) {
				key = rs.getInt(row);
				}
		 } 
		 catch (Exception e) {
			 e.printStackTrace();
			 } 
		 return key;
	}
	
	/*
	 * 修改格点产品信息
	 * */
	private Integer updateGridInfo(Statement stmt,Integer id, String departCode,String type,String element,String forecastTime,int hourSpan,int totalHourSpan,int level,String version, 
			String tabelName,String nwpModel, String nwpModelTime,String userName,String forecaster,String issuer,String makeTime,String lastModifyTime,Integer subjective,String remark){
		Integer key = -1;
		try {
			//查询id
//			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
//					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
//					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
//			Statement  stmt = conn.createStatement();
			
			long begintime = System.currentTimeMillis();			
			if(id<0){
				key = addGridInfo(stmt, departCode, type, element, forecastTime, hourSpan, totalHourSpan, level, version, tabelName, nwpModel, nwpModelTime, userName, forecaster, issuer, makeTime, lastModifyTime, subjective, remark);
				return key;
			}			
			//执行更新
			String sql = String.format("UPDATE `t_gridproduct` SET `type`='%s', `element`='%s', `forecastTime`='%s', `hourSpan`=%d, `totalHourSpan`=%d, `level`=%d, `version`='%s', `tabelName`='%s', `nwpModel`='%s', `nwpModelTime`='%s', `userName`='%s', `forecaster`='%s', `issuer`='%s', `makeTime`='%s', `lastModifyTime`='%s', `subjective`='%d', `remark`='%s' WHERE `id`=%d;",
					type, element, forecastTime, hourSpan, totalHourSpan, level, version, tabelName, nwpModel, nwpModelTime, userName, forecaster, issuer, makeTime, lastModifyTime, subjective, remark, id);
			stmt.executeUpdate(sql);
			key = id;
			long endtime = System.currentTimeMillis();
			LogTool.logger.info("更新产品属性耗时：" + String.valueOf(endtime - begintime));
		 } 
		 catch (Exception e) {
			 e.printStackTrace();
			 } 
		 return key;
	}
	
	/*
	 * 查询（全部要素）格点信息
	 * */
	private ArrayList<GridInfo> queryGridInfo(String departCode,String type,String maketime,String version,String forecastTime){
		ArrayList<GridInfo> result = new ArrayList<GridInfo>();
		try {
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_gridproduct where departCode='%s' and type='%s' and makeTime='%s' and version='%s' and forecastTime='%s'", departCode, type, maketime, version, forecastTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				GridInfo gi = new GridInfo(); 
				gi.setId(resultSet.getInt("id"));
				gi.setDepartCode(resultSet.getString("departCode"));
				gi.setType(resultSet.getString("type"));
				gi.setElement(resultSet.getString("element"));
				gi.setForecastTime(resultSet.getString("forecastTime"));
				gi.setHourSpan(resultSet.getInt("hourSpan"));
				gi.setTotalHourSpan(resultSet.getInt("totalHourSpan"));
				gi.setLevel(resultSet.getInt("level"));
				gi.setVerstion(resultSet.getString("version"));
				gi.setTabelName(resultSet.getString("tabelName"));
				gi.setNWPModel(resultSet.getString("nwpModel"));
				gi.setNWPModelTime(resultSet.getString("nwpModelTime"));
				gi.setUserName(resultSet.getString("userName"));
				gi.setForecaster(resultSet.getString("forecaster"));
				gi.setIssuer(resultSet.getString("issuer"));
				gi.setMakeTime(resultSet.getString("makeTime"));
				gi.setLastModifyTime(resultSet.getString("lastModifyTime"));
				gi.setSubjective(resultSet.getInt("subjective"));
				gi.setRemark(resultSet.getString("remark"));
				result.add(gi);
			}
			stmt.close();
			conn.close();
		 } 
		 catch (Exception e){
			 e.printStackTrace();
		 } 
		 return result;
	}
	
	/*
	 * 查询（批量）格点信息
	 * */
	private ArrayList<GridInfo> queryGridInfo(String departCode, String type,String element,String maketime,String version,String forecastTime){
		ArrayList<GridInfo> result = new ArrayList<GridInfo>();
		try {
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_gridproduct where departCode='%s' and type='%s' and element='%s' and makeTime='%s' and version='%s' and forecastTime='%s'", departCode, type, element, maketime, version, forecastTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				GridInfo gi = new GridInfo(); 
				gi.setId(resultSet.getInt("id"));
				gi.setDepartCode(resultSet.getString("departCode"));
				gi.setType(resultSet.getString("type"));
				gi.setElement(resultSet.getString("element"));
				gi.setForecastTime(resultSet.getString("forecastTime"));
				gi.setHourSpan(resultSet.getInt("hourSpan"));
				gi.setTotalHourSpan(resultSet.getInt("totalHourSpan"));
				gi.setLevel(resultSet.getInt("level"));
				gi.setVerstion(resultSet.getString("version"));
				gi.setTabelName(resultSet.getString("tabelName"));
				gi.setNWPModel(resultSet.getString("nwpModel"));
				gi.setNWPModelTime(resultSet.getString("nwpModelTime"));
				gi.setUserName(resultSet.getString("userName"));
				gi.setForecaster(resultSet.getString("forecaster"));
				gi.setIssuer(resultSet.getString("issuer"));
				gi.setMakeTime(resultSet.getString("makeTime"));
				gi.setLastModifyTime(resultSet.getString("lastModifyTime"));
				gi.setSubjective(resultSet.getInt("subjective"));
				gi.setRemark(resultSet.getString("remark"));
				result.add(gi);
			}
			stmt.close();
			conn.close();
		 } 
		 catch (Exception e){
			 e.printStackTrace();
		 } 
		 return result;
	}
	
	/*
	 * 查询（单个）格点信息
	 * */
	private GridInfo queryGridInfo(String departCode, String type,String element,String maketime,String version,String forecastTime,Integer hourSpan){
		GridInfo result = null;
		try {
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_gridproduct where departCode='%s' and type='%s' and element='%s' and makeTime='%s' and version='%s' and forecastTime='%s' and hourSpan=%d", departCode, type, element, maketime, version, forecastTime, hourSpan);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				GridInfo gi = new GridInfo(); 
				gi.setId(resultSet.getInt("id"));
				gi.setDepartCode(resultSet.getString("departCode"));
				gi.setType(resultSet.getString("type"));
				gi.setElement(resultSet.getString("element"));
				gi.setForecastTime(resultSet.getString("forecastTime"));
				gi.setHourSpan(resultSet.getInt("hourSpan"));
				gi.setTotalHourSpan(resultSet.getInt("totalHourSpan"));
				gi.setLevel(resultSet.getInt("level"));
				gi.setVerstion(resultSet.getString("version"));
				gi.setTabelName(resultSet.getString("tabelName"));
				gi.setNWPModel(resultSet.getString("nwpModel"));
				gi.setNWPModelTime(resultSet.getString("nwpModelTime"));
				gi.setUserName(resultSet.getString("userName"));
				gi.setForecaster(resultSet.getString("forecaster"));
				gi.setIssuer(resultSet.getString("issuer"));
				gi.setMakeTime(resultSet.getString("makeTime"));
				gi.setLastModifyTime(resultSet.getString("lastModifyTime"));
				gi.setSubjective(resultSet.getInt("subjective"));
				gi.setRemark(resultSet.getString("remark"));
				result = gi;
			}
			stmt.close();
			conn.close();
		 } 
		 catch (Exception e){
			 e.printStackTrace();
		 } 
		 return result;
	}
	
	/**
	 * 保存格点
	 * @return
	 */
	@POST
	@Path("saveGrid")
	@Produces("application/json")
	public Object saveGrid(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		Integer result = -1;
		Connection conn = null;
		Statement  stmt = null;
		try {
			conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(),
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(),
					datasourceConnectionConfigInfo.getPassword());
			stmt = conn.createStatement(); 
			
			JSONObject jsonObject = new JSONObject(para);
			Integer id = CommonTool.getJSONInt(jsonObject, "id");
			String departCode = CommonTool.getJSONStr(jsonObject, "departCode");
			//String areaCode = CommonTool.getJSONStr(jsonObject, "areaCode");
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String level = CommonTool.getJSONStr(jsonObject, "level");
			String element = CommonTool.getJSONStr(jsonObject, "element");
			String strmaketime = CommonTool.getJSONStr(jsonObject, "maketime");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strmaketime);
			String version = CommonTool.getJSONStr(jsonObject, "version");
			String strdate = CommonTool.getJSONStr(jsonObject, "datetime");
			Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strdate);
			Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");
			Integer hourspanTotal = CommonTool.getJSONInt(jsonObject, "hourspanTotal");
			String fromModel = CommonTool.getJSONStr(jsonObject, "fromModel");
			String fromModelTime = CommonTool.getJSONStr(jsonObject, "fromModelTime");
			String userName = CommonTool.getJSONStr(jsonObject, "userName");
			//userName = new String(userName.getBytes(),"ISO8859_1");
			String forecaster = CommonTool.getJSONStr(jsonObject, "forecaster");
			//forecaster = new String(forecaster.getBytes(),"ISO8859_1");
			String issuer = CommonTool.getJSONStr(jsonObject, "issuer");
			Integer subjective = CommonTool.getJSONInt(jsonObject, "subjective");
			//issuer = new String(issuer.getBytes(),"ISO8859_1");
			Double noDataValue = CommonTool.getJSONDouble(jsonObject, "noDataValue");
			
			
			Integer cols =  CommonTool.getJSONInt(jsonObject, "cols");
			Integer rows =  CommonTool.getJSONInt(jsonObject, "rows");
			Double left = CommonTool.getJSONDouble(jsonObject, "left");
			Double bottom = CommonTool.getJSONDouble(jsonObject, "bottom");
			Double width = CommonTool.getJSONDouble(jsonObject, "width");
			Double height = CommonTool.getJSONDouble(jsonObject, "height");
			String values = CommonTool.getJSONStr(jsonObject, "values");
			//LogTool.logger.info(values);
			 
			result = saveOneGrid(stmt, id, departCode, type, level, element, strmaketime, maketime, version, strdate, date, hour, hourspanTotal, fromModel, fromModelTime, userName, 
					forecaster, issuer, subjective, noDataValue, cols, rows, left, bottom, width, height, values);
			
			//区台关键岗/值班岗，提交时自动生成首席岗审核发布产品
			if(type.equals("prvn") && version.equals("r")){
				version = "p";
				userName = "";
				issuer = "";
				subjective = 0;
				GridInfo gi = queryGridInfo(departCode, type, element, strmaketime, version, strdate, hour);
				if(gi==null || gi.getUserName().equals("")){
					long begintime1 = System.currentTimeMillis();
					saveOneGrid(stmt, gi==null?-1:gi.getId(), departCode, type, level, element, strmaketime, maketime, version, strdate, date, hour, hourspanTotal, fromModel, fromModelTime, userName,
							forecaster, issuer, subjective, noDataValue, cols, rows, left, bottom, width, height, values);	
					long endtime1 = System.currentTimeMillis();
					LogTool.logger.info("同时生成首席预报产品耗时：" + String.valueOf(endtime1 - begintime1));
				}				
			}
		} catch (Exception e) {
			LogTool.logger.error("保存格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		try {
			stmt.close();
			conn.close();
		} catch (SQLException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}			
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("保存格点耗时：" + String.valueOf(endtime - begintime));
		return result;
	}
	
	/**
	 * 保存格点（批量）
	 * @return
	 */
	@POST
	@Path("saveGrids")
	@Produces("application/json")
	public Object saveGrids(@FormParam("para") String para) {
		long begintime = System.currentTimeMillis();
		ArrayList<Integer> result = new ArrayList<Integer>();
		Connection conn = null;
		Statement  stmt = null;
		try {			
			conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(),
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(),
					datasourceConnectionConfigInfo.getPassword());
			stmt = conn.createStatement(); 
			
			ArrayList<GridInfo> gisP = null;
			
			JSONObject json = new JSONObject(para);
			JSONArray jsonArray = json.getJSONArray("gridinfos");  
			int iSize = jsonArray.length();
			for (int i = 0; i < iSize; i++) {  
				 JSONObject jsonObject = jsonArray.getJSONObject(i);
				 Integer id = CommonTool.getJSONInt(jsonObject, "id");
				 String departCode = CommonTool.getJSONStr(jsonObject, "departCode");
				//String areaCode = CommonTool.getJSONStr(jsonObject, "areaCode");
				String type = CommonTool.getJSONStr(jsonObject, "type");
				String level = CommonTool.getJSONStr(jsonObject, "level");
				String element = CommonTool.getJSONStr(jsonObject, "element");
				String strmaketime = CommonTool.getJSONStr(jsonObject, "maketime");
				Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strmaketime);
				String version = CommonTool.getJSONStr(jsonObject, "version");
				String strdate = CommonTool.getJSONStr(jsonObject, "datetime");
				Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strdate);
				Integer hour = CommonTool.getJSONInt(jsonObject, "hourspan");
				Integer hourspanTotal = CommonTool.getJSONInt(jsonObject, "hourspanTotal");
				String fromModel = CommonTool.getJSONStr(jsonObject, "fromModel");
				String fromModelTime = CommonTool.getJSONStr(jsonObject, "fromModelTime");
				String userName = CommonTool.getJSONStr(jsonObject, "userName");
				//userName = new String(userName.getBytes(),"ISO8859_1");
				String forecaster = CommonTool.getJSONStr(jsonObject, "forecaster");
				//forecaster = new String(forecaster.getBytes(),"ISO8859_1");
				String issuer = CommonTool.getJSONStr(jsonObject, "issuer");
				Integer subjective = CommonTool.getJSONInt(jsonObject, "subjective");
				//issuer = new String(issuer.getBytes(),"ISO8859_1");
				Double noDataValue = CommonTool.getJSONDouble(jsonObject, "noDataValue");
				
				
				Integer cols =  CommonTool.getJSONInt(jsonObject, "cols");
				Integer rows =  CommonTool.getJSONInt(jsonObject, "rows");
				Double left = CommonTool.getJSONDouble(jsonObject, "left");
				Double bottom = CommonTool.getJSONDouble(jsonObject, "bottom");
				Double width = CommonTool.getJSONDouble(jsonObject, "width");
				Double height = CommonTool.getJSONDouble(jsonObject, "height");
				String values = CommonTool.getJSONStr(jsonObject, "values");
				//LogTool.logger.info(values);
				 
				Integer key = saveOneGrid(stmt, id, departCode, type, level, element, strmaketime, maketime, version, strdate, date, hour, hourspanTotal, fromModel, fromModelTime, userName, 
						forecaster, issuer, subjective, noDataValue, cols, rows, left, bottom, width, height, values);
				result.add(key);			
				
				//区台关键岗/值班岗，提交时自动生成首席岗审核发布产品
				if(type.equals("prvn") && version.equals("r")){
					version = "p";
					userName = "";
					issuer = "";
					subjective = 0;
					String userNameP = "";	
					int idP = -1;
					if(gisP==null)
						gisP = queryGridInfo(departCode, type, element, strmaketime, version, strdate); //这样查询1次
					if(gisP != null && gisP.size() > 0){
						for(GridInfo gi : gisP){
							if(gi.getHourSpan() == hour){
								userNameP = gi.getUserName();	
								idP = gi.getId();
							}								
						}										
					}
					if(userNameP.equals("")){
						saveOneGrid(stmt, idP, departCode, type, level, element, strmaketime, maketime, version, strdate, date, hour, hourspanTotal, fromModel, fromModelTime, userName,
								forecaster, issuer, subjective, noDataValue, cols, rows, left, bottom, width, height, values);	
					}	
				}
			 }
		} catch (Exception e) {
			LogTool.logger.error("保存格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
			
		try {
			stmt.close();
			conn.close();
		} catch (SQLException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}			
		long endtime = System.currentTimeMillis();
		LogTool.logger.info("保存格点耗时：" + String.valueOf(endtime - begintime));
		return result;
	}
	
	private Integer saveOneGrid(Statement stmt,Integer id, String departCode, String type, String level, String element,String strmaketime,Date maketime,String version, String strdate, Date date, Integer hour, Integer hourspanTotal, 
			String fromModel, String fromModelTime, String userName, String forecaster, String issuer,Integer subjective, 
			Double noDataValue, Integer cols,Integer rows,Double left,Double bottom,Double width,Double height,String values){
		Integer result = -1;
		try
		{			
			String strGridDatasetName = getGridDatasetName(type, level, element, maketime, version, date, hour);
			DatasetRaster dg  = (DatasetRaster)this.getDataset(strGridDatasetName, false); //如果是风场，它就是U分量场
			DatasetRaster dgV = null;	//如果是风场，它就是V分量场；否则它为空，或者为Tag属性
			Boolean iswind = false;
			if(element.equals("10uv") || element.equals("wmax")){
				iswind = true;
				dg  = (DatasetRaster)this.getDataset(strGridDatasetName+"_u", true);
				dgV  = (DatasetRaster)this.getDataset(strGridDatasetName+"_v", true);
			}
			
			//判断是否具有Tag属性
			String[] arrayStrValues = values.split(",");
			ArrayList<Double> arryValues = new ArrayList<Double>(); 
			for(int i=0; i<arrayStrValues.length; i++)
				arryValues.add(Double.valueOf(arrayStrValues[i]));
			Boolean hasTag = (!iswind)&&(arryValues.size()==cols*rows*2); //不是风场，且值为双倍，则存在tag属性
			if(hasTag)
				dgV  = (DatasetRaster)this.getDataset(strGridDatasetName+"_t", true);

			Boolean bNewDataset = false;
			if(dg == null)
			{
				bNewDataset = true;
				String strBounds = String.format("\"left\":%f,\"bottom\":%f,\"right\":%f,\"top\":%f", left, bottom, left+width, bottom+height);
				String str = String.format("{\"Name\":\"%s\",\"ValueType\":\"%s\",\"Width\":%d,\"Height\":%d,\"BlockSize\":\"256 256\",\"Projection\":\"%s\",\"Bounds\":{%s},\"NoDataValue\":%f}",
						iswind?strGridDatasetName+"_u":strGridDatasetName, "Single", cols, rows, "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs", strBounds, noDataValue);
				dg = m_datasource.CreateDatasetRaster(str);
				if(dg == null)
				{
					LogTool.logger.error("保存格点，详情【创建数据集失败】");
					return -1;
				}
				
				//保存格点预报产品信息
				String tabelName = strGridDatasetName;
				Date dateNow = new Date();
				String lastModifyTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dateNow);
				String remark = "";
				int nlevel = level == "" ? 1000 : Integer.valueOf(level);				
				result = this.addGridInfo(stmt, departCode, type, element, strdate, hour, hourspanTotal, nlevel, version, tabelName, fromModel, fromModelTime, userName, forecaster, issuer, strmaketime, lastModifyTime, subjective, remark);
			}
			else
			{				
				//更新格点预报产品信息
				String tabelName = strGridDatasetName;
				Date dateNow = new Date();
				String lastModifyTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(dateNow);
				String remark = "";
				int nlevel = level == "" ? 1000 : Integer.valueOf(level);
				result = this.updateGridInfo(stmt, id, departCode, type, element, strdate, hour, hourspanTotal, nlevel, version, tabelName, fromModel, fromModelTime,userName, forecaster, issuer, strmaketime, lastModifyTime, subjective, remark);
			}			
			
			//有可能哪里错误，导致U分量存在，V分量没有，所以这里放外面来。
			if(iswind && dgV == null){
				String strBounds = String.format("\"left\":%f,\"bottom\":%f,\"right\":%f,\"top\":%f", left, bottom, left+width, bottom+height);
				String str = String.format("{\"Name\":\"%s\",\"ValueType\":\"%s\",\"Width\":%d,\"Height\":%d,\"BlockSize\":\"256 256\",\"Projection\":\"%s\",\"Bounds\":{%s},\"NoDataValue\":%f}",
						strGridDatasetName+"_v", "Single", cols, rows, "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs", strBounds, noDataValue);
				dgV = m_datasource.CreateDatasetRaster(str);
				if(dgV == null)
				{
					LogTool.logger.error("保存格点，详情【创建数据集失败】");
					return -1;
				}
			}
			if(hasTag && dgV == null){
				String strBounds = String.format("\"left\":%f,\"bottom\":%f,\"right\":%f,\"top\":%f", left, bottom, left+width, bottom+height);
				String str = String.format("{\"Name\":\"%s\",\"ValueType\":\"%s\",\"Width\":%d,\"Height\":%d,\"BlockSize\":\"256 256\",\"Projection\":\"%s\",\"Bounds\":{%s},\"NoDataValue\":%f}",
						strGridDatasetName+"_t", "Single", cols, rows, "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs", strBounds, noDataValue);
				dgV = m_datasource.CreateDatasetRaster(str);
				if(dgV == null)
				{
					LogTool.logger.error("保存格点，详情【创建数据集失败】");
					return -1;
				}
			}
			
			long begintime = System.currentTimeMillis(); 
			
			GeoRegion geo = null;
			Rectangle2D bounds = null;
			Analyst pAnalyst = null;
			if(departCode.length() > 2) //市县部门需要获取本市边界，仅区域内赋值
			{
				pAnalyst = Analyst.CreateInstance("SpatialRel", Application.m_workspace);				            
	            pAnalyst.SetPropertyValue("SpatialRel", "Contain");
	            AdminDivisionService ads = new AdminDivisionService();
				geo = ads.getGeoRegion(departCode);
				bounds = geo.GetBounds();
			}
			Scanline sl = new Scanline(dg.GetValueType(), cols);
			Scanline slV = (iswind||hasTag)?new Scanline(dgV.GetValueType(), cols) : null;
			
			if(departCode.length() == 2 || bNewDataset){ //区台，如果市台是新建数据集需要全部写入
				if(iswind || hasTag){
					for (int i = rows - 1; i >= 0 ; i--)
		            {
						int count = (rows - 1 - i)*cols*2;
						dg.GetScanline(0, i, sl);
						dgV.GetScanline(0, i, slV);
						for (int j = 0; j < cols; j++)
		                {
								sl.SetValue(j, arryValues.get(count + j*2));
								slV.SetValue(j, arryValues.get(count + j*2 + 1));
		                }
		                dg.SetScanline(0, i, sl);
		                dgV.SetScanline(0, i, slV);
		            }
					dg.FlushCache();
					dg.CalcExtreme();
					dgV.FlushCache();
					dgV.CalcExtreme();
				}
				else{
					for (int i = rows - 1; i >= 0 ; i--)
		            {
						int count = (rows - 1 - i)*cols;
						dg.GetScanline(0, i, sl);
						for (int j = 0; j < cols; j++)
		                {
								sl.SetValue(j, arryValues.get(count+j));
		                }
		                dg.SetScanline(0, i, sl);                
		            }
					dg.FlushCache();
					dg.CalcExtreme();	
				}
				long endtime = System.currentTimeMillis();
				LogTool.logger.info("保存区台数据集耗时：" + String.valueOf(endtime - begintime));
			}
			else if(departCode.length() > 2){ //市县台
				if(geo != null){
					//获取栅格行政区划
					String strAlias = departCode.length()==4?"t_admindiv_city_grid":"t_admindiv_county_grid";
					Datasource dsAdmin = Application.m_workspace.GetDatasource(strAlias);
					if(dsAdmin == null){
						String classPath = Thread.currentThread().getContextClassLoader().getResource("").getPath();
						classPath=classPath.substring(1);					
						String strJson = String.format("{\"Type\":\"GTiff\",\"Alias\":\"%s\",\"Server\":\"%s\"}", strAlias, classPath + "../data/"+strAlias+".tif");
				        dsAdmin = Application.m_workspace.OpenDatasource(strJson);
					}
					if(dsAdmin == null){
						LogTool.logger.error("保存格点：栅格行政区划为空");
						return -1;
					}
			        DatasetRaster dgAdmin = (DatasetRaster)dsAdmin.GetDataset(0);
			        int colsAdmin = dgAdmin.GetWidth();
			        int rowsAdmin = dgAdmin.GetHeight();
			        Scanline slAdmin = new Scanline(dgAdmin.GetValueType(), dgAdmin.GetWidth());
			        
			        //计算偏移量
			        Point2D pt2d00 = dg.CellToPoint(new Point2D.Double(0, 0));
			        Point2D cell00 = dgAdmin.PointToCell(pt2d00);
			        int offsetX = (int)cell00.getX();
			        int offsetY = (int)cell00.getY();
			        
			        //部门CODE转换为double类型
					double dCode = Double.parseDouble(departCode);
					
					Boolean isInArea = true;
					Point2D pt2dLT = new Point2D.Double(bounds.getMinX(), bounds.getMaxY());
					Point2D pt2dRB = new Point2D.Double(bounds.getMaxX(), bounds.getMinY());
					Point2D cellLT = dg.PointToCell(pt2dLT);
					Point2D cellRB = dg.PointToCell(pt2dRB);
					int areaLeft = (int)cellLT.getX();
					int areaBottom = (int)cellRB.getY();
					int areaRight = (int)cellRB.getX();
					int areaTop = (int)cellLT.getY();
					for (int i = areaTop; i >= areaBottom ; i--)
		            {
						int count = (rows - 1 - i)*cols*((iswind||hasTag)?2:1);
						int iAdmin = i+offsetY; 
						if(iAdmin<0 || iAdmin>=rowsAdmin)
							continue;
						dgAdmin.GetScanline(0, iAdmin, slAdmin);
						dg.GetScanline(0, i, sl);
						if(iswind || hasTag)
							dgV.GetScanline(0, i, slV);
						for (int j = areaLeft; j <= areaRight; j++)
		                {		
							//基于矢量行政区划判断
//							isInArea = true;
//							Point2D pt2d = dg.CellToPoint(new Point(j, i));	
//							String str = String.format("\"Geometry\":\"%X\"", geo.GetHandle());
//				            pAnalyst.SetPropertyValue("A", "{" + str + "}");
//		                    GeoPoint geoPoint = new GeoPoint(pt2d.getX(), pt2d.getY());
//		                    str = String.format("\"Geometry\":\"%X\"", geoPoint.GetHandle());
//		                    pAnalyst.SetPropertyValue("B", "{" + str + "}");
//		                    pAnalyst.Execute();
//		                    String strOutput = pAnalyst.GetPropertyValue("Output");
//		                    if(strOutput.equals("true"))
//		                    	isInArea = true;
//		                    else
//		                    	isInArea = false;
							
							//基于栅格行政区划判断
							int jAdmin = j+offsetX; 
							if(jAdmin<0 || jAdmin>=colsAdmin)
								continue;
							double dCodeTemp = slAdmin.GetValue(jAdmin);
							if(dCodeTemp == dCode)
								isInArea = true;
							else {
								isInArea = false;
							}
							
							//赋值
							if(isInArea)
							{
								if(iswind || hasTag){
									sl.SetValue(j, arryValues.get(count + j*2));
									slV.SetValue(j, arryValues.get(count + j*2 + 1));
								}
								else{
									sl.SetValue(j, arryValues.get(count+j));	
								}								
							}
		                }
		                dg.SetScanline(0, i, sl);     
		                if(iswind || hasTag)
		                	dgV.SetScanline(0, i, slV);
		            }
					dg.FlushCache();
					dg.CalcExtreme();
					if(iswind || hasTag){
						dgV.FlushCache();
						dgV.CalcExtreme();	
					}
				}
			}
			
//			result = true;
		} catch (Exception e) {
			LogTool.logger.error("保存格点，详情【" + e.getMessage() + "】");
			e.printStackTrace();
			result = -1;
		}
		return result;
	}
	
	/**
	 * 生成格点报，导出Micaps第4和11类数据
	 * @return
	 */
	@POST
	@Path("exportToMicaps")
	@Produces("application/json")
	public Object exportToMicaps(@FormParam("para") String para) {
		Boolean result = false;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String stationCode = CommonTool.getJSONStr(jsonObject, "StationCode");  	//例如广西：BANN
			String type = CommonTool.getJSONStr(jsonObject, "type");                	//省台订正：prvn
			String elements = CommonTool.getJSONStr(jsonObject, "elements");	    	//所有要素，逗号分隔，例如：2t,tmax,tmin,r3,r12,tcc,vis,10uv。因为不同的业务（陆地岗、海洋岗、短临岗、首席岗等）生成的格点报
			String[] arrayElement = elements.split(",");
			Date maketime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			String version = CommonTool.getJSONStr(jsonObject, "version");
//			String datetime = CommonTool.getJSONStr(jsonObject, "datetime");         	//预报时间：2015-11-03 08:00:00
//			Date dateForecast = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(datetime);
			
			//根据制作时间查询起报时间
			String strMakeTimeHHmm = new SimpleDateFormat("HH:mm").format(maketime);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", "cty", strMakeTimeHHmm);
			ResultSet resultSet = stmt.executeQuery(sql);			
			int forecastHour = -1;
			while(resultSet.next()) {
				forecastHour = resultSet.getInt("forecastHour");
				break;
			}
			stmt.close();
			conn.close();
			Date dateForecast = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "maketime"));
			dateForecast.setHours(forecastHour);
			
//			Date dateNow = new Date();
//			String makeTime = new SimpleDateFormat("yyyyMMddHHmmss").format(dateNow);
			String strMakeTime = new SimpleDateFormat("yyyyMMddHHmmss").format(maketime);
			String forecastTime = new SimpleDateFormat("yyyyMMddHHmm").format(dateForecast);
			
			ArrayList<OutputSetting> outputSettingsAll = getOutputSetting();			
			ArrayList<Scheme> defaultSchemes = getDefaultScheme();
			for(String element : arrayElement){
				Scheme scheme = null;				
				for(int i=0; i<defaultSchemes.size(); i++){
					Scheme schemeTemp = defaultSchemes.get(i);
					if(schemeTemp.element.equals(element)){
						scheme = schemeTemp;
						break;
					}
				}
				if(scheme == null){
					LogTool.logger.error("默认方案中不存在要素：" + element);
					continue;
				}
				
				ArrayList<OutputSetting> outputSettings = new ArrayList<OutputSetting>();
				for(int i=0; i<outputSettingsAll.size(); i++){
					OutputSetting outputSettingTemp = outputSettingsAll.get(i);
					if(outputSettingTemp.element.equals(element)){
						outputSettings.add(outputSettingTemp);
					}
				}
				if(outputSettings.size() == 0){
					LogTool.logger.error("输出设置中不存在要素：" + element);
					continue;
				}				
				
				for(OutputSetting outputsetting : outputSettings)
				{
					Integer hourSpan = outputsetting.hourSpan;
					Integer hourSpanTotal = outputsetting.hourSpanTotal;
					
					File folder = new File(outputsetting.outputPath);
					if(!folder.exists()){
						folder.mkdirs();
					}
					else
					{
						String filter = "Z_NWGD_C_(.*)_date(.*)";
						filter = filter.replaceAll("date", forecastTime);
						File dataFile = new File(outputsetting.outputPath);
						File[] files = dataFile.listFiles(new BaoWenFileFilter(filter));
						if(files != null && files.length > 0)
						{
							for(File file : files)
								file.delete();
						}
					}
					
					//Z_NWGD_C_CCCC_YYYYMMDDhhmmss_P_RFFC_SPCC-TMP_YYYYMMDDhhmm_FFFxx.GRB2
					String strFile = String.format("%s/Z_NWGD_C_%s_%s_P_RFFC_SPCC-%s_%s_%s%s", outputsetting.outputPath, stationCode, strMakeTime, outputsetting.elementOut, forecastTime, new DecimalFormat("000").format(outputsetting.hourSpanTotal), new DecimalFormat("00").format(hourSpan));
					for(int h = hourSpan; h<=hourSpanTotal; h+=hourSpan){						
						Dataset dt = null;
						if(outputsetting.method == -1) //直接取值
						{
							if(element.equals("10uv") || element.equals("wmax")){
								String strDatasetName = this.getGridDatasetName(type, "1000", element, maketime, version, dateForecast, h);
								dt = this.getDataset(strDatasetName+"_u", true);	
								if(dt == null)
								{
									LogTool.logger.error("格点产品不存在：" + strDatasetName+"_u");
									continue;
								}	
								DatasetRaster drU = (DatasetRaster)dt;
								dt = this.getDataset(strDatasetName+"_v", true);	
								if(dt == null)
								{
									LogTool.logger.error("格点产品不存在：" + strDatasetName+"_v");
									continue;
								}	
								DatasetRaster drV = (DatasetRaster)dt;
								Map<String, String> metadata = generateMicapsMetaData(drU, outputsetting.elementCaption, dateForecast, h, 
										outputsetting.isolineInterval, outputsetting.isolineStart, outputsetting.isolineEnd);
								this.writeToMicaps11(String.format("%s.%03d", strFile, h), drU, drV, metadata);
								continue;
							}
							else{
								String strDatasetName = this.getGridDatasetName(type, "1000", element, maketime, version, dateForecast, h);
								dt = this.getDataset(strDatasetName, true);	
								if(dt == null)
								{
									LogTool.logger.error("格点产品不存在：" + strDatasetName);
									continue;
								}	
							}							
						}
						if(outputsetting.method == 2) //求和
						{
							ArrayList<DatasetRaster> arrayDatasetRaster = new ArrayList<DatasetRaster>();
							String[] strHourSpans = scheme.hourspan.split(",");
							for(String strHourSpan : strHourSpans){
								Integer nHourSpan = Integer.valueOf(strHourSpan);
								if(nHourSpan > (h-hourSpan) && nHourSpan <= h){
									String strDatasetName = this.getGridDatasetName(type, "1000", element, maketime, version, dateForecast, h);
									dt = this.getDataset(strDatasetName, true);
									if(dt == null)
									{
										LogTool.logger.error("格点产品不存在：" + strDatasetName);
										continue;
									}
									arrayDatasetRaster.add((DatasetRaster)dt);
								}
							}
							if(arrayDatasetRaster.size() == 0){
								LogTool.logger.error(outputsetting.elementOut + "与" + element + "时效不匹配");
								continue;
							}
							else
							{
								//创建结果数据源数据集
								String strAliasMem = "dsOutputMem";
								String desDatasetNameStatistics = "dtOutputMem";
								String strJson = "{\"Type\":\"Memory\",\"Alias\":\""+ strAliasMem +"\",\"Server\":\"\"}";
								Datasource dsMem = Application.m_workspace.GetDatasource(strAliasMem);
								if(dsMem != null)
									Application.m_workspace.CloseDatasource(dsMem.GetAlias());
								dsMem = Application.m_workspace.CreateDatasource(strJson);
								DatasetRaster dg0 = arrayDatasetRaster.get(0);
								
								Rectangle2D rcBounds = dg0.GetBounds();
								String strBounds = String.format("\"left\":%f,\"bottom\":%f,\"right\":%f,\"top\":%f", rcBounds.getX(), rcBounds.getY(), rcBounds.getX() + rcBounds.getWidth(), rcBounds.getY() + rcBounds.getHeight()); //左 上 宽 高
								String str = String.format("{\"Name\":\"%s\",\"ValueType\":\"%s\",\"Width\":%d,\"Height\":%d,\"BlockSize\":\"256 256\",\"Projection\":\"%s\",\"Bounds\":{%s},\"NoDataValue\":%f}",
										desDatasetNameStatistics, "Single", dg0.GetWidth(), dg0.GetHeight(), "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs", strBounds, dg0.GetNoDataValue());
								DatasetRaster dgOutputMem = dsMem.CreateDatasetRaster(str);
								dgOutputMem.Open();
								
								
								int cols = dgOutputMem.GetWidth();
	    						int rows = dgOutputMem.GetHeight();
								Scanline sl = new Scanline(dg0.GetValueType(), cols);
								double dNoDataValue = dgOutputMem.GetNoDataValue();
								double dValue = dNoDataValue;							
								for (int i = 0; i<rows; i++)
					            {
									dgOutputMem.GetScanline(0, i, sl);
									for(int j = 0; j< cols; j++){							
										dValue = dNoDataValue;
										
										for(int k=0; k<arrayDatasetRaster.size(); k++){
											DatasetRaster dgTemp = arrayDatasetRaster.get(k);
											double dValueTemp = dgTemp.GetValue(j, i);
											if(dValueTemp == dNoDataValue)
												continue;
											if(outputsetting.method == 0){ //最大
												if(dValue == dNoDataValue || dValueTemp > dValue)
													dValue = dValueTemp;
											}
											else if(outputsetting.method == 1){ //最小
												if(dValue == dNoDataValue || dValueTemp < dValue)
													dValue = dValueTemp;
											}
											else if(outputsetting.method == 2){ //求和
												{
													if(dValue == dNoDataValue)
														dValue = dValueTemp;
													else
														dValue += dValueTemp;
												}
											}
										}
										sl.SetValue(j, dValue);
									}								
									dgOutputMem.SetScanline(0, i, sl);
					            }
								dgOutputMem.FlushCache();
								dgOutputMem.CalcExtreme();
								dt = dgOutputMem;
							}							
						}
						
						if(dt != null){				
							DatasetRaster dr = (DatasetRaster)dt;
							Map<String, String> metadata = generateMicapsMetaData(dr, outputsetting.elementCaption, dateForecast, h, 
									outputsetting.isolineInterval, outputsetting.isolineStart, outputsetting.isolineEnd);
							this.writeToMicaps4(String.format("%s.%03d", strFile, h), dr, metadata);
						}	
					}
				}
			}
			
			result = true;
		} catch (Exception e) {
			LogTool.logger.error("生成格点报，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result;
	}
	
	/*
	 * 获取Micaps数据元数据
	 * */
	private Map<String, String> generateMicapsMetaData(DatasetRaster dr, String elementCaption, Date dateForecast, Integer hour,
			Double isolineInterval, Double isolineStart, Double isolineEnd){
		Calendar c = Calendar.getInstance();
		c.setTime(dateForecast);
		
		double tag = -1;  //倒过来
		Map<String, String> metadata = new HashMap<String, String>();
		metadata.put("数据说明", elementCaption);
		metadata.put("年", String.valueOf(c.get(Calendar.YEAR)));
		metadata.put("月", String.valueOf(c.get(Calendar.MONTH)+1));
		metadata.put("日", String.valueOf(c.get(Calendar.DATE))); 
		metadata.put("时次", String.valueOf(c.get(Calendar.HOUR_OF_DAY)));
		metadata.put("时效", String.valueOf(hour));
		metadata.put("层次", "0");
		metadata.put("经度格距", String.format("%.6f", dr.GetBounds().getWidth()/dr.GetWidth()));
		metadata.put("纬度格距", String.format("%.6f", tag*dr.GetBounds().getHeight()/dr.GetHeight()));
		metadata.put("起始经度", String.format("%.6f", dr.GetBounds().getX()));
		metadata.put("终止经度", String.format("%.6f", dr.GetBounds().getX() + dr.GetBounds().getWidth()));
		metadata.put("起始纬度", String.format("%.6f", tag>0?dr.GetBounds().getY() : dr.GetBounds().getY() + dr.GetBounds().getHeight()));
		metadata.put("终止纬度", String.format("%.6f", tag>0?dr.GetBounds().getY() + dr.GetBounds().getHeight() : dr.GetBounds().getY()));
		metadata.put("纬向格点数", String.valueOf(dr.GetWidth()));
		metadata.put("经向格点数", String.valueOf(dr.GetHeight()));
		metadata.put("等值线间隔", String.format("%.6f",isolineInterval));
		metadata.put("等值线起始值", String.format("%.6f",isolineStart));
		metadata.put("终止值", String.format("%.6f",isolineEnd));
		metadata.put("平滑系数", "1.000000");
 		metadata.put("加粗线值", "0.000000");
		return metadata;
	}
	
	/*
	 * 写Micaps第4类数据
	 * */
	private Boolean writeToMicaps4(String filePath, DatasetRaster dr, Map<String, String> metadata){
		Boolean result = false;
		try
		{
			File file = new File(filePath);
			if(file.exists())
				file.delete();
			RandomAccessFile raf = new RandomAccessFile(file, "rw"); 
			FileChannel channel = raf.getChannel();
	        byte[] data = null;
	        ByteBuffer buf = ByteBuffer.allocate(1024*1024);
	        // 拼接抬头和说明数据
	        StringBuilder sb = new StringBuilder();
            sb.append("diamond 4 " + metadata.get("数据说明") + "\r\n");
            sb.append(metadata.get("年")+" ");
            sb.append(metadata.get("月")+" ");
            sb.append(metadata.get("日")+" ");
            sb.append(metadata.get("时次")+" ");
            sb.append(metadata.get("时效")+" ");
            sb.append(metadata.get("层次"));
            sb.append("\r\n");
            sb.append(metadata.get("经度格距")+" ");
            sb.append(metadata.get("纬度格距")+" ");
            sb.append(metadata.get("起始经度")+" ");
            sb.append(metadata.get("终止经度")+" ");
            sb.append(metadata.get("起始纬度")+" ");
            sb.append(metadata.get("终止纬度")+" ");
            sb.append(metadata.get("纬向格点数")+" ");
            sb.append(metadata.get("经向格点数"));
            sb.append("\r\n");
            sb.append(metadata.get("等值线间隔")+" ");
            sb.append(metadata.get("等值线起始值")+" ");
            sb.append(metadata.get("终止值")+" ");
            sb.append(metadata.get("平滑系数")+" ");
            sb.append(metadata.get("加粗线值"));
            sb.append("\r\n");
            
	        // 将抬头和说明数据写进磁盘
	            buf.clear(); // clear for re-write
	            data = sb.toString().getBytes("utf-8");
	            for (int i = 0; i < data.length; i++) {
	                buf.put(data[i]);
	            }
	            data = null;
	            buf.flip(); // switches a Buffer from writing mode to reading mode
	            channel.write(buf);
	            channel.force(true);
	 
	        //channel.close();
	        //raf.close();
            //buffer.put((str + "\r\n").getBytes("utf-8"));
            //str = String.format("%s %s %s %s %s %s %s %s ", metadata.get("经度格距"), metadata.get("纬度格距"), metadata.get("起始经度"), metadata.get("终止经度"),
            		//metadata.get("起始纬度"), metadata.get("终止纬度"), metadata.get("纬向格点数"), metadata.get("经向格点数"));
            //buffer.put((str + "\r\n").getBytes("utf-8"));
	        StringBuffer sbData= new StringBuffer();
            int cols = dr.GetWidth();
            Scanline sl = new Scanline(dr.GetValueType(), cols);
            for (int i = dr.GetHeight() - 1; i >= 0; i--){
                dr.GetScanline(0, i, sl);
                for (int j = 0; j < cols; j++){
                   // str += String.format("%.1f", sl.GetValue(j)) + " ";
                	sbData.append(Math.round(sl.GetValue(j)*10.0)/10.0+" ");
                }
                //buffer.put((str + "\r\n").getBytes("utf-8"));
                sbData.append("\r\n");
            }
            
            //将数据写进磁盘
	            buf.clear(); // clear for re-write
	            data = sbData.toString().getBytes("utf-8");
	            for (int i = 0; i < data.length; i++) {
	                buf.put(data[i]);
	            }
	            data = null;
	            buf.flip(); // switches a Buffer from writing mode to reading mode
	            channel.write(buf);
	            channel.force(true);
	            
	            channel.close();
	            raf.close();
                LogTool.logger.info("生成成功："+filePath);
                result = true;
		}
		catch(Exception e)
		{
			LogTool.logger.error(e.getMessage());
			e.printStackTrace();
		}
		return result;
	}
	
	/*
	 * 写Micaps第11类数据
	 * */
	private Boolean writeToMicaps11(String filePath, DatasetRaster drU, DatasetRaster drV, Map<String, String> metadata){
		Boolean result = false;
		try
		{
			File file = new File(filePath);
			if(file.exists())
				file.delete();
			RandomAccessFile raf = new RandomAccessFile(file, "rw"); 
			FileChannel channel = raf.getChannel();
	        byte[] data = null;
	        ByteBuffer buf = ByteBuffer.allocate(1024*1024);
	        
	        // 拼接抬头和说明数据
	        StringBuilder sb = new StringBuilder();
            sb.append("diamond 11 " + metadata.get("数据说明") + "\r\n");
            sb.append(metadata.get("年")+" ");
            sb.append(metadata.get("月")+" ");
            sb.append(metadata.get("日")+" ");
            sb.append(metadata.get("时次")+" ");
            sb.append(metadata.get("时效")+" ");
            sb.append(metadata.get("层次"));
            sb.append("\r\n");
            sb.append(metadata.get("经度格距")+" ");
            sb.append(metadata.get("纬度格距")+" ");
            sb.append(metadata.get("起始经度")+" ");
            sb.append(metadata.get("终止经度")+" ");
            sb.append(metadata.get("起始纬度")+" ");
            sb.append(metadata.get("终止纬度")+" ");
            sb.append(metadata.get("纬向格点数")+" ");
            sb.append(metadata.get("经向格点数"));
            sb.append("\r\n");           
	        
	        // 将抬头和说明数据写进磁盘
	        buf.clear(); // clear for re-write
	        data = sb.toString().getBytes("utf-8");
	        for (int i = 0; i < data.length; i++) {
	             buf.put(data[i]);
	            }
	        data = null;
	        buf.flip(); // switches a Buffer from writing mode to reading mode
	        channel.write(buf);
	        channel.force(true);

	        
	        StringBuilder druData= new StringBuilder();
            int cols = drU.GetWidth();
            Scanline slU = new Scanline(drU.GetValueType(), cols);
            for (int i = drU.GetHeight() - 1; i >= 0; i--){
            	
            	drU.GetScanline(0, i, slU);
                for (int j = 0; j < cols; j++){
                   // str += String.format("%.1f", slU.GetValue(j)) + " ";
                	druData.append(Math.round(slU.GetValue(j)*10)/10 + " ");
                }
                //buffer.put((str + "\r\n").getBytes("utf-8"));
                druData.append("\r\n");
            }
            
            //将dru数据写进磁盘
            buf.clear(); // clear for re-write
	        data = druData.toString().getBytes("utf-8");
	        for (int i = 0; i < data.length; i++) {
	             buf.put(data[i]);
	            }
	        data = null;
	        buf.flip(); // switches a Buffer from writing mode to reading mode
	        channel.write(buf);
	        channel.force(true);
            // dru Write end 
            
	        StringBuilder drvData = new StringBuilder();
            cols = drV.GetWidth();
            Scanline slV = new Scanline(drV.GetValueType(), cols);
            for (int i = drV.GetHeight() - 1; i >= 0; i--){
            	drV.GetScanline(0, i, slV);
                for (int j = 0; j < cols; j++)
                {
                    //str += String.format("%.1f", slV.GetValue(j)) + " ";
                	drvData.append(Math.round(slV.GetValue(j)*10.0)/10.0+" ");
                }
                //buffer.put((str + "\r\n").getBytes("utf-8"));
                drvData.append("\r\n");
            }
            
            //将drv数据写进磁盘
            buf.clear(); // clear for re-write
	        data = drvData.toString().getBytes("utf-8");
	        for (int i = 0; i < data.length; i++) {
	             buf.put(data[i]);
	            }
	        data = null;
	        buf.flip(); // switches a Buffer from writing mode to reading mode
	        channel.write(buf);
	        channel.force(true);
            
            // 关闭通道
	        channel.close();
	        raf.close();
            result = true;
            LogTool.logger.info("生成成功："+filePath);
		}
		catch(Exception e)
		{
			LogTool.logger.error(e.getMessage());
			e.printStackTrace();
		}
		return result;
	}
	
	/*
	 * 获取默认方案
	 * */
	private ArrayList<Scheme> getDefaultScheme()
	{
		ArrayList<Scheme> defaultScheme = null;
		try {
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_griddefaultscheme");
			ResultSet resultSet = stmt.executeQuery(sql);
			defaultScheme = new ArrayList<Scheme>();
			while(resultSet.next()) {
				defaultScheme.add(new Scheme(resultSet.getString("type"), resultSet.getString("makeTime"), resultSet.getString("element"), resultSet.getString("model"), resultSet.getString("hourspan"), resultSet.getDouble("defaultDataValue")));
			}
			stmt.close();
			conn.close();
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}		
		return defaultScheme;
	}
	
	/*
	 * 获取输出设置
	 * */
	private ArrayList<OutputSetting> getOutputSetting()
	{
		ArrayList<OutputSetting> outputSetting = null;
		try {
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), 
					datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_gridoutputsetting");
			ResultSet resultSet = stmt.executeQuery(sql);
			outputSetting = new ArrayList<OutputSetting>();
			while(resultSet.next()) {
				outputSetting.add(new OutputSetting(resultSet.getString("elementOut"), resultSet.getString("elementCaption"), resultSet.getString("element"), 
						resultSet.getInt("hourSpan"), resultSet.getInt("hourSpanTotal"), resultSet.getString("outputPath"), resultSet.getInt("method"), 
						resultSet.getDouble("isolineInterval"), resultSet.getDouble("isolineStart") , resultSet.getDouble("isolineEnd")));
			}
			stmt.close();
			conn.close();
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}		
		return outputSetting;
	}
	
	/**
	 * 获取初始场默认方案
	 * @return
	 */
	@POST
	@Path("getGridDefaultSchemes")
	@Produces("application/json")
	public Object getGridDefaultSchemes(@FormParam("para") String para) {
		ArrayList<Scheme> result = null;
		try {			
			result = getDefaultScheme();
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	/**
	 * 获取站点
	 * @return
	 */
	@POST
	@Path("getStations")
	@Produces("application/json")
	public Object getStations(@FormParam("para") String para) {
		ArrayList<Station> result = null;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String areaCode = CommonTool.getJSONStr(jsonObject, "areaCode");
			result = queryStations(areaCode);
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	private ArrayList<Station>  queryStations(String areaCode){
		ArrayList<Station> result = null;
		try {			
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_station where AreaCode like '%s%%'", areaCode);
			ResultSet resultSet = stmt.executeQuery(sql);
			result = new ArrayList<Station>();
			while(resultSet.next()) {
				result.add(new Station(resultSet.getString("StationNum"), resultSet.getString("StationName"), 
						resultSet.getDouble("Latitude"), resultSet.getDouble("Longitude"), resultSet.getDouble("Height"), 
						resultSet.getInt("ZoomLevel"), resultSet.getInt("Type"), resultSet.getString("AreaCode")));
			}
			stmt.close();
			conn.close();
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	/**
	 * 获取预报站点
	 * @return
	 */
	@POST
	@Path("getStationsForecast")
	@Produces("application/json")
	public Object getStationsForecast(@FormParam("para") String para) {
		ArrayList<Station> result = null;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String areaCode = CommonTool.getJSONStr(jsonObject, "areaCode");
			result = queryStationsForecast(areaCode);
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	private ArrayList<Station>  queryStationsForecast(String areaCode){
		ArrayList<Station> result = null;
		try {			
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_stationForecast where AreaCode like '%s%%'", areaCode);
			ResultSet resultSet = stmt.executeQuery(sql);
			result = new ArrayList<Station>();
			while(resultSet.next()) {
				result.add(new Station(resultSet.getString("StationNum"), resultSet.getString("StationName"), 
						resultSet.getDouble("Latitude"), resultSet.getDouble("Longitude"), resultSet.getDouble("Height"), 
						resultSet.getInt("ZoomLevel"), resultSet.getInt("Type"), resultSet.getString("AreaCode")));
			}
			stmt.close();
			conn.close();
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	/**
	 * 获取航线
	 * @return
	 */
	@POST
	@Path("getSeaLanes")
	@Produces("application/json")
	public Object getSeaLanes(@FormParam("para") String para) {
		String result = null;
		try {
			String strAlias = "dsSeaLanes";
			Datasource ds = Application.m_workspace.GetDatasource(strAlias);
			if(ds == null)
			{
				String classPath = Thread.currentThread().getContextClassLoader().getResource("").getPath();
				classPath=classPath.substring(1);
				String strJson = String.format("{\"Type\":\"ESRI Shapefile\",\"Alias\":\"%s\",\"Server\":\"%s\"}", strAlias, classPath + "../data/SeaLanes.shp");
				ds = Application.m_workspace.OpenDatasource(strJson);
			}
			if(ds != null){
				DatasetVector dtv = (DatasetVector)ds.GetDataset(0);
				result = Toolkit.convertDatasetVectorToJson(dtv, "LINE");
			}
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	/**
	 * 格点转站点
	 * @return
	 */
	@POST
	@Path("grid2station")
	@Produces("application/json")
	public Object grid2station(@FormParam("para") String para) {
		ForecastData result = null;
		try {
			JSONObject jsonObject = new JSONObject(para);
			
			String departCode = CommonTool.getJSONStr(jsonObject, "departCode");
			Integer stationType = CommonTool.getJSONInt(jsonObject, "stationType");
			Integer productId = CommonTool.getJSONInt(jsonObject, "productId");
			Date makeTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String version = "p"; //一定是发布版
			
			//根据制作时间获取预报时间
			String strMakeTime = new SimpleDateFormat("HH:mm").format(makeTime);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", type, strMakeTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			int forecastHour = -1;
			while(resultSet.next()) {
				forecastHour = resultSet.getInt("forecastHour");
				break;
			}
			stmt.close();
			conn.close();
			Date forecastTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			forecastTime.setHours(forecastHour);
						
			//将要素、时效转换为ForecastDataElementHourSpans数组
			ArrayList<ForecastDataElementHourSpans> elements = new ArrayList<ForecastDataElementHourSpans>();
			JSONArray jsonArray = jsonObject.getJSONArray("elements");
			int nSize = jsonArray.length();
			for (int i = 0; i < nSize; i++) {  
				JSONObject jsonObjectElement = jsonArray.getJSONObject(i);
				String name = CommonTool.getJSONStr(jsonObjectElement, "name");
				String strHourSpans = CommonTool.getJSONStr(jsonObjectElement, "hourSpans");
				strHourSpans = strHourSpans.substring(1, strHourSpans.length() - 1);
				String[] arrayHourSpans = strHourSpans.split(",");
				ArrayList<Integer> nHourSpans = new ArrayList<Integer>(); 
				for(String strHourSpan : arrayHourSpans)
				{
					nHourSpans.add(Integer.valueOf(strHourSpan));
				}
				ForecastDataElementHourSpans element = new ForecastDataElementHourSpans(name, nHourSpans);
				elements.add(element);
			}
			
			HashMap paramMap = new HashMap();
			paramMap.put("id", productId);
			paramMap.put("type", stationType);
			paramMap.put("departCode", departCode+"%");
			IForecastfineService forecastfineService = (IForecastfineService)ContextLoader.getCurrentWebApplicationContext().getBean("ForecastfineService");
			Object stations = forecastfineService.getUserStationNew(paramMap);
			
			result = GridUtil.grid2station(type, makeTime, version, forecastTime, elements, stations);
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	
	/**
	 * 格点转任意点
	 * @return
	 */
	@POST
	@Path("grid2points")
	@Produces("application/json")
	public Object grid2points(@FormParam("para") String para) {
		ForecastData result = null;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date makeTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			JSONArray jsonArrayElement = jsonObject.getJSONArray("elements");
			JSONArray jsonArrayPoint = jsonObject.getJSONArray("points");
			
			//根据制作时间查询起报时间
			String strMakeTime = new SimpleDateFormat("HH:mm").format(makeTime);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", type, strMakeTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			int forecastHour = -1;
			while(resultSet.next()) {
				forecastHour = resultSet.getInt("forecastHour");
				break;
			}
			stmt.close();
			conn.close();
			Date forecastTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			forecastTime.setHours(forecastHour);
						
			//将要素、时效转换为ForecastDataElementHourSpans数组
			ArrayList<ForecastDataElementHourSpans> elements = new ArrayList<ForecastDataElementHourSpans>();			
			int nSize = jsonArrayElement.length();
			for (int i = 0; i < nSize; i++) {  
				JSONObject jsonObjectElement = jsonArrayElement.getJSONObject(i);
				String name = CommonTool.getJSONStr(jsonObjectElement, "name");
				String strHourSpans = CommonTool.getJSONStr(jsonObjectElement, "hourSpans");
				strHourSpans = strHourSpans.substring(1, strHourSpans.length() - 1);
				String[] arrayHourSpans = strHourSpans.split(",");
				ArrayList<Integer> nHourSpans = new ArrayList<Integer>(); 
				for(String strHourSpan : arrayHourSpans)
				{
					nHourSpans.add(Integer.valueOf(strHourSpan));
				}
				ForecastDataElementHourSpans element = new ForecastDataElementHourSpans(name, nHourSpans);
				elements.add(element);
			}
			
			//将任意点转换"站点"形式
			ArrayList<Map> stations = new ArrayList<Map>();
			nSize = jsonArrayPoint.length();
			for (int i = 0; i < nSize; i++) {  
				JSONObject jsonObjectPoint = jsonArrayPoint.getJSONObject(i);
				Double x = CommonTool.getJSONDouble(jsonObjectPoint, "x");
				Double y = CommonTool.getJSONDouble(jsonObjectPoint, "y");
				Map station = new HashMap<String, Object>();
				station.put("StationNum", String.valueOf(i));
				station.put("Longitude", x);
				station.put("Latitude", y);
				stations.add(station);
			}			
			
			result = GridUtil.grid2station(type, makeTime, version, forecastTime, elements, stations);			
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	@POST
	@Path("grid2pointsJuPing")
	@Produces("application/json")
	public Object grid2pointsJuPing(@FormParam("para") String para) {
		ForecastData result = null;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String type = CommonTool.getJSONStr(jsonObject, "type");
			String version = CommonTool.getJSONStr(jsonObject, "version");
			Date makeTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			JSONArray jsonArrayElement = jsonObject.getJSONArray("elements");
			JSONArray jsonArrayPoint = jsonObject.getJSONArray("points");
			
			//根据制作时间查询起报时间
			String strMakeTime = new SimpleDateFormat("HH:mm").format(makeTime);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", type, strMakeTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			int forecastHour = -1;
			while(resultSet.next()) {
				forecastHour = resultSet.getInt("forecastHour");
				break;
			}
			stmt.close();
			conn.close();
			Date forecastTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			forecastTime.setHours(forecastHour);
						
			//将要素、时效转换为ForecastDataElementHourSpans数组
			ArrayList<ForecastDataElementHourSpans> elements = new ArrayList<ForecastDataElementHourSpans>();			
			int nSize = jsonArrayElement.length();
			for (int i = 0; i < nSize; i++) {  
				JSONObject jsonObjectElement = jsonArrayElement.getJSONObject(i);
				String name = CommonTool.getJSONStr(jsonObjectElement, "name");
				String strHourSpans = CommonTool.getJSONStr(jsonObjectElement, "hourSpans");
				strHourSpans = strHourSpans.substring(1, strHourSpans.length() - 1);
				String[] arrayHourSpans = strHourSpans.split(",");
				ArrayList<Integer> nHourSpans = new ArrayList<Integer>(); 
				for(String strHourSpan : arrayHourSpans)
				{
					nHourSpans.add(Integer.valueOf(strHourSpan));
				}
				ForecastDataElementHourSpans element = new ForecastDataElementHourSpans(name, nHourSpans);
				elements.add(element);
			}
			
			//将任意点转换"站点"形式
			ArrayList<Map> stations = new ArrayList<Map>();
			nSize = jsonArrayPoint.length();
			for (int i = 0; i < nSize; i++) {  
				JSONObject jsonObjectPoint = jsonArrayPoint.getJSONObject(i);
				Double x = CommonTool.getJSONDouble(jsonObjectPoint, "x");
				Double y = CommonTool.getJSONDouble(jsonObjectPoint, "y");
				Map station = new HashMap<String, Object>();
				station.put("StationNum", String.valueOf(i));
				station.put("Longitude", x);
				station.put("Latitude", y);
				stations.add(station);
			}			
			
			result = GridUtil.grid2stationJuPing(type, makeTime, version, forecastTime, elements, stations);			
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return result;
	}
	/**
	 * 获取格点报文件
	 * @return
	 */
	@POST
	@Path("getGridFiles")
	@Produces("application/json")
	public Object getGridFiles(@FormParam("para") String para) {
		ArrayList<FileInfo> fileInfos = new ArrayList<FileInfo>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String strMakeTime = CommonTool.getJSONStr(jsonObject, "makeTime");
			Date makeTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(strMakeTime);
			strMakeTime = new SimpleDateFormat("yyyyMMddHHmmss").format(makeTime);
			String stationCodeString = "BANN";
			
			//根据制作时间查询起报时间
			String strMakeTimeHHmm = new SimpleDateFormat("HH:mm").format(makeTime);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select * from t_griddefaultscheme where type='%s' and makeTime='%s'", "cty", strMakeTimeHHmm);
			ResultSet resultSet = stmt.executeQuery(sql);			
			int forecastHour = -1;
			while(resultSet.next()) {
				forecastHour = resultSet.getInt("forecastHour");
				break;
			}
			stmt.close();
			conn.close();
			Date forecastTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "makeTime"));
			forecastTime.setHours(forecastHour);
			String strForecastTime = new SimpleDateFormat("yyyyMMddHHmm").format(forecastTime);
			
			//根据输出配置，获取文件信息
			ArrayList<OutputSetting> outputSettingsAll = getOutputSetting();
			for(OutputSetting outputsetting : outputSettingsAll)
			{
				Integer hourSpan = outputsetting.hourSpan;
				Integer hourSpanTotal = outputsetting.hourSpanTotal;
				
				File[] files = null;
				File folder = new File(outputsetting.outputPath);
				if(!folder.exists()){
					continue;
				}
				else
				{
					String filter = "Z_NWGD_C_.*?_makeTime.*?";
					filter = filter.replaceAll("makeTime", strMakeTime);
					File dataFile = new File(outputsetting.outputPath);
					files = dataFile.listFiles(new BaoWenFileFilter(filter));
				}
				
				String filenamewithoutextension = String.format("Z_NWGD_C_%s_%s_P_RFFC_SPCC-%s_%s_%s%s", stationCodeString, strMakeTime, outputsetting.elementOut, strForecastTime, new DecimalFormat("000").format(outputsetting.hourSpanTotal), new DecimalFormat("00").format(hourSpan));
				for(int h = hourSpan; h<=hourSpanTotal; h+=hourSpan){
					String filename = String.format("%s.%03d", filenamewithoutextension, h);
					Integer status = 0;
					Integer size = 0;
					String tag = outputsetting.elementCaption;
					if(files != null && files.length > 0)
					{
						for(File file : files){
							if(file.getName().equals(filename)){
								status = 1;
								size = (int)file.length(); //B
								break;
							}
						}
					}
					fileInfos.add(new FileInfo(filename, size, status, tag));
				}
			}
		}
		catch(Exception e){
			e.printStackTrace();
			}
		return fileInfos;
	}
	@POST
	@Path("getHosTemp")
	@Produces("application/json")
	public ArrayList<Double> getHosTemp(@FormParam("para") String para) {
		ArrayList<Double> lsResult=new ArrayList<Double>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			Date startTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "starttime"));
			int days=CommonTool.getJSONInt(jsonObject, "day");
			String stationNum=CommonTool.getJSONStr(jsonObject, "stationnum");
			double x = CommonTool.getJSONDouble(jsonObject, "x");
			double y = CommonTool.getJSONDouble(jsonObject, "y");
			String method=CommonTool.getJSONStr(jsonObject, "method");
			int section=CommonTool.getJSONInt(jsonObject, "section");
			//获取站点
			GeoPoint gp = new GeoPoint(x, y);
			Map<String, Object> infoCounty = getAdminInfo("county", gp);
			//根据制作时间查询起报时间
			String strStartTime = new SimpleDateFormat("?MM?dd").format(startTime);
			strStartTime=strStartTime.replace("?","%s");
			strStartTime=String.format(strStartTime, "M","D");
			//所用列
			String strCol="";
			Calendar cal=Calendar.getInstance();
			cal.setTime(startTime);
			for(int d=0;d<days;d++){
				Date thisDate=cal.getTime();
				String strCurTime = new SimpleDateFormat("?MM?dd").format(thisDate);
				strCurTime=strCurTime.replace("?","%s");
				strCurTime=String.format(strStartTime, "M","D");
				strCol+=strCurTime+",";
				cal.add(Calendar.DAY_OF_MONTH,1);
			}
			strCol=strCol.substring(0,strCol.length()-1);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select %s from t_hos_avgtemp where STARTTIME='%s' and makeTime='%s'",strCol,strStartTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				if(section==1){
					for(int d=0;d<days;d++){
						lsResult.add(resultSet.getDouble(d+1));
					}
				}
				else{
					int part=days/section;//分段的第几段
					for(int p=0;p<part;p++){
						Double tempResult=resultSet.getDouble(p*section+0);
						for(int s=1;s<section;s++){
							Double thisVal=resultSet.getDouble(p*section+s);
							if(method.toLowerCase().equals("min")){
								tempResult=tempResult>thisVal?thisVal:tempResult;
							}
							else if(method.toLowerCase().equals("max")){
								tempResult=tempResult>thisVal?tempResult:thisVal;
							}
							else if(method.toLowerCase().equals("sum")){
								tempResult+=tempResult;						
							}
							else if(method.toLowerCase().equals("avg")){
								tempResult=(tempResult+thisVal)/2;
							}
							lsResult.add(tempResult);
						}
					}
				}
				break;
			}
		}
		catch(Exception ex){
			
		}
		return lsResult;
	}
	@POST
	@Path("getHosRain")
	@Produces("application/json")
	public ArrayList<Double> getHosRain(@FormParam("para") String para) {
		ArrayList<Double> lsResult=new ArrayList<Double>();
		try {			
			JSONObject jsonObject = new JSONObject(para);
			Date startTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse(CommonTool.getJSONStr(jsonObject, "starttime"));
			int days=CommonTool.getJSONInt(jsonObject, "day");
			String stationNum=CommonTool.getJSONStr(jsonObject, "stationnum");
			double x = CommonTool.getJSONDouble(jsonObject, "x");
			double y = CommonTool.getJSONDouble(jsonObject, "y");
			String method=CommonTool.getJSONStr(jsonObject, "method");
			int section=CommonTool.getJSONInt(jsonObject, "section");
			//获取站点
			GeoPoint gp = new GeoPoint(x, y);
			Map<String, Object> infoCounty = getAdminInfo("county", gp);
			//根据制作时间查询起报时间
			String strStartTime = new SimpleDateFormat("?MM?dd").format(startTime);
			strStartTime=strStartTime.replace("?","%s");
			strStartTime=String.format(strStartTime, "M","D");
			//所用列
			String strCol="";
			Calendar cal=Calendar.getInstance();
			cal.setTime(startTime);
			for(int d=0;d<days;d++){
				Date thisDate=cal.getTime();
				String strCurTime = new SimpleDateFormat("?MM?dd").format(thisDate);
				strCurTime=strCurTime.replace("?","%s");
				strCurTime=String.format(strStartTime, "M","D");
				strCol+=strCurTime+",";
				cal.add(Calendar.DAY_OF_MONTH,1);
			}
			strCol=strCol.substring(0,strCol.length()-1);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()), datasourceConnectionConfigInfo.getUser(), datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select %s from t_hos_avgtemp where STARTTIME='%s' and makeTime='%s'",strCol,strStartTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				if(section==1){
					for(int d=0;d<days;d++){
						lsResult.add(resultSet.getDouble(d+1));
					}
				}
				else{
					int part=days/section;//分段的第几段
					for(int p=0;p<part;p++){
						Double tempResult=resultSet.getDouble(p*section+0);
						for(int s=1;s<section;s++){
							Double thisVal=resultSet.getDouble(p*section+s);
							if(method.toLowerCase().equals("min")){
								tempResult=tempResult>thisVal?thisVal:tempResult;
							}
							else if(method.toLowerCase().equals("max")){
								tempResult=tempResult>thisVal?tempResult:thisVal;
							}
							else if(method.toLowerCase().equals("sum")){
								tempResult+=tempResult;						
							}
							else if(method.toLowerCase().equals("avg")){
								tempResult=(tempResult+thisVal)/2;
							}
							lsResult.add(tempResult);
						}
					}
				}
				break;
			}
		}
		catch(Exception ex){
			
		}
		return lsResult;
	}
	private Map<String, Object> getAdminInfo(String adminLevel,GeoPoint gp){
		Map<String, Object> result = null;
		String strSHPFileName = null;
		if(adminLevel.equals("province"))
			strSHPFileName = "T_ADMINDIV_PROVINCE";
		else if(adminLevel.equals("city"))
			strSHPFileName = "T_ADMINDIV_CITY";
		if(adminLevel.equals("county"))
			strSHPFileName = "T_ADMINDIV_COUNTY";
		if(strSHPFileName != null){
			String strAlias = strSHPFileName;
			Datasource ds = Application.m_workspace.GetDatasource(strAlias);
			if(ds == null)
			{
				String classPath = Thread.currentThread().getContextClassLoader().getResource("").getPath();
				classPath=classPath.substring(1);
				String strJson = String.format("{\"Type\":\"ESRI Shapefile\",\"Alias\":\"%s\",\"Server\":\"%s\"}", strAlias, classPath + "../data/"+strSHPFileName+".shp");
				ds = Application.m_workspace.OpenDatasource(strJson);
			}
			if(ds != null){
				DatasetVector dtv = (DatasetVector)ds.GetDataset(0);
				String strJson = "{\"SpatialRel\":\"Within\"}";
				Recordset rs = dtv.Query(strJson, gp);
				if(rs != null && rs.GetRecordCount() > 0){
					rs.MoveFirst();
					result = new HashMap<String, Object>();
					result.put("NAME", rs.GetFieldValue("NAME"));
					result.put("CODE", rs.GetFieldValue("CODE"));
					rs.Destroy();
				}
			}
		}
		return result;
	}
	@POST
	@Path("getAreaZSCS")
	@Produces("application/json")
	public Object getAreaZSCS(@FormParam("para") String para){
    	ArrayList<Object> result = null;
		JSONObject jsonObject=null;
		try {
			jsonObject = new JSONObject(para);
			String curtime = jsonObject.getString("curtime");
			
			DatasourceConnectionConfigInfo datasourceConnectionConfigInfo = (DatasourceConnectionConfigInfo)ApplicationContextFactory.getInstance().getBean("datasourceConnectionConfigInfo");			
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), 
					datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()),
					datasourceConnectionConfigInfo.getUser(),datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement(); 
			String sql = String.format("select t_city.areaname,avg(tzs),avg(tcs),avg(rzs),avg(rcs) from t_county left join t_city on t_county.parentcode=t_city.code left join t_station on t_county.code=t_station.AreaCode right join t_zscs on t_station.StationNum=t_zscs.stationnum where publictime='%s' group by areaname", curtime);
			System.out.println(sql);
			ResultSet resultSet = stmt.executeQuery(sql);
			result = new ArrayList<Object>();
			while(resultSet.next()) {
				result.add(new Object[]{resultSet.getString(1),resultSet.getDouble(2),resultSet.getDouble(3),resultSet.getDouble(4),resultSet.getDouble(5)});
			}
			stmt.close();
			conn.close();			
		} catch (Exception e) {
			e.printStackTrace();
		}
		return result;
	}
	/**
     * 获取逐日报文
     * @throws Exception 
     */
    
    @POST
	@Path("getZhuRiBaoWen")
	@Produces("application/json")
	public ArrayList<Object> getZhuRiBaoWen(@FormParam("para") String para) throws Exception{
    	ArrayList<Object> al=new ArrayList<Object>();
		JSONObject jsonObject = new JSONObject(para);
		String datetime = CommonTool.getJSONStr(jsonObject, "datetime");
		datetime=datetime.replace("-","");
		CommonConfig commonfig = (CommonConfig)ApplicationContextFactory.getInstance().getBean("commonConifg");
		String path=commonfig.getQutai_ForecastPath()+"逐日预报/";
		String tempFile=path+"逐日预报(温度)/fcst_stn_temp_date.txt";
		String precFile=path+"逐日预报(降水)/fcst_stn_prec_date.txt";
		tempFile=tempFile.replace("date", datetime);
		precFile=precFile.replace("date", datetime);
		File tFile=new File(tempFile);
		File pFile=new File(precFile);
		List<File> lsF=new ArrayList<File>();
		lsF.add(tFile);
		lsF.add(pFile);
		for(int i=0;i<lsF.size();i++){
			File f=lsF.get(i);
			String fName=f.getName();
			String id="";
			if(fName.contains("temp")){
				id="temp";
			}
			else if(fName.contains("prec")){
				id="prec";
			}
			if(!f.exists()){
				System.out.println("文件不存在!");
				continue;
			}
			Scanner in=null;
			try{
				 in= new Scanner(f);
				if(in.hasNextLine()){//第一行不用
					in.nextLine();
				}
				while (in.hasNextLine()) {
	                String str = in.nextLine();
	                if(str.equals(""))
	                	break;
	                String[] strs=str.split("     ");//5个空格
	                strs[strs.length-1]=id;
	                al.add(strs);
	            }  
			}
			catch(Exception ex){
				System.out.println(ex.toString());
			}
			in.close();
		}
    	return al;
    }
    @POST
   	@Path("GetBufferdGrid")
   	@Produces("application/json")
   	public Object GetBufferdGrid(@FormParam("para") String para)
   	{
    	long begin = System.currentTimeMillis();
    	Workspace ws=new Workspace();
    	List<GridData> lsGrid=new ArrayList<>();
    	JSONObject jsonObject=null;
    	String startDate=null;
    	String endDate=null;
    	String viewDate=null;
    	String level="";
    	int p1=0,p2=0;//滤波周期
    	try 
		{
			jsonObject = new JSONObject(para);
			startDate= jsonObject.getString("startdate");
			endDate= jsonObject.getString("enddate");
			viewDate= jsonObject.getString("viewdate");
			level= jsonObject.getString("level");
			String strPeriod=jsonObject.getString("period");
			String[] periods=strPeriod.split("-");
			p1=Integer.parseInt(periods[0]);
			p2=Integer.parseInt(periods[1]);
		}
		catch(Exception ex)
		{
			ex.printStackTrace();
		}
    	startDate=startDate.replaceAll("-", "");
    	endDate=endDate.replaceAll("-", "");
    	String path="C:/Users/lenovo/Desktop/temp/";
    	String uAlias="wind_"+startDate+"_"+endDate+"_"+viewDate+"_"+level+"_"+p1+"_"+p2+"_u";
    	String fileNameU=uAlias+".tif";
    	String vAlias="wind_"+startDate+"_"+endDate+"_"+viewDate+"_"+level+"_"+p1+"_"+p2+"_v";
    	String fileNameV=vAlias+".tif";
    	String fileU=path+fileNameU;
    	String fileV=path+fileNameV;
    	File fiU=new File(fileU);
    	File fiV=new File(fileV);
    	if(!fiU.exists()||!fiV.exists())
    		return lsGrid;
    	String strJson = "{\"Type\":\"GTiff\",\"Alias\":\"" + uAlias+ "\",\"Server\":\"" + fileU + "\"}";
    	Datasource dsU=ws.OpenDatasource(strJson);
    	strJson = "{\"Type\":\"GTiff\",\"Alias\":\"" + vAlias+ "\",\"Server\":\"" + fileV + "\"}";
    	Datasource dsV=ws.OpenDatasource(strJson);
    	GridData gridU=new GridData();
    	GridData gridV=new GridData();
    	DatasetRaster drU=(DatasetRaster) dsU.GetDataset(0);
    	DatasetRaster drV=(DatasetRaster) dsV.GetDataset(0);
    	int rows=drU.GetHeight();
    	int cols=drU.GetWidth();
    	ArrayList<Double> dValuesU=new ArrayList<>();
    	ArrayList<Double> dValuesV=new ArrayList<>();
    	for(int r=0;r<rows;r++)
    	{
    		for(int c=0;c<cols;c++)
    		{
    			Double uVal=drU.GetValue(c, r);
    			Double vVal=drV.GetValue(c, r);
    			dValuesU.add(uVal);
    			dValuesV.add(vVal);
    		}
    	}
    	gridU.setLeft(drU.GetBounds().getX());
    	gridU.setBottom(drU.GetBounds().getY());
    	gridU.setRight(drU.GetBounds().getX() + drU.GetBounds().getWidth());
    	gridU.setTop(drU.GetBounds().getY() + drU.GetBounds().getHeight());
    	gridU.setRows(drU.GetHeight());
    	gridU.setCols(drU.GetWidth());
    	gridU.setDValues(dValuesU);
    	gridU.setNoDataValue(drU.GetNoDataValue());
    	
    	gridV.setLeft(drV.GetBounds().getX());
    	gridV.setBottom(drV.GetBounds().getY());
    	gridV.setRight(drV.GetBounds().getX() + drV.GetBounds().getWidth());
    	gridV.setTop(drV.GetBounds().getY() + drV.GetBounds().getHeight());
    	gridV.setRows(drV.GetHeight());
    	gridV.setCols(drV.GetWidth());
    	gridV.setDValues(dValuesV);
    	gridV.setNoDataValue(drV.GetNoDataValue());
    	lsGrid.add(gridU);
    	lsGrid.add(gridV);
    	long end = System.currentTimeMillis() - begin;
		long usetime=end/1000;
		System.out.println("获取UV耗时：" + usetime + "秒");
    	return lsGrid;
   	}
}
