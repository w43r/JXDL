package com.spd.qhyc.jdbc;

import com.alibaba.druid.pool.DruidDataSource;
import com.spd.qhyc.domain.ApplicationContextFactory;
import com.spd.qhyc.domain.DatasourceConnectionConfigInfo;

public class DataSourceSingleton {
	
	
	    private DataSourceSingleton() {}  
	 
	    private static DruidDataSource dataSource=null;
	    private static DruidDataSource baseDataSource=null;
	    
	    
	    
	    public static DruidDataSource getInstance() {  
	         if (dataSource == null) {    
	        	 DatasourceConnectionConfigInfo datasourceConnectionConfigInfo = (DatasourceConnectionConfigInfo)ApplicationContextFactory.getInstance().getBean("datasourceConnectionConfigInfo");
	        	 dataSource = new DruidDataSource();
	        	 dataSource.setDriverClassName("com.mysql.jdbc.Driver"); 
	        	 dataSource.setUsername(datasourceConnectionConfigInfo.getUser());
	        	 dataSource.setPassword(datasourceConnectionConfigInfo.getPassword());
	        	 dataSource.setUrl(String.format("jdbc:mysql://%s:%s/%s", datasourceConnectionConfigInfo.getServer(), datasourceConnectionConfigInfo.getPort(), datasourceConnectionConfigInfo.getDatabase()));
	        	 dataSource.setInitialSize(5);
	        	 dataSource.setMinIdle(1);
	        	 dataSource.setMaxActive(10); // 启用监控统计功能  dataSource.setFilters("stat");// for mysql  dataSource.setPoolPreparedStatements(false);
	         }    
	        return dataSource;  
	    }  
	    public static DruidDataSource getBaseInstance() {  
	         if (baseDataSource == null) {    
	        	 DruidDataSource dds = (DruidDataSource)ApplicationContextFactory.getInstance().getBean("dataSource");
	        	 baseDataSource = new DruidDataSource();
	        	 baseDataSource.setDriverClassName("com.mysql.jdbc.Driver"); 
	        	 baseDataSource.setUsername(dds.getUsername());
	        	 baseDataSource.setPassword(dds.getPassword());
	        	 baseDataSource.setUrl(String.format("%s", dds.getUrl()));
	        	 baseDataSource.setInitialSize(5);
	        	 baseDataSource.setMinIdle(1);
	        	 baseDataSource.setMaxActive(10); // 启用监控统计功能  dataSource.setFilters("stat");// for mysql  dataSource.setPoolPreparedStatements(false);
	         }    
	        return baseDataSource;  
	    }
}
