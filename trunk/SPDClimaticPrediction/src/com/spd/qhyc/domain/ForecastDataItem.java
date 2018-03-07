package com.spd.qhyc.domain;

import java.util.ArrayList;

/*
 * 预报数据子项
 * by zouwei, 2016-1-5
 * */
public class ForecastDataItem {
	private String element;
	private Integer hourSpan;
	private ArrayList<Double> datas;

	public ForecastDataItem(String element, Integer hourSpan, ArrayList<Double> datas)
	{
		this.element = element;
		this.hourSpan = hourSpan;
		this.datas = datas;
	}
	
	public String getElement()
	{
		return this.element;
	}
	
	public void setElement(String val)
	{
		this.element = val;
	}
	
	public Integer getHourSpan()
	{
		return this.hourSpan;
	}
	
	public void setHourSpan(Integer val)
	{
		this.hourSpan = val;
	}
	
	public ArrayList<Double> getDatas()
	{
		return this.datas;
	}
	
	public void setDatas(ArrayList<Double> val)
	{
		this.datas = val;
	}
}
