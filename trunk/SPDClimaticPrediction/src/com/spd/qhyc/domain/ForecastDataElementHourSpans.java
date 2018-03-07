package com.spd.qhyc.domain;

import java.util.ArrayList;

/*
 * 预报数据之要素时效
 * by zouwei, 2016-1-5
 * */
public class ForecastDataElementHourSpans {
	private String name;
	private ArrayList<Integer> hourSpans;
	
	public ForecastDataElementHourSpans(String name, ArrayList<Integer> hourSpans)
	{
		this.name = name;
		this.hourSpans = hourSpans;
	}
	
	public String getName()
	{
		return this.name;
	}
	
	public void setName(String val)
	{
		this.name = val;
	}
	
	public ArrayList<Integer> getHourSpans()
	{
		return this.hourSpans;
	}
	
	public void setHourSpans(ArrayList<Integer> val)
	{
		this.hourSpans = val;
	}
}
