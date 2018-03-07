package com.spd.qhyc.tool;

import java.awt.geom.Point2D;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.mg.objects.Dataset;
import com.mg.objects.DatasetRaster;
import com.mg.objects.DatasetVector;
import com.mg.objects.Datasource;
import com.mg.objects.GeoPoint;
import com.mg.objects.Recordset;
import com.spd.qhyc.domain.Application;
import com.spd.qhyc.domain.ForecastData;
import com.spd.qhyc.domain.ForecastDataElementHourSpans;
import com.spd.qhyc.domain.ForecastDataItem;
import com.spd.qhyc.ws.GridService;

public class GridUtil {	
	
	/*
	 * 格点预报转站点预报
	 * */
	public static ForecastData grid2station(String type, Date makeTime,String version, Date forecastTime, ArrayList<ForecastDataElementHourSpans> elements, Object stations)
	{
		ForecastData result = new ForecastData();
		try {
			ArrayList<ForecastDataItem> items = new ArrayList<ForecastDataItem>();
			
			GridService gridService = new GridService();
			for(ForecastDataElementHourSpans elementHourSpans : elements){				
				String elementSrc = elementHourSpans.getName();
				String element = elementSrc;
				if(elementSrc.equals("ws") || elementSrc.equals("wd")) //12小时风向风速在格点预报中对应日最大风wmax
					element = "wmax";
				else if(elementSrc.equals("ws3") || elementSrc.equals("wd3")) //3小时风向风速在格点预报中对应10uv
					element = "10uv";
				
				if(element.equals("")){
					System.out.println("未知要素："+elementSrc);
					continue;
				}
				if(elementSrc.equals("wd") || elementSrc.equals("wd3")) //跳过风向，循环风速时一并生成风向
					continue;	
				
				ArrayList<Integer> hourSpans = elementHourSpans.getHourSpans();							
				for(Integer hourSpan : hourSpans){					
					try
					{					
						if(element.equals("wmax") || element.equals("10uv"))
						{
							String strDatasetName = gridService.getGridDatasetName(type, "1000", element, makeTime, version, forecastTime, hourSpan);
							String strDatasetNameU = strDatasetName+"_u";
							String strDatasetNameV = strDatasetName+"_v";
							Dataset dtU = gridService.getDataset(strDatasetNameU, false);
							Dataset dtV = gridService.getDataset(strDatasetNameV, false);
							if(dtU == null || dtV == null)
							{
								System.out.println("数据集不存在，详情【" + strDatasetName + "】");
								continue;
							}	
							else
							{
								ArrayList<Double> wsValues = new ArrayList<Double>();
								ArrayList<Double> wdValues = new ArrayList<Double>();
								DatasetRaster dgU  = (DatasetRaster)dtU;
								dgU.CalcExtreme();
								DatasetRaster dgV  = (DatasetRaster)dtV;
								dgV.CalcExtreme();
								ArrayList<Map> listStation = (ArrayList<Map>)stations;
								for(int i = 0; i < listStation.size(); i++) {
									Map map = listStation.get(i);
									String stationNum = map.get("StationNum").toString();
									Double longitude = Double.valueOf( map.get("Longitude").toString());
									Double latitude = Double.valueOf( map.get("Latitude").toString());
									Point2D pt = new Point2D.Double(longitude, latitude);
									Point2D cell = dgU.PointToCell(pt);
									int col = (int)cell.getX();
									int row = (int)cell.getY();
									Double u = dgU.GetValue(col, row);
									Double v = dgV.GetValue(col, row);
									Double ws = Math.sqrt(u*u + v*v);
									Double wd = 270.0-Math.atan2(v, u)*180.0/Math.PI;
									wd%=360;
									if(wd<0)
										wd+=360;
									
									Double wsCode = getWSCode(ws);
									Double wdCode = getWDCode(wd);									
									wsValues.add(wsCode);
									wdValues.add(wdCode);
								}
								if(element.equals("wmax")){
									items.add(new ForecastDataItem("ws", hourSpan, wsValues));
									items.add(new ForecastDataItem("wd", hourSpan, wdValues));	
								}								
								else if(element.equals("10uv")){
									items.add(new ForecastDataItem("ws3", hourSpan, wsValues));
									items.add(new ForecastDataItem("wd3", hourSpan, wdValues));
								}
							}	
						}
						else
						{							
							String strDatasetName = gridService.getGridDatasetName(type, "1000", element, makeTime, version, forecastTime, hourSpan);
							Dataset dt = gridService.getDataset(strDatasetName, false);
							if(dt == null)
							{
								System.out.println("数据集不存在，详情【" + strDatasetName + "】");
								continue;
							}	
							else
							{								
								ArrayList<Double> values = new ArrayList<Double>();
								DatasetRaster dg = (DatasetRaster)dt;
								ArrayList<Map> listStation = (ArrayList<Map>)stations;
								for(int i = 0; i < listStation.size(); i++) {
									Map map = listStation.get(i);
									Double longitude = Double.valueOf( map.get("Longitude").toString());
									Double latitude = Double.valueOf( map.get("Latitude").toString());
									Point2D pt = new Point2D.Double(longitude, latitude);
									Point2D cell = dg.PointToCell(pt);
									double dValue = dg.GetValue((int)cell.getX(), (int)cell.getY());
									values.add(Math.round(dValue*10.0)/10.0);									
								}
								items.add(new ForecastDataItem(elementSrc, hourSpan, values));								
							}							
						}	
					}
					catch(Exception ex){
						System.out.println("时效："+ hourSpan +"小时，获取格点数据失败，详情【" + ex.getMessage() + "】");
					}					
				}
			}
			
			ArrayList<String> stationNums = new ArrayList<String>();
			ArrayList<Map> listStation = (ArrayList<Map>)stations;
			for(int i = 0; i < listStation.size(); i++) {
				Map map = listStation.get(i);
				stationNums.add(map.get("StationNum").toString());				
			}
			result.setStationNums(stationNums);
			result.setItems(items);
		}
		catch(Exception e){
			e.printStackTrace();
		}
		
		return result;
	}
	//add by wangkun,20160620,获取一个点，单要素的值，返回数组
	/*public static ForecastData gridOnePointVal(String type, Date makeTime,String version, Date forecastTime, String element, Object stations,ArrayList<Integer> hourSpans)
	{
		ArrayList<Double> alResult=new ArrayList<Double>();
		try {
			GridService gridService = new GridService();
			if(element.equals("")){
				System.out.println("未知要素："+element);
			}						
			for(Integer hourSpan : hourSpans){					
				try
				{
					String strDatasetName = gridService.getGridDatasetName(type, "1000", element, makeTime, version, forecastTime, hourSpan);
					Dataset dt = gridService.getDataset(strDatasetName, false);
					if(dt == null)
					{
						System.out.println("数据集不存在，详情【" + strDatasetName + "】");
						continue;
					}	
					else
					{								
						ArrayList<Double> values = new ArrayList<Double>();
						DatasetRaster dg = (DatasetRaster)dt;
						ArrayList<Map> listStation = (ArrayList<Map>)stations;
						for(int i = 0; i < listStation.size(); i++) {
							Map map = listStation.get(i);
							Double longitude = Double.valueOf( map.get("Longitude").toString());
							Double latitude = Double.valueOf( map.get("Latitude").toString());
							Point2D pt = new Point2D.Double(longitude, latitude);
							Point2D cell = dg.PointToCell(pt);
							double dValue = dg.GetValue((int)cell.getX(), (int)cell.getY());
							values.add(Math.round(dValue*10.0)/10.0);									
						}
						//items.add(new ForecastDataItem(element, hourSpan, values));								
					}	
				}
				catch(Exception ex){
					System.out.println("时效："+ hourSpan +"小时，获取格点数据失败，详情【" + ex.getMessage() + "】");
				}					
			}
			
			ArrayList<String> stationNums = new ArrayList<String>();
			ArrayList<Map> listStation = (ArrayList<Map>)stations;
			for(int i = 0; i < listStation.size(); i++) {
				Map map = listStation.get(i);
				stationNums.add(map.get("StationNum").toString());				
			}
			result.setStationNums(stationNums);
			result.setItems(items);
		}
		catch(Exception e){
			e.printStackTrace();
		}
		
		return result;
	}*/
	/*
	 * 格点预报转站点预报
	 * */
	public static ForecastData grid2stationJuPing(String type, Date makeTime,String version, Date forecastTime, ArrayList<ForecastDataElementHourSpans> elements, Object stations)
	{
		ForecastData result = new ForecastData();
		DecimalFormat df = new DecimalFormat("#.00");
		try {
			ArrayList<ForecastDataItem> items = new ArrayList<ForecastDataItem>();
			
			GridService gridService = new GridService();
			for(ForecastDataElementHourSpans elementHourSpans : elements){				
				String elementSrc = elementHourSpans.getName();
				String element = elementSrc;
				if(elementSrc.equals("ws") || elementSrc.equals("wd")) //12小时风向风速在格点预报中对应日最大风wmax
					element = "wmax";
				else if(elementSrc.equals("ws3") || elementSrc.equals("wd3")) //3小时风向风速在格点预报中对应10uv
					element = "10uv";
				
				if(element.equals("")){
					System.out.println("未知要素："+elementSrc);
					continue;
				}
				if(elementSrc.equals("wd") || elementSrc.equals("wd3")) //跳过风向，循环风速时一并生成风向
					continue;	
				
				ArrayList<Integer> hourSpans = elementHourSpans.getHourSpans();	
				//获取历史资料
				Double lon=Double.valueOf(((ArrayList<Map>)stations).get(0).get("Longitude").toString());
				Double lat=Double.valueOf(((ArrayList<Map>)stations).get(0).get("Latitude").toString());
				ArrayList<Double> alHos=null;
				if(element.equals("2t"))//获取气温
				{
					alHos=getHosTemp(makeTime,hourSpans.size(),lon,lat);
				}
				else if(element.equals("r24"))//降水
				{
					alHos=getHosRain(makeTime,hourSpans.size(),lon,lat);
				}
				int index=0;
				for(Integer hourSpan : hourSpans){					
					try
					{					
						if(element.equals("wmax") || element.equals("10uv"))
						{
							String strDatasetName = gridService.getGridDatasetName(type, "1000", element, makeTime, version, forecastTime, hourSpan);
							String strDatasetNameU = strDatasetName+"_u";
							String strDatasetNameV = strDatasetName+"_v";
							Dataset dtU = gridService.getDataset(strDatasetNameU, false);
							Dataset dtV = gridService.getDataset(strDatasetNameV, false);
							if(dtU == null || dtV == null)
							{
								System.out.println("数据集不存在，详情【" + strDatasetName + "】");
								continue;
							}	
							else
							{
								ArrayList<Double> wsValues = new ArrayList<Double>();
								ArrayList<Double> wdValues = new ArrayList<Double>();
								DatasetRaster dgU  = (DatasetRaster)dtU;
								dgU.CalcExtreme();
								DatasetRaster dgV  = (DatasetRaster)dtV;
								dgV.CalcExtreme();
								ArrayList<Map> listStation = (ArrayList<Map>)stations;
								for(int i = 0; i < listStation.size(); i++) {
									Map map = listStation.get(i);
									String stationNum = map.get("StationNum").toString();
									Double longitude = Double.valueOf( map.get("Longitude").toString());
									Double latitude = Double.valueOf( map.get("Latitude").toString());
									Point2D pt = new Point2D.Double(longitude, latitude);
									Point2D cell = dgU.PointToCell(pt);
									int col = (int)cell.getX();
									int row = (int)cell.getY();
									Double u = dgU.GetValue(col, row);
									Double v = dgV.GetValue(col, row);
									Double ws = Math.sqrt(u*u + v*v);
									Double wd = 270.0-Math.atan2(v, u)*180.0/Math.PI;
									wd%=360;
									if(wd<0)
										wd+=360;
									
									Double wsCode = getWSCode(ws);
									Double wdCode = getWDCode(wd);									
									wsValues.add(wsCode);
									wdValues.add(wdCode);
								}
								if(element.equals("wmax")){
									items.add(new ForecastDataItem("ws", hourSpan, wsValues));
									items.add(new ForecastDataItem("wd", hourSpan, wdValues));	
								}								
								else if(element.equals("10uv")){
									items.add(new ForecastDataItem("ws3", hourSpan, wsValues));
									items.add(new ForecastDataItem("wd3", hourSpan, wdValues));
								}
							}	
						}
						else
						{							
							String strDatasetName = gridService.getGridDatasetName(type, "1000", element, makeTime, version, forecastTime, hourSpan);
							Dataset dt = gridService.getDataset(strDatasetName, false);
							if(dt == null)
							{
								System.out.println("数据集不存在，详情【" + strDatasetName + "】");
								continue;
							}	
							else
							{								
								ArrayList<Double> values = new ArrayList<Double>();
								DatasetRaster dg = (DatasetRaster)dt;
								ArrayList<Map> listStation = (ArrayList<Map>)stations;
								for(int i = 0; i < listStation.size(); i++) {
									Map map = listStation.get(i);
									Double longitude = Double.valueOf( map.get("Longitude").toString());
									Double latitude = Double.valueOf( map.get("Latitude").toString());
									Point2D pt = new Point2D.Double(longitude, latitude);
									Point2D cell = dg.PointToCell(pt);
									double dValue = dg.GetValue((int)cell.getX(), (int)cell.getY());
									values.add(Math.round(dValue*10.0)/10.0);									
								}
								Double hosVal=alHos.get(index);
								if(element.equals("2t"))//气温距平
								{
									values.set(0, Double.parseDouble(df.format(values.get(0)-hosVal)));
								}
								else if(element.equals("r24"))//降水距平率
								{
									values.set(0, Double.parseDouble(df.format((values.get(0)-hosVal)/hosVal))*100);
								}
								items.add(new ForecastDataItem(elementSrc, hourSpan, values));								
							}							
						}	
					}
					catch(Exception ex){
						System.out.println("时效："+ hourSpan +"小时，获取格点数据失败，详情【" + ex.getMessage() + "】");
					}
					index++;
				}
			}
			
			ArrayList<String> stationNums = new ArrayList<String>();
			ArrayList<Map> listStation = (ArrayList<Map>)stations;
			for(int i = 0; i < listStation.size(); i++) {
				Map map = listStation.get(i);
				stationNums.add(map.get("StationNum").toString());				
			}
			result.setStationNums(stationNums);
			result.setItems(items);
		}
		catch(Exception e){
			e.printStackTrace();
		}
		
		return result;
	}
	
