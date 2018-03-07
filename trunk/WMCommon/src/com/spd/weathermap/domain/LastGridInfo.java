package com.spd.weathermap.domain;

import java.util.ArrayList;

public class LastGridInfo {
	private String datetime;
	private String hourspans;
	private String elements;
	private String levels;
	private ArrayList<String> datetimeSerial;
	
	public String getDateTime() {
		return datetime;
	}
	public void setDateTime(String value) {
		this.datetime = value;
	}
	
	public String getHourSpans() {
		return hourspans;
	}
	public void setHourSpans(String value) {
		this.hourspans = value;
	}
	
	public String getElements() {
		return elements;
	}
	public void setElements(String value) {
		this.elements = value;
	}
	
	public String getLevels() {
		return levels;
	}
	public void setLevels(String value) {
		this.levels = value;
	}
	
	public ArrayList<String> getDatetimeSerial() {
		return datetimeSerial;
	}
	public void setDatetimeSerial(ArrayList<String> value) {
		this.datetimeSerial = value;
	}
}
