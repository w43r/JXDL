package com.spd.weathermap.util;

import java.net.URL;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

public class CommonTool {

	/**
	 * JSON字符串的处理，如果没有对应的key，则返回null
	 * @param jsonObject
	 * @param key
	 * @return
	 */
	public static String getJSONStr(JSONObject jsonObject, String key) {
		try {
			String value = jsonObject.getString(key);
			return value;
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * JSON整形的处理，如果没有对应的key，则返回null
	 * @param jsonObject
	 * @param key
	 * @return
	 */
	public static Integer getJSONInt(JSONObject jsonObject, String key) {
		try {
			int value = jsonObject.getInt(key);
			return value;
		} catch (JSONException e) {
			return null;
		}
	}
	
	/**
	 * JSON Double的处理，如果没有对应的key，则返回null
	 * @param jsonObject
	 * @param key
	 * @return
	 */
	public static Double getJSONDouble(JSONObject jsonObject, String key) {
		try {
			double value = jsonObject.getDouble(key);
			return value;
		} catch (JSONException e) {
			return null;
		}
	}	
	
	private static String getConfigPath(String fileName) {
		URL url  = Thread.currentThread().getContextClassLoader().getResource(fileName);
		String path = java.net.URLDecoder.decode(url.getPath());
		System.out.println("#######" + path + "########");
//		}
		return path;
	}
	
	/**
	 * 获取spring对应的配置文件applicationContext.xml文件路径
	 * @return
	 */
	public static String getApplicationContextPath(){
		return getConfigPath("applicationContext.xml");
	}
}
