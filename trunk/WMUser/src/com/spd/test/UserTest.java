package com.spd.test;

import java.util.ArrayList;

import javax.ws.rs.core.MultivaluedMap;

import junit.framework.Assert;

import org.junit.Test;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.core.util.MultivaluedMapImpl;

public class UserTest {

	private String basicUrl = "http://localhost:8080/WMUser/services";
	
//	private String basicUrl = "http://123.57.233.58:8080/SPDUser/services";
	
	private final  Client client = Client.create();
	
//	@Test
//	public void testLogin() throws Exception{
//		String url = basicUrl + "/UserService/";
//		testPost(url, "login", "para", "{\"userName\":\"zoujie\", \"password\":\"123456\"}");
//	}
	
//	@Test
//	public void testIsUserNameExisted() throws Exception{
//		String url = basicUrl + "/UserService/";
//		testPost(url, "isUserNameExisted", "para", "{\"userName\":\"zoujie3\"}");
//	}
//	
	@Test
	public void testRegister() throws Exception{
		String url = basicUrl + "/UserService/";
		testPost(url, "register", "para", "{\"userName\":\"spd\", \"showName\":\"spd\", \"password\":\"123456\"}");
	}
	
	private void testPost(String url, String method, String paramName ,String param )throws Exception{
	    WebResource webResource = client.resource(url + method); 
		MultivaluedMap formData = null;
		if (null !=param) {
		    formData = new MultivaluedMapImpl();
		    formData.add(paramName, param);
		} 
	    ClientResponse response = webResource.type("application/x-www-form-urlencoded").post(ClientResponse.class, formData);
	    int status = response.getStatus();
//	    Assert.assertEquals(200, status);
	    if (status == 200) {
//	    	System.out.println(response.getEntity(ArrayList.class));
	    	Object result = response.getEntity(ArrayList.class);
	    	System.out.println(result);
	    	status = 0;
	    }else if (status ==204) {
	    	System.out.println("操作成功");
	    	status = 0;
	    }		
	  
	}
}