	//风向转编码
	public static double getWDCode(double wd) {
		Double wdCode = 9.0;
		if(wd<0)
			wdCode = 9.0;
		else if(wd>337.5 || wd<=22.5)
			wdCode = 8.0;
		else if(wd>292.5 && wd<=337.5)
			wdCode = 7.0;
		else if(wd>247.5 && wd<=292.5)
			wdCode = 6.0;
		else if(wd>202.5 && wd<=247.5)
			wdCode = 5.0;
		else if(wd>157.5 && wd<=202.5)
			wdCode = 4.0;
		else if(wd>112.5 && wd<=157.5)
			wdCode = 3.0;
		else if(wd>67.5 && wd<=157.5)
			wdCode = 2.0;
		else if(wd>22.5 && wd<=67.5)
			wdCode = 1.0;
		return wdCode;
	}
	
	//风速转编码
	public static double getWSCode(double ws) {
		Double wsCode = 0.0;
		if(ws<=3.3)
			wsCode = 0.0;
		else if(ws<=7.9)
			wsCode = 1.0;
		else if(ws<=10.7)
			wsCode = 2.0;
		else if(ws<=13.8)
			wsCode = 3.0;
		else if(ws<=17.1)
			wsCode = 4.0;
		else if(ws<=20.7)
			wsCode = 5.0;
		else if(ws<=24.4)
			wsCode = 6.0;
		else if(ws<=28.4)
			wsCode = 7.0;
		else if(ws<=32.6)
			wsCode = 8.0;
		else if(ws<=36.9)
			wsCode = 9.0;
		return wsCode;
	}
	public static ArrayList<Double> getHosTemp(Date startTime,int days,Double lon,Double lat) {
		ArrayList<Double> lsResult=new ArrayList<Double>();
		try {
			//获取站点
			GeoPoint gp = new GeoPoint(lon, lat);
			Map<String, Object> infoCounty = getAdminInfo("county", gp);
			String stationNum=(String) infoCounty.get("STATIONNUM");
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
				strCurTime=String.format(strCurTime, "M","D");
				strCol+=strCurTime+",";
				cal.add(Calendar.DAY_OF_MONTH,1);
			}
			strCol=strCol.substring(0,strCol.length()-1);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					GridService.datasourceConnectionConfigInfo.getServer(), GridService.datasourceConnectionConfigInfo.getPort(), GridService.datasourceConnectionConfigInfo.getDatabase()), GridService.datasourceConnectionConfigInfo.getUser(), GridService.datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select %s from t_hos_avgtemp where STARTTIME='%s' and STATION_ID_C='%s'",strCol,strStartTime,stationNum);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				for(int d=0;d<days;d++){
					lsResult.add(resultSet.getDouble(d+1));
				}
				break;
			}
			conn.close();
		}
		catch(Exception ex){
			
		}
		return lsResult;
	}
	public static ArrayList<Double> getAllHosTemp(Date startTime,int days)
	{
		ArrayList<Double> lsResult=new ArrayList<Double>();
		try {
			//根据制作时间查询起报时间
			String strStartTime = new SimpleDateFormat("?MM?dd").format(startTime);
			strStartTime=strStartTime.replace("?","%s");
			strStartTime=String.format(strStartTime, "M","D");
			//所用列
			String strCol="STATION_ID_C,Latitude,Longitude,";//这3个固定
			Calendar cal=Calendar.getInstance();
			cal.setTime(startTime);
			for(int d=0;d<days;d++){
				Date thisDate=cal.getTime();
				String strCurTime = new SimpleDateFormat("?MM?dd").format(thisDate);
				strCurTime=strCurTime.replace("?","%s");
				strCurTime=String.format(strCurTime, "M","D");
				strCol+=strCurTime+",";
				cal.add(Calendar.DAY_OF_MONTH,1);
			}
			strCol=strCol.substring(0,strCol.length()-1);
			Class.forName("com.mysql.jdbc.Driver");
			Connection conn = DriverManager.getConnection(String.format("jdbc:mysql://%s:%s/%s", 
					GridService.datasourceConnectionConfigInfo.getServer(), GridService.datasourceConnectionConfigInfo.getPort(), GridService.datasourceConnectionConfigInfo.getDatabase()), GridService.datasourceConnectionConfigInfo.getUser(), GridService.datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select %s from t_hos_avgtemp left join t_station on t_hos_avgtemp.STATION_ID_C=t_station.StationNum where STARTTIME='%s'",strCol,strStartTime);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				for(int d=0;d<days;d++){
					lsResult.add(resultSet.getDouble(d+1));
				}
				break;
			}
			conn.close();
		}
		catch(Exception ex){
			
		}
		return lsResult;
	}
	public static ArrayList<Double> getHosRain(Date startTime,int days,Double lon,Double lat)
	{
		ArrayList<Double> lsResult=new ArrayList<Double>();
		try {
			//获取站点
			GeoPoint gp = new GeoPoint(lon,lat);
			Map<String, Object> infoCounty = getAdminInfo("county", gp);
			String stationNum=(String) infoCounty.get("STATIONNUM");
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
					GridService.datasourceConnectionConfigInfo.getServer(), GridService.datasourceConnectionConfigInfo.getPort(), GridService.datasourceConnectionConfigInfo.getDatabase()), GridService.datasourceConnectionConfigInfo.getUser(), GridService.datasourceConnectionConfigInfo.getPassword());
			Statement  stmt = conn.createStatement();
			String sql = String.format("select %s from t_hos_rain where STARTTIME='%s' and STATION_ID_C='%s'",strCol,strStartTime,stationNum);
			ResultSet resultSet = stmt.executeQuery(sql);
			while(resultSet.next()) {
				for(int d=0;d<days;d++){
					lsResult.add(resultSet.getDouble(d+1));
				}
				break;
			}
			conn.close();//关闭连接
		}
		catch(Exception ex){
			
		}
		return lsResult;
	}
	private static Map<String, Object> getAdminInfo(String adminLevel,GeoPoint gp){
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
					result.put("STATIONNUM", rs.GetFieldValue("STATIONNUM"));
					rs.Destroy();
				}
			}
		}
		return result;
	}
}