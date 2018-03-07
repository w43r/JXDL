package com.spd.qhyc.tool;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class LogTool {
	public static Logger logger = null;
	static{
		if(logger==null){
			logger = LogManager.getLogger(LogTool.class.getName());
		}	
	}
}
