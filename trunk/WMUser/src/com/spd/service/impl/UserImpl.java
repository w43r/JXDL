package com.spd.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.springframework.stereotype.Component;


import com.spd.mapper.UserMapper;
import com.spd.pojo.TUser;
import com.spd.service.IUser;

@Component("UserService")
public class UserImpl implements IUser {

	@Resource
	private UserMapper userMapper;
	
	public List<Map> isUserExist(HashMap paramMap) {
		return userMapper.isUserExisted(paramMap);
	}

	public List<Map> login(HashMap paramMap) {
		return userMapper.login(paramMap);
	}

	public void register(TUser user) {
		userMapper.register(user);
	}

	public List<Map> queryAccessURLs(HashMap paramMap) {
		return userMapper.queryAccessURLs(paramMap);
	}

	public List<Map> queryUnLoginUnAccessURLs(HashMap paramMap) {
		return userMapper.queryUnLoginUnAccessURLs(paramMap);
	}

	public void addUserRole(HashMap paramMap) {
		userMapper.addUserRole(paramMap);
	}	

	@Override
	public List<Map> getAllUser(HashMap paramMap) {
		return userMapper.getAllUser();
	}
	
	public List<Map> getForecastor(HashMap paramMap) {
		return userMapper.getForecastor(paramMap);
	}
	
	public List<Map> getIssuer(HashMap paramMap) {
		return userMapper.getIssuer(paramMap);
	}

}
