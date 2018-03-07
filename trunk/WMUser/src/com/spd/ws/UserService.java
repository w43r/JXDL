package com.spd.ws;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ejb.Stateless;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;

import org.codehaus.jettison.json.JSONObject;
import org.springframework.web.context.ContextLoader;

import com.google.gson.Gson;
import com.spd.pojo.TUser;
import com.spd.service.IUser;

@Stateless
@Path("UserService")
public class UserService {

		@POST
		@Path("login")
		@Produces("application/json")
		public Object login(@FormParam("para") String para,
				@Context HttpServletRequest request,
				@Context HttpServletResponse response
				) {
			JSONObject jsonObject;
			try {
				jsonObject = new JSONObject(para);
				String userName = jsonObject.getString("userName");
				String password = jsonObject.getString("password");
				HashMap paramMap = new HashMap();
				paramMap.put("userName", userName);
				paramMap.put("password", password);
				IUser userService = (IUser)ContextLoader.getCurrentWebApplicationContext().getBean("UserService");
//				Object result = userService.login(paramMap);
				ArrayList result = (ArrayList) userService.login(paramMap);
				if(result == null || result.size() == 0) {
					//登录失败
				} else {
					// 查询该用户拥有访问哪些URL的权限。
					HashMap tempMap = (HashMap) result.get(0);
					List<Map> unAccessList = userService.queryAccessURLs((HashMap) result.get(0));
					List<String> unAccessurlList = new ArrayList<String>();
					for(int i=0; i<unAccessList.size(); i++) {
						Map itemMap = unAccessList.get(i);
						String accessurl = (String) itemMap.get("unaccessurl");
						unAccessurlList.add(accessurl);
					}
					List<String> unaccessmethodList = new ArrayList<String>();
					for(int i=0; i<unAccessList.size(); i++) {
						Map itemMap = unAccessList.get(i);
						String unaccessmethod = (String) itemMap.get("unaccessmethod");
						unaccessmethodList.add(unaccessmethod);
					}
					HttpSession session = request.getSession();
					session.setAttribute("user", tempMap.get("userName"));
					session.setAttribute("unaccessurl", unAccessurlList);
					session.setAttribute("unaccessmethod", unaccessmethodList);
					ServletContext servletContext = session.getServletContext();
					servletContext.setAttribute("session", session);
				}
				System.out.println(result);
				return result;
			} catch (Exception e) {
				e.printStackTrace();
			}
			return null;
		}
		
		@POST
		@Path("isUserNameExisted")
		@Produces("application/json")
		public Object isUserNameExisted(@FormParam("para") String para) {
			JSONObject jsonObject;
			try {
				jsonObject = new JSONObject(para);
				String userName = jsonObject.getString("userName");
				HashMap paramMap = new HashMap();
				paramMap.put("userName", userName);
				IUser userService = (IUser)ContextLoader.getCurrentWebApplicationContext().getBean("UserService");
				Object result = userService.isUserExist(paramMap);
				System.out.println(result);
				return result;
			} catch (Exception e) {
				e.printStackTrace();
			}
			return null;
		}
		
		@POST
		@Path("register")
		@Produces("application/json")
		public Object register(@FormParam("para") String para) {
			try {
				System.out.println("para" + para);
				Gson gson = new Gson();
				TUser user = gson.fromJson(para, TUser.class);
				java.util.ArrayList result = (java.util.ArrayList) isUserNameExisted(para);
				int size = result.size();
				boolean isExist = size == 1 ? true : false;
				if(isExist) {
					return user.getUserName() + "已经存在";
				}
				IUser userService = (IUser)ContextLoader.getCurrentWebApplicationContext().getBean("UserService");
				//添加用户
				userService.register(user);
				//添加权限
				HashMap paramMap = new HashMap();
				paramMap.put("userId", user.getId());
				//数据库中默认是2
				paramMap.put("roleId", 2);
				userService.addUserRole(paramMap);
				return user.getId();
			} catch (Exception e) {
				e.printStackTrace();
			}
			return null;
		}
		
		@POST
		@Path("getAllUser")
		@Produces("application/json")
		public Object getAllUser(){
			ArrayList<TUser> users = new ArrayList<TUser>();
			try {
				HashMap paramMap = new HashMap();
				IUser userService = (IUser)ContextLoader.getCurrentWebApplicationContext().getBean("UserService");
				ArrayList result = (ArrayList) userService.getAllUser(paramMap);
			} catch (Exception e) {
				e.printStackTrace();
			}
			return users;
		}
		
		@POST
		@Path("getForecastor")
		@Produces("application/json")
		public Object getForecastor(@FormParam("para") String para,
				@Context HttpServletRequest request,
				@Context HttpServletResponse response){
			List<Map> result = null;
			try {
				JSONObject jsonObject;
				jsonObject = new JSONObject(para);
				String userName = jsonObject.getString("userName");
				HashMap paramMap = new HashMap();
				paramMap.put("userName", userName);
				
				IUser userService = (IUser)ContextLoader.getCurrentWebApplicationContext().getBean("UserService");
				result = userService.getForecastor(paramMap);
			} catch (Exception e) {
				e.printStackTrace();
			}
			return result;
		}
		
		@POST
		@Path("getIssuer")
		@Produces("application/json")
		public Object getIssuer(@FormParam("para") String para,
				@Context HttpServletRequest request,
				@Context HttpServletResponse response){
			List<Map> result = null;
			try {
				JSONObject jsonObject;
				jsonObject = new JSONObject(para);
				String userName = jsonObject.getString("userName");
				HashMap paramMap = new HashMap();
				paramMap.put("userName", userName);
				
				IUser userService = (IUser)ContextLoader.getCurrentWebApplicationContext().getBean("UserService");
				result = userService.getIssuer(paramMap);
			} catch (Exception e) {
				e.printStackTrace();
			}
			return result;
		}
	}
