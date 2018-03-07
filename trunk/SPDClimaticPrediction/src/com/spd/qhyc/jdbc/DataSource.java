package com.spd.qhyc.jdbc;

import java.sql.Connection;
import java.sql.SQLException;

import com.spd.qhyc.tool.LogTool;



public class DataSource {
	  private static DataSource dataSource = null;
	  private static DataSource baseDataSource = null;
	 // private static Connection conn = null;
	    
	    private DataSource(){
	        
	    }
	    
	    public static synchronized DataSource getInstance() {
	        if(dataSource == null){
	        	dataSource = new DataSource();
	        }
	        return dataSource;
	    }
	    public static synchronized DataSource getBaseInstance() {
	        if(baseDataSource == null){
	        	baseDataSource = new DataSource();
	        }
	        return baseDataSource;
	    }
	    
	    public Connection getConnection(){
	    	Connection conn = null;
	    	try {
	    		 conn = DataSourceSingleton.getInstance().getConnection();
			} catch (SQLException e) {
				LogTool.logger.error("获取数据库连接失败，请检查网络");
			}
	    	return conn;
	    }
	    public Connection getBaseConnection(){
	    	Connection conn = null;
	    	try {
	    		 conn = DataSourceSingleton.getBaseInstance().getConnection();
			} catch (SQLException e) {
				LogTool.logger.error("获取数据库连接失败，请检查网络");
			}
	    	return conn;
	    }
}
