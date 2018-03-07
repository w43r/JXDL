package com.spd.filter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.context.ContextLoader;

import com.google.gson.Gson;
import com.spd.service.IUser;

public class PathFilter implements Filter {

//	private static ServletContext servletContext;
	
	public void destroy() {
		// TODO Auto-generated method stub
	}

	public void doFilter(ServletRequest request, ServletResponse response,
			FilterChain chain) throws IOException, ServletException {
		HttpServletRequest req      = (HttpServletRequest)request;  
        HttpServletResponse resp    = (HttpServletResponse)response; 
        resp.setHeader("Content-type", "text/html;charset=UTF-8");  
        String uri = req.getRequestURI();
//        String para = req.getParameter("param");
//        System.out.println("param:" + para);
//        System.out.println("before .." + uri);
//        uri = uri.substring(0, uri.lastIndexOf("/") + 1);
//        System.out.println("after .. " + uri);
        //1 . /weathermap 未登录 先查询出未登陆用户的权限。
        //2. /weathermap 判断用户是VIP、未登陆、普通注册用户。然后去查询所能访问的URL。加以判断等。
        if(uri.startsWith("/WeatherDataService")) {
        	String param = req.getParameter("param");
        	if(param == null) {
        		chain.doFilter(req, resp);
        		return;
        	}
        	Gson gson = new Gson();
        	Map paramMap = gson.fromJson(param, Map.class);
        	String function = (String) paramMap.get("name");
        	System.out.println("function:" + function);
        	HttpSession session = req.getSession();
			ServletContext servletContext = session.getServletContext();
			ServletContext servletContext1 = servletContext.getContext("/SPDUser");
			// 未登陆用户的访问URL限制
			List<String> unLoginUnAccessurlList = (List<String>) servletContext1.getAttribute("unLoginUnaccessurl");
			List<String> unLoginUnAccessMethodList = (List<String>) servletContext1.getAttribute("unaccessmethod");
			HttpSession session1 = (HttpSession) servletContext1.getAttribute("session");
			System.out.println("session1 : " + session1);
			if(session1 == null) {
				// 1 .未登陆用户，查询出未登陆用户的权限。
				for(String unLoginUnAccessurl : unLoginUnAccessurlList) {
					if(uri.startsWith(unLoginUnAccessurl)) {
						for(String method : unLoginUnAccessMethodList) {
							if(method.equals(function) || "*".equals(method)) {
								System.out.println("用户未登陆， 访问受限");
								return;
							} 
						}
					}
				}
				chain.doFilter(req,resp);
			} else {
				// 已经登陆的用户，判断用户的权限，以及能访问的URL
				List<String>  accessurlList = (List<String> ) session1.getAttribute("unaccessurl");
				String user = (String) session1.getAttribute("user");
//        		System.out.println("accessurlList:" + accessurlList);
        		boolean flag = false;
        		for(String accessurl : accessurlList) {
        			if(uri.startsWith(accessurl)) {
        				for(String method : unLoginUnAccessMethodList) {
							if(method.equals(function) || "*".equals(method)) {
								flag = true;
		        				System.out.println("uri:" + uri);
		        				break;
							}
						}
        				if(flag) {
        					break;
        				}
        				// 该页面有访问权限
        			}
        		}
        		System.out.println("flag:" + flag);
        		if(flag) {
        			System.out.println("当前登录账号：" + user + " 没有访问" + uri + " 的权限");
        			resp.getWriter().write("当前登录账号：" + user + " 没有访问" + uri + " 的权限");
        			return;
        		} else {
        			chain.doFilter(req,resp);
        		}
			}
//        if(uri.startsWith("/weathermap")) {
//        	HttpSession session = req.getSession();
//			ServletContext servletContext = session.getServletContext();
//			ServletContext servletContext1 = servletContext.getContext("/SPDUser");
//			// 未登陆用户的访问URL限制
//			List<String> unLoginUnAccessurlList = (List<String>) servletContext1.getAttribute("unLoginUnaccessurl");
//			HttpSession session1 = (HttpSession) servletContext1.getAttribute("session");
//			System.out.println("session1 : " + session1);
//			if(session1 == null) {
//				// 1 .未登陆用户，查询出未登陆用户的权限。
//				for(String unLoginUnAccessurl : unLoginUnAccessurlList) {
//					if(uri.startsWith(unLoginUnAccessurl)) {
//						System.out.println("用户未登陆， 访问受限");
//						return;
//					}
//				}
//				chain.doFilter(req,resp);
//			} else {
//				// 已经登陆的用户，判断用户的权限，以及能访问的URL
//				List<String>  accessurlList = (List<String> ) session1.getAttribute("unaccessurl");
//				String user = (String) session1.getAttribute("user");
//        		System.out.println("accessurlList:" + accessurlList);
//        		boolean flag = false;
//        		for(String accessurl : accessurlList) {
//        			if(uri.startsWith(accessurl)) {
//        				// 该页面有访问权限
//        				flag = true;
//        				System.out.println("uri:" + uri);
//        				break;
//        			}
//        		}
//        		if(flag) {
//        			resp.getWriter().write("当前登录账号：" + user + " 没有访问" + uri + " 的权限");
//        			return;
//        		} else {
//        			chain.doFilter(req,resp);
//        		}
//			}
        } else {
        	chain.doFilter(req,resp);
        }
	}

	public void init(FilterConfig arg0) throws ServletException {
//		ServletContext currentServletContext = arg0.getServletContext();
//		servletContext = currentServletContext.getContext("/SPDUser");
//		Object user = servletContext.getAttribute("unaccessurl");
//		System.out.println("....Filter User:" + user);
	}

}
