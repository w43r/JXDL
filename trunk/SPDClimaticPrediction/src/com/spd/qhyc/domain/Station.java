package com.spd.qhyc.domain;

/*
 * 站点类
 * by zouwei, 2015-12-13
 * */
public class Station {
	
	private String stationNum;
	
	private String stationName;
	
	private Double latitude;
	
	private Double longitude;
	
	private Double height;
	
	private int zoomLevel;
	
	private int type;
	
	private String areaCode;
	
	public Station(String stationNum, String stationName, Double latitude, Double longitude, Double height, int zoomLevel, int type, String areaCode){
		this.stationNum = stationNum;
		this.stationName = stationName;
		this.latitude = latitude;
		this.longitude = longitude;
		this.height = height;
		this.zoomLevel = zoomLevel;
		this.type = type;
		this.areaCode = areaCode;
	}
	
	
	public String getStationNum() {
		return this.stationNum;
	}

	public void setStationNum(String value) {
		this.stationNum = value;
	}
	
	public String getStationName() {
		return this.stationName;
	}

	public void setStationName(String value) {
		this.stationName = value;
	}
	
	public Double getLatitude() {
		return this.latitude;
	}

	public void setLatitude(Double value) {
		this.latitude = value;
	}
	
	public Double getLongitude() {
		return this.longitude;
	}

	public void setLongitude(Double value) {
		this.longitude = value;
	}
	
	public Double getHeight() {
		return this.height;
	}

	public void setHeight(Double value) {
		this.height = value;
	}
	
	public int getZoomLevel() {
		return this.zoomLevel;
	}

	public void setZoomLevel(int value) {
		this.zoomLevel = value;
	}
	
	public int getType() {
		return this.type;
	}

	public void setType(int value) {
		this.type = value;
	}
	
	public String getAreaCode() {
		return this.areaCode;
	}

	public void setAreaCode(String value) {
		this.areaCode = value;
	}
}
