package com.spd.qhyc.domain;

public class OutputSetting {
	public String elementOut;
	public String elementCaption;
	public String element;
	public Integer hourSpan;
	public Integer hourSpanTotal;
	public String outputPath;
	public Integer method;
	public Double isolineInterval;
	public Double isolineStart;
	public Double isolineEnd;
	
	public OutputSetting(String elementOut,String elementCaption, String element, Integer hourSpan, Integer hourSpanTotal,
			String outputPath, Integer method, Double isolineInterval, Double isolineStart, Double isolineEnd){
		this.elementOut = elementOut;
		this.elementCaption = elementCaption;
		this.element = element;
		this.hourSpan = hourSpan;
		this.hourSpanTotal = hourSpanTotal;
		this.outputPath = outputPath;
		this.method = method;
		this.isolineInterval = isolineInterval;
		this.isolineStart = isolineStart;
		this.isolineEnd = isolineEnd;
	}
}
