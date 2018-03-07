package com.spd.weathermap.domain;

public class GridValueInfo {
	private Integer hourSpan;
	private Double value;
	
	public GridValueInfo(Integer hourSpan, Double value)
	{
		this.hourSpan = hourSpan;
		this.value = value;
	}
	
	public Integer getHourSpan() {
		return this.hourSpan;
	}
	public void setHourSpan(Integer value) {
		this.hourSpan = value;
	}
	
	public Double getValue() {
		return value;
	}
	public void setValue(Double value) {
		this.value = value;
	}
}
