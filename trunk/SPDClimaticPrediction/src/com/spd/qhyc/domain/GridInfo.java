package com.spd.qhyc.domain;

/*
 * 格点产品信息类
 * by zouwei, 2015-10-27
 * */
public class GridInfo {
	private int id;
	
	private String departCode;
	
	private String type;
	
	private String element;
	
	private String forecastTime;
	
	private int hourSpan;
	
	private int totalHourSpan;
	
	private int level;
	
	private String version;
	
	private String tabelName;
	
	private String nwpModel;
	
	private String nwpModelTime;
	
	private String userName;
	
	private String forecaster;
	
	private String issuer;
	
	private String makeTime;
	
	private String lastModifyTime;
	
	private Integer subjective;
	
	private String remark;
	
	public int getId() {
		return this.id;
	}

	public void setId(int id) {
		this.id = id;
	}
	
	public String getDepartCode() {
		return this.departCode;
	}

	public void setDepartCode(String departCode) {
		this.departCode = departCode;
	}
	
	public String getType() {
		return this.type;
	}

	public void setType(String type) {
		this.type = type;
	}
	
	public String getElement() {
		return this.element;
	}

	public void setElement(String element) {
		this.element = element;
	}
	
	public String getForecastTime() {
		return this.forecastTime;
	}

	public void setForecastTime(String forecastTime) {
		this.forecastTime = forecastTime;
	}
	
	public int getHourSpan() {
		return this.hourSpan;
	}

	public void setHourSpan(int hourSpan) {
		this.hourSpan = hourSpan;
	}
	
	public int getTotalHourSpan() {
		return this.totalHourSpan;
	}

	public void setTotalHourSpan(int totalHourSpan) {
		this.totalHourSpan = totalHourSpan;
	}
	
	public int getLevel() {
		return this.level;
	}

	public void setLevel(int level) {
		this.level = level;
	}
	
	public String getVersion(){
		return this.version;
	}
	
	public void setVerstion(String version){
		this.version = version;
	}
	
	public String getTabelName() {
		return this.tabelName;
	}

	public void setTabelName(String tabelName) {
		this.tabelName = tabelName;
	}
	
	public String getNWPModel() {
		return this.nwpModel;
	}

	public void setNWPModel(String nwpModel) {
		this.nwpModel = nwpModel;
	}
	
	public String getNWPModelTime() {
		return this.nwpModelTime;
	}

	public void setNWPModelTime(String nwpModelTime) {
		this.nwpModelTime = nwpModelTime;
	}	
	
	public String getUserName() {
		return this.userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}
	
	public String getForecaster() {
		return this.forecaster;
	}

	public void setForecaster(String forecaster) {
		this.forecaster = forecaster;
	}
	
	
	public String getIssuer() {
		return this.issuer;
	}

	public void setIssuer(String issuer) {
		this.issuer = issuer;
	}
	
	public String getMakeTime() {
		return this.makeTime;
	}

	public void setMakeTime(String makeTime) {
		this.makeTime = makeTime;
	}

	public String getLastModifyTime() {
		return this.lastModifyTime;
	}

	public void setLastModifyTime(String lastModifyTime) {
		this.lastModifyTime = lastModifyTime;
	}
	
	public Integer getSubjective() {
		return this.subjective;
	}

	public void setSubjective(Integer subjective) {
		this.subjective = subjective;
	}
	
	public String getRemark() {
		return this.remark;
	}

	public void setRemark(String remark) {
		this.remark = lastModifyTime;
	}
}