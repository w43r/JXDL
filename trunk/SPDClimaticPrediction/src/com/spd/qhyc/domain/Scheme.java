package com.spd.qhyc.domain;

public class Scheme {
	public String type;
	public String makeTime;
	public String element;
	public String model;
	public String hourspan;
	public Double defaultDataValue;
	
	public Scheme(String type,String makeTime,String element,String model,String hourspan,Double defaultDataValue){
		this.type = type; 
		this.makeTime = makeTime;
		this.element = element;
		this.model = model;
		this.hourspan = hourspan;
		this.defaultDataValue = defaultDataValue;
	}
}
