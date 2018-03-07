package com.spd.qhyc.pojo;
/**
 * @作者:wangkun
 * @日期:2017年3月24日
 * @公司:spd
 * @说明:
*/
public class CommonConfig {
	private String qutai_ForecastPath;
	private String shitai_ForecastPath;
	private String uvPath;//uv目录
	private String olrPath;
	private String osrFile;
	private String mjoFile;
	private String RmmFile;
	private String derfUV;
	public String getDerfUV() {
		return derfUV;
	}
	public void setDerfUV(String derfUV) {
		this.derfUV = derfUV;
	}
	public String getShitai_ForecastPath() {
		return shitai_ForecastPath;
	}
	public void setShitai_ForecastPath(String shitai_ForecastPath) {
		this.shitai_ForecastPath = shitai_ForecastPath;
	}
	public String getRmmFile() {
		return RmmFile;
	}
	public void setRmmFile(String rmmFile) {
		RmmFile = rmmFile;
	}
	public String getQutai_ForecastPath() {
		return qutai_ForecastPath;
	}
	public void setQutai_ForecastPath(String qutai_ForecastPath) {
		this.qutai_ForecastPath = qutai_ForecastPath;
	}
	public String getUvPath() {
		return uvPath;
	}
	public void setUvPath(String uvPath) {
		this.uvPath = uvPath;
	}
	public String getOlrPath() {
		return olrPath;
	}
	public void setOlrPath(String olrPath) {
		this.olrPath = olrPath;
	}
	public String getOsrFile() {
		return osrFile;
	}
	public void setOsrFile(String osrFile) {
		this.osrFile = osrFile;
	}
	public String getMjoFile() {
		return mjoFile;
	}
	public void setMjoFile(String mjoFile) {
		this.mjoFile = mjoFile;
	}
}
