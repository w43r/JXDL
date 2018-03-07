package com.spd.weathermap.util;

import java.awt.geom.Point2D;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;

import com.mg.objects.DatasetRaster;
import com.mg.objects.DatasetVector;
import com.mg.objects.GeoLine;
import com.mg.objects.GeoPoint;
import com.mg.objects.GeoRegion;
import com.mg.objects.Geometry;
import com.mg.objects.Recordset;
import com.mg.objects.Scanline;
import com.spd.weathermap.domain.GridData;
import com.spd.weathermap.domain.GridDataZip;

/*
 * 工具类
 * by zouwei, 2015-09-02
 * */
public class Toolkit {
	
	/*
	 * 栅格数据集转格点数据对象
	 * 
	 * */
	public static GridData convertDatasetRasterToGridData(DatasetRaster dr)
	{
		//dr.CalcExtreme(); //极值未保存，放在内存，打开要算，数据修改后也要算。会引发崩溃，注释后结果是正确的。
		GridData gridData = null;
		try
		{
			if(dr != null)
			{				
				gridData = new GridData();
				ArrayList<Double> dValues = new ArrayList<Double>();
				Scanline sl = new Scanline(dr.GetValueType(), dr.GetWidth());
				int height = dr.GetHeight();
				int width = dr.GetWidth();
				Double noDataValue = dr.GetNoDataValue();
				for(int i = height - 1; i >= 0; i--)
				{	
					dr.GetScanline(0, i, sl);
					for(int j = 0; j < width; j++)
					{
						Double dvalue = sl.GetValue(j);
						if(dvalue != noDataValue)
							dvalue = Math.round(dvalue*10.0)/10.0;
						dValues.add(dvalue);
					}
				}
				sl.Destroy();
				gridData.setLeft(dr.GetBounds().getX());
				gridData.setBottom(dr.GetBounds().getY());
				gridData.setRight(dr.GetBounds().getX() + dr.GetBounds().getWidth());
				gridData.setTop(dr.GetBounds().getY() + dr.GetBounds().getHeight());
				gridData.setRows(dr.GetHeight());
				gridData.setCols(dr.GetWidth());
				gridData.setDValues(dValues);
				gridData.setNoDataValue(dr.GetNoDataValue());
			}
		} catch (Exception e) {
			LogTool.logger.error("栅格数据集转格点数据对象错误【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return gridData;
	}
	
	/*
	 * 栅格数据集转（压缩的）格点数据对象
	 * 
	 * */
	@SuppressWarnings("unchecked")
	public static GridDataZip convertDatasetRasterToGridDataZip(DatasetRaster dr)
	{
		GridDataZip gridData = null;
		try
		{
			if(dr != null)
			{				
				gridData = new GridDataZip();
				int dValues[][] = new int[dr.GetHeight()][dr.GetWidth()];
				ArrayList<Integer> arrayValue = new ArrayList<Integer>(); 
				Scanline sl = new Scanline("Single", dr.GetWidth());
				int height = dr.GetHeight();
				int width = dr.GetWidth();
				//int nNoDataValue = (int)dr.GetNoDataValue()*10;
				int nNoDataValue = (int)dr.GetNoDataValue();
				for(int i = height - 1; i >= 0; i--)
				{	
					dr.GetScanline(0, i, sl);
					for(int j = 0; j < width; j++)
					{
						//int nValue = (int) Math.round(sl.GetValue(j)*10);
						int nValue = (int) Math.round(sl.GetValue(j));
						dValues[i][j] = nValue;
						if(nValue != nNoDataValue && !arrayValue.contains(nValue)){
							arrayValue.add(nValue);
						}
					}
				}
				
				Map mapValueRowIndex = new HashMap();
				Map mapValueColIndex = new HashMap();
				Map mapValueRepeat = new HashMap();
				Map mapRepeatTotal = new HashMap();
				
				int valueCount = arrayValue.size();	
				Map mapValueIndex = new HashMap();
				for(int k=0;k<valueCount; k++){
					int nValue = arrayValue.get(k);
					mapValueIndex.put(nValue, 0);
					mapValueRowIndex.put(nValue, new ArrayList<Integer>());
					mapValueColIndex.put(nValue, new ArrayList<Integer>());
					mapValueRepeat.put(nValue, new ArrayList<Integer>());
					mapRepeatTotal.put(nValue, 0);
				}
							
				for(int i = height - 1; i >= 0; i--){
					int nValuePre = dValues[i][0];
					int nRepeat = 0;
					int nStartColumnIndex = 0;
					for(int j = 0; j < width; j++){
						int nValue = dValues[i][j];
						if(nValue != nNoDataValue && nValuePre == nValue)
						{
							nRepeat++;
						}
						else if(nRepeat != 0) {
							ArrayList<Integer> arrayRowIndexTemp = (ArrayList<Integer>)mapValueRowIndex.get(nValuePre);
							ArrayList<Integer> arrayColIndexTemp = (ArrayList<Integer>)mapValueColIndex.get(nValuePre);
							ArrayList<Integer> arrayRepeatTemp = (ArrayList<Integer>)mapValueRepeat.get(nValuePre);
							//if(!arrayRowIndexTemp.contains(i))
							//	arrayRowIndexTemp.add(i);
							arrayRowIndexTemp.add(i);
							arrayColIndexTemp.add(nStartColumnIndex);
							arrayRepeatTemp.add(nRepeat);
							mapRepeatTotal.put(nValuePre, Integer.valueOf(mapRepeatTotal.get(nValuePre).toString()) + nRepeat);							
							
							if(nValue == nNoDataValue){
								nRepeat = 0;
								nStartColumnIndex = j;
							}
							else{
								nRepeat = 1;
								nStartColumnIndex = j;
							}
							nValuePre = nValue;
						}
						else if(nValue != nNoDataValue){
							nValuePre = nValue;
							nRepeat = 1;
							nStartColumnIndex = j;
						}
					}
				}
				
				ArrayList<Integer> arrayRowIndex = new ArrayList<Integer>();
				ArrayList<Integer> arrayColIndex = new ArrayList<Integer>();
				ArrayList<Integer> arrayRepeatTotal = new ArrayList<Integer>();
				ArrayList<Integer> arrayRepeat = new ArrayList<Integer>();
				int nRepeatRepeat = 0;
				int nRepeatPre = -1;
				for(int k=0;k<valueCount; k++){
					int nValue = arrayValue.get(k);
					ArrayList<Integer> arrayRowIndexTemp = (ArrayList<Integer>)mapValueRowIndex.get(nValue);
					ArrayList<Integer> arrayColIndexTemp = (ArrayList<Integer>)mapValueColIndex.get(nValue);
					ArrayList<Integer> arrayRepeatTemp = (ArrayList<Integer>)mapValueRepeat.get(nValue);
					int nRepeatTotal = Integer.valueOf(mapRepeatTotal.get(nValue).toString());
					arrayRepeatTotal.add(nRepeatTotal);
					
					//arrayRowIndexTemp、arrayColIndexTemp、arrayRepeatTemp是一一对应关系
					Boolean bNewValue = true;
					int nRepeatRowIndex = 0;
					int nRowIndexPre = -1;
					int nRowIndexPrePre = -1;
					for(int i=0; i<arrayRowIndexTemp.size(); i++){
						//游程编码，处理重复次数
						if(arrayRepeatTemp.get(i) == nRepeatPre)
							nRepeatRepeat++;
						else
						{
							if(nRepeatPre > 0){
								arrayRepeat.add(nRepeatPre);
								arrayRepeat.add(nRepeatRepeat);
							}
							
							nRepeatRepeat = 1;
							nRepeatPre =  arrayRepeatTemp.get(i);
						}
						
						int nRowIndex = arrayRowIndexTemp.get(i);
						if(nRowIndex == nRowIndexPre){
							nRepeatRowIndex++;
							arrayColIndex.add(arrayColIndexTemp.get(i) - arrayColIndexTemp.get(i-1)); //从小到大
						}
						else{ //下一行
							arrayColIndex.add(arrayColIndexTemp.get(i));
							
							if(i>0){
								if(bNewValue){ //下一个格点值
									arrayRowIndex.add(nRowIndexPre);
									bNewValue = false;
								}
								else{
									arrayRowIndex.add(nRowIndexPrePre - nRowIndexPre); ////从大到小
								}
								arrayRowIndex.add(nRepeatRowIndex);
							}
							
							nRepeatRowIndex = 1;
							nRowIndexPrePre = nRowIndexPre;
							nRowIndexPre = nRowIndex;
						}
						
						//最后一个
						if(i == arrayRowIndexTemp.size()-1){
							arrayRepeat.add(nRepeatPre);
							arrayRepeat.add(nRepeatRepeat);
							
							if(bNewValue)
								arrayRowIndex.add(nRowIndexPre);
							else
								arrayRowIndex.add(nRowIndexPrePre - nRowIndexPre); ////从大到小							
						}
					}
				}
				
				gridData.setLeft(dr.GetBounds().getX());
				gridData.setBottom(dr.GetBounds().getY());
				gridData.setRight(dr.GetBounds().getX() + dr.GetBounds().getWidth());
				gridData.setTop(dr.GetBounds().getY() + dr.GetBounds().getHeight());
				gridData.setRows(dr.GetHeight());
				gridData.setCols(dr.GetWidth());
				gridData.setValues(arrayValue);
				gridData.setToltalRepeats(arrayRepeatTotal);
				gridData.setRowIndexs(arrayRowIndex);
				gridData.setColIndexs(arrayColIndex);
				gridData.setRepeats(arrayRepeat);
				gridData.setNoDataValue(dr.GetNoDataValue());
			}
		} catch (Exception e) {
			LogTool.logger.error("栅格数据集转格点数据对象错误【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return gridData;
	}
	
	/*
	 * 矢量数据集转Json字符串
	 * 
	 * */
	public static String convertDatasetVectorToJson(DatasetVector dtv, String type)
	{
		StringBuffer result =  new StringBuffer();
		try
		{
			if(dtv != null)
			{
				Recordset rs = dtv.Query("", null);
				rs.MoveFirst();
				if(rs.GetRecordCount() == 0)
					return result.toString();
				
				String strFieldNames = "\"fieldNames\":[";
				String fis = dtv.GetFields();
				JSONArray jsonArray = new JSONArray(fis);
				for(int i=0; i<jsonArray.length(); i++)
				{
					String strForeignName = CommonTool.getJSONStr(jsonArray.getJSONObject(i), "ForeignName");
					strFieldNames+="\"" + strForeignName + "\",";
				}
				strFieldNames = strFieldNames.substring(0, strFieldNames.length() - 1);
				strFieldNames+="]";
				
				result.append("{\"featureUriList\":[],\"features\":[");
				
				while(!rs.IsEOF())
				{
					if(!type.equals("REGION")) //后面单独处理
					{
						result.append("{");
						result.append(strFieldNames);
						result.append(",\"ID\":" + String.valueOf(rs.GetID())+",");
						String strFieldValues = "\"fieldValues\":[";
						for(int i=0; i<jsonArray.length(); i++)
						{
							String strFieldName = CommonTool.getJSONStr(jsonArray.getJSONObject(i), "Name");
							Object v = rs.GetFieldValue(strFieldName);
							strFieldValues+="\"" + String.valueOf(v) +"\",";
						}
						strFieldValues = strFieldValues.substring(0, strFieldValues.length() - 1);
						strFieldValues+="],";
						result.append(strFieldValues);	
					}					
					
					if(type.equals("POINT"))
					{
						GeoPoint gp  = (GeoPoint)rs.GetGeometry();
						Double x = gp.GetBounds().getCenterX();
						Double y = gp.GetBounds().getCenterY();
						result.append(String.format("\"geometry\":{\"center\":{\"y\":%f,\"x\":%f},\"id\":%d,\"style\":null,",y, x, rs.GetID()));					
						result.append("\"parts\":[1],");					
						result.append("\"points\":[");
						result.append("{\"y\":"+y+",\"x\":" + x + "}");
						result.append("],\"type\":\"POINT\"}}");
						result.append(",");
					}					
					else if(type.equals("LINE"))
					{
						GeoLine geoLine = (GeoLine)rs.GetGeometry();
						result.append(String.format("\"geometry\":{\"center\":{\"y\":%f,\"x\":%f},\"id\":%d,\"style\":null,", geoLine.GetBounds().getCenterY(), geoLine.GetBounds().getCenterX(), rs.GetID()));
						result.append("\"parts\":[");
						String strParts = "";
						for(int i=0; i<geoLine.GetSubCount(); i++)
							strParts += String.valueOf(geoLine.GetPointCount(i)) + ",";
						strParts = strParts.substring(0, strParts.length() - 1);
						result.append(strParts);
						result.append("],");
						
						result.append("\"points\":[");
						int subCount = geoLine.GetSubCount();
						for(int i=0; i < subCount; i++)
						{
							int nPointCount = geoLine.GetPointCount(i);
							for (int j = 0; j < nPointCount; j++)
							{
								Point2D pt = geoLine.GetPoint(j, i);
								result.append("{\"y\":"+Math.floor(pt.getY()*10000)/10000+",\"x\":" + Math.floor(pt.getX()*10000)/10000 + "}");
								result.append(",");
							}							
						}
						result.delete(result.length()-1, result.length());
						geoLine.Destroy();
						result.delete(result.length()-1, result.length());
						result.append("}],\"type\":\"LINE\"}}");
						result.append(",");
					}
					else if(type.equals("REGION"))
					{						
						int nIndex = 0;
						GeoRegion geoRegion = (GeoRegion)rs.GetGeometry();
						for(int i=0; i<geoRegion.GetSubCount(); i++)
						{
							int nShell = geoRegion.GetShell(i); //获洞的父对象索引，-1为实面无父多边形，>=0为父对象ID
							if(nShell == -1)
							{
								result.append("{");
								result.append(strFieldNames);
								result.append(",\"ID\":" + String.valueOf(rs.GetID())+",");
								String strFieldValues = "\"fieldValues\":[";
								for(int j=0; j<jsonArray.length(); j++)
								{
									String strFieldName = CommonTool.getJSONStr(jsonArray.getJSONObject(j), "Name");
									Object v = rs.GetFieldValue(strFieldName);
									strFieldValues+="\"" + String.valueOf(v) +"\",";
								}
								strFieldValues = strFieldValues.substring(0, strFieldValues.length() - 1);
								strFieldValues+="],";
								result.append(strFieldValues);	
								
								result.append(String.format("\"geometry\":{\"center\":{\"y\":%f,\"x\":%f},\"id\":%d,\"style\":null,", geoRegion.GetBounds().getCenterY(), geoRegion.GetBounds().getCenterX(), nIndex++/*rs.GetID()*/));
								result.append("\"parts\":[");
								String strParts = "";
								int subCount = geoRegion.GetSubCount();
								for(int j=i; j<subCount; j++)
								{
									nShell = geoRegion.GetShell(j);
									if(j>i && nShell == -1)
										break;
									strParts += String.valueOf(geoRegion.GetPointCount(j)) + ",";
								}				
								strParts = strParts.substring(0, strParts.length() - 1);
								result.append(strParts);
								result.append("],");
								
								result.append("\"points\":[");
								int j = i;
								for(j=i; j<geoRegion.GetSubCount(); j++)
								{
									nShell = geoRegion.GetShell(j);
									if(j>i && nShell == -1)
										break;
									int nPointCount = geoRegion.GetPointCount(j);
									for (int k = 0; k < nPointCount; k++)
									{
										Point2D pt = geoRegion.GetPoint(k, j);
										result.append("{\"y\":"+Math.floor(pt.getY()*10000)/10000+",\"x\":" + Math.floor(pt.getX()*10000)/10000 + "}");
										result.append(",");
									}							
								}								
								result.delete(result.length()-1, result.length());								
								result.delete(result.length()-1, result.length());
								result.append("}],\"type\":\"REGION\"}}");
								result.append(",");
								i = j - 1;
							}
						}
						geoRegion.Destroy();
					}
					
					rs.MoveNext();
				}
				result.delete(result.length()-1, result.length());
				
				result.append(String.format("],\"featureCount\":%d}", rs.GetRecordCount()));
				
				rs.Destroy();
			}
		} catch (Exception e) {
			LogTool.logger.error("矢量数据集转Json字符串错误【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result.toString();
	}
	
	/*
	 * 要素转Json字符串
	 * 	dtv：矢量数据集
	 * 	featureId：对象ID
	 * 	type:数据类型，目前无法从dataset获知数据集类型
	 * */
	public static String convertFeatureToJson(DatasetVector dtv, int featureId, String type)
	{
		StringBuffer result =  new StringBuffer();
		if(dtv == null)
			return result.toString();
		try
		{
			Recordset rs = dtv.Query("", null);
			if(!rs.Seek(featureId))
				return result.toString();
			Geometry geo = (GeoRegion)rs.GetGeometry();
			if(geo != null)
			{
				String strFieldNames = "\"fieldNames\":[";
				String fis = dtv.GetFields();
				JSONArray jsonArray = new JSONArray(fis);
				for(int i=0; i<jsonArray.length(); i++)
				{
					String strForeignName = CommonTool.getJSONStr(jsonArray.getJSONObject(i), "Name"); //ForeignName
					strFieldNames+="\"" + strForeignName + "\",";
				}
				strFieldNames = strFieldNames.substring(0, strFieldNames.length() - 1);
				strFieldNames+="]";
				result.append("{");
				result.append(strFieldNames);
				result.append(",\"ID\":" + String.valueOf(rs.GetID())+",");
				String strFieldValues = "\"fieldValues\":[";
				for(int i=0; i<jsonArray.length(); i++)
				{
					String strFieldName = CommonTool.getJSONStr(jsonArray.getJSONObject(i), "Name");
					Object v = rs.GetFieldValue(strFieldName);
					strFieldValues+="\"" + String.valueOf(v) +"\",";
				}
				strFieldValues = strFieldValues.substring(0, strFieldValues.length() - 1);
				strFieldValues+="],";
				result.append(strFieldValues);
				
				if(type.equals("REGION"))
				{
					GeoRegion geoRegion = (GeoRegion)geo;
					result.append(String.format("\"geometry\":{\"center\":{\"y\":%f,\"x\":%f},\"id\":%d,\"style\":null,", geoRegion.GetBounds().getCenterY(), geoRegion.GetBounds().getCenterX(), rs.GetID()));
					result.append("\"parts\":[");
					String strParts = "";
					for(int i=0; i<geoRegion.GetSubCount(); i++)
						strParts += String.valueOf(geoRegion.GetPointCount(i)) + ",";
					strParts = strParts.substring(0, strParts.length() - 1);
					result.append(strParts);
					result.append("],");
					
					result.append("\"points\":[");
					for(int i=0; i<geoRegion.GetSubCount(); i++)
					{
						int nPointCount = geoRegion.GetPointCount(i);
						for (int j = 0; j < nPointCount; j++)
						{
							Point2D pt = geoRegion.GetPoint(j, i);
							result.append("{\"y\":"+Math.floor(pt.getY()*10000)/10000+",\"x\":" + Math.floor(pt.getX()*10000)/10000 + "}");
							result.append(",");
						}						
					}
					result.delete(result.length()-1, result.length());
					geoRegion.Destroy();
					result.delete(result.length()-1, result.length());
					result.append("}],\"type\":\"REGION\"}}");
				}
			}	
			rs.Destroy();
		}
		catch(Exception e)
		{
			LogTool.logger.error("要素转Json字符串错误【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return result.toString();
	}
	public static GridData convertDatasetRasterToGridDataSrcVal(DatasetRaster dr,String strDateTime){
		GridData gridData = null;
		try{
			if(dr != null){				
				gridData = new GridData();
				ArrayList<Double> dValues = new ArrayList<Double>();
				Scanline sl = new Scanline(dr.GetValueType(), dr.GetWidth());
				int height = dr.GetHeight();
				int width = dr.GetWidth();
				for(int i = height - 1; i >= 0; i--){	
					dr.GetScanline(0, i, sl);
					for(int j = 0; j < width; j++){
						Double dvalue = sl.GetValue(j);
						dValues.add(dvalue);
					}
				}
				sl.Destroy();
				gridData.setLeft(dr.GetBounds().getX());
				gridData.setBottom(dr.GetBounds().getY());
				gridData.setRight(dr.GetBounds().getX() + dr.GetBounds().getWidth());
				gridData.setTop(dr.GetBounds().getY() + dr.GetBounds().getHeight());
				gridData.setRows(dr.GetHeight());
				gridData.setCols(dr.GetWidth());
				gridData.setDValues(dValues);
				gridData.setNoDataValue(dr.GetNoDataValue());
				gridData.setNWPModelTime(strDateTime);
			}
		} catch (Exception e) {
			LogTool.logger.error("栅格数据集转格点数据对象错误【" + e.getMessage() + "】");
			e.printStackTrace();
		}
		return gridData;
	}
}
