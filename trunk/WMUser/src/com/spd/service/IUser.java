package com.spd.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.spd.pojo.TUser;


public interface IUser {

	public List<Map> isUserExist(HashMap paramMap);

	public List<Map> login(HashMap paramMap);

	public void register(TUser user);

	/**
	 * 注册用户默认给注册的权限
	 * @param paramMap
	 */
	public void addUserRole(HashMap paramMap);
	
	/**
	 * 根据用户，查询该用户有访问哪些地�?��权限�?
	 * @param paramMap
	 * @return
	 */
	public List<Map> queryAccessURLs(HashMap paramMap);
	
	/**
	 * 查询未登陆用户的权限
	 * @param paramMap
	 * @return
	 */
	public List<Map> queryUnLoginUnAccessURLs(HashMap paramMap);
	
	public List<Map> getAllUser(HashMap paramMap);
	
	public List<Map> getForecastor(HashMap paramMap);
	
	public List<Map> getIssuer(HashMap paramMap);
}
