package com.spd.qhyc.ws;

import java.util.HashMap;
import java.util.Map;

import javax.ejb.Stateless;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import org.codehaus.jettison.json.JSONObject;

import com.mg.objects.DatasetVector;
import com.mg.objects.Datasource;
import com.mg.objects.GeoPoint;
import com.mg.objects.GeoRegion;
import com.mg.objects.Recordset;
import com.spd.qhyc.domain.Application;
import com.spd.weathermap.util.CommonTool;
import com.spd.weathermap.util.LogTool;
import com.spd.weathermap.util.Toolkit;

/*
 * 行政区划服务
 */
@Stateless
@Path("AdminDivisionService")
public class AdminDivisionService {
	
	/*
	 * 描述：获取行政区划
	 * 参数：
	 * 		areaCode：行政区划编码
	 * 返回：
	 * 		几何对象及其属性（id,name,code,stationName,stationCode,stationX,stationY,geometry）
	 * @return 
	 * */
	@POST
	@Path("getDivisionInfo")
	@Produces("application/json")
	public Object getDivisionInfo(@FormParam("para") String para)
	{
		String result = null;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			String areaCode = CommonTool.getJSONStr(jsonObject, "areaCode");
			String classPath = Thread.currentThread().getContextClassLoader().getResource("").getPath();
			classPath=classPath.substring(1);
			String strSHPFileName = "";
			if(areaCode.length() == 2) //省
				strSHPFileName = "T_ADMINDIV_PROVINCE";
			else if(areaCode.length() == 4)  //市
				strSHPFileName = "T_ADMINDIV_CITY";
			else if(areaCode.length() == 6)  //县
				strSHPFileName = "T_ADMINDIV_COUNTY";
			String strAlias = strSHPFileName;
			Datasource ds = Application.m_workspace.GetDatasource(strAlias);
			if(ds == null)
			{
				String strJson = String.format("{\"Type\":\"ESRI Shapefile\",\"Alias\":\"%s\",\"Server\":\"%s\"}", strAlias, classPath + "../data/"+strSHPFileName+".shp");
				ds = Application.m_workspace.OpenDatasource(strJson);
			}
			if(ds != null){
				DatasetVector dtv = (DatasetVector)ds.GetDataset(0);
				String strJson = String.format("{\"Where\":\"[CODE]='%s'\"}", areaCode);
				Recordset rs = dtv.Query(strJson, null);
				if(rs != null){
					rs.MoveFirst();
					result = Toolkit.convertFeatureToJson(dtv, rs.GetID(), "REGION");
					rs.Destroy();
				}
			}
			
		} catch (Exception e) {
			LogTool.logger.error("获取行政区划，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		
		return result;
	}
	
	/*
	 * 获取几何对象
	 * */
	public GeoRegion getGeoRegion(String areaCode)
	{
		GeoRegion result = null;
		try {			
			String classPath = Thread.currentThread().getContextClassLoader().getResource("").getPath();
			classPath=classPath.substring(1);
			String strSHPFileName = "";
			if(areaCode.length() == 2) //省
				strSHPFileName = "T_ADMINDIV_PROVINCE";
			else if(areaCode.length() == 4)  //市
				strSHPFileName = "T_ADMINDIV_CITY";
			else if(areaCode.length() == 6)  //县
				strSHPFileName = "T_ADMINDIV_COUNTY";
			String strAlias = strSHPFileName;
			Datasource ds = Application.m_workspace.GetDatasource(strAlias);
			if(ds == null)
			{
				String strJson = String.format("{\"Type\":\"ESRI Shapefile\",\"Alias\":\"%s\",\"Server\":\"%s\"}", strAlias, classPath + "../data/"+strSHPFileName+".shp");
				ds = Application.m_workspace.OpenDatasource(strJson);
			}
			if(ds != null){
				DatasetVector dtv = (DatasetVector)ds.GetDataset(0);
				String strJson = String.format("{\"Where\":\"[CODE]='%s'\"}", areaCode);
				Recordset rs = dtv.Query(strJson, null);
				if(rs != null){
					rs.MoveFirst();
					result = (GeoRegion)rs.GetGeometry();
					rs.Destroy();
				}
			}
			
		} catch (Exception e) {
			LogTool.logger.error("获取行政区划几何对象，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		
		return result;
	}
	
	/*
	 * 描述：获取定位信息
	 * 参数：
	 * 		x：经度
	 * 		y: 纬度
	 * 返回：
	 * 		地名地址，包括province、city、county
	 * @return 
	 * */
	@POST
	@Path("getLocationInfo")
	@Produces("application/json")
	public Object getLocationInfo(@FormParam("para") String para)
	{
		String result = null;
		try {			
			JSONObject jsonObject = new JSONObject(para);
			double x = CommonTool.getJSONDouble(jsonObject, "x");
			double y = CommonTool.getJSONDouble(jsonObject, "y");
			GeoPoint gp = new GeoPoint(x, y);
			Map<String, Object> infoProvince = getAdminInfo("province", gp);
			Map<String, Object> infoCity = getAdminInfo("city", gp);
			Map<String, Object> infoCounty = getAdminInfo("county", gp);
			result = String.format("{\"province_name\":\"%s\",\"province_code\":\"%s\",\"city_name\":\"%s\",\"city_code\":\"%s\",\"county_name\":\"%s\",\"county_code\":\"%s\"}", 
					infoProvince==null?"":infoProvince.get("NAME"),infoProvince==null?"":infoProvince.get("CODE"),
					infoCity==null?"":infoCity.get("NAME"),infoCity==null?"":infoCity.get("CODE"),
					infoCounty==null?"":infoCounty.get("NAME"),infoCounty==null?"":infoCounty.get("CODE"));
			
		} catch (Exception e) {
			LogTool.logger.error("获取定位信息，详情【" + e.getMessage() + "】");
			e.printStackTrace();
		}		
		return result;
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
}
