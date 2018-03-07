package com.spd.qhyc.domain;

import java.util.ArrayList;

/*
 * 预报数据
 * by zouwei, 2016-1-5
 * */
public class ForecastData {
	private ArrayList<String> stationNums;
	private ArrayList<ForecastDataItem> items;

	public ForecastData()
	{
	}
	
	public ArrayList<String> getStationNums()
	{
		return this.stationNums;
	}
	
	public void setStationNums(ArrayList<String> val)
	{
		this.stationNums = val;
	}
	
	public ArrayList<ForecastDataItem> getItems()
	{
		return this.items;
	}
	
	public void setItems(ArrayList<ForecastDataItem> val)
	{
		this.items = val;
	}
}
