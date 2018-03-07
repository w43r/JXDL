package com.spd.mapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


public interface UserMapper {
	
	public List<Map> isUserExisted(HashMap paramMap);

	public List<Map> login(HashMap paramMap);

	public void register(com.spd.pojo.TUser user);
	
	public void addUserRole(HashMap paramMap);
	
	public List<Map> queryAccessURLs(HashMap paramMap);

	public List<Map> queryUnLoginUnAccessURLs(HashMap paramMap);
	
	public List<Map> getAllUser();
	
	public List<Map> getForecastor(HashMap paramMap);
	
	public List<Map> getIssuer(HashMap paramMap);
}
