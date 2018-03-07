package com.spd.qhyc.domain;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import com.spd.weathermap.util.CommonTool;

/**
 * spring实例工厂类
 * @author xianchao
 *
 */
public class ApplicationContextFactory {

	private static ApplicationContext applicationContext;
	
	private ApplicationContextFactory(){
		
	}
	
	public static ApplicationContext getInstance() {
		if(applicationContext == null) {
			
			String path = CommonTool.getApplicationContextPath();
			System.out.println("applicationpath:" + path);
			applicationContext = new ClassPathXmlApplicationContext("file:" + path);
		} 
		return applicationContext;
	}
}
