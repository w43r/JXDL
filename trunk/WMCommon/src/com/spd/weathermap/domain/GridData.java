package com.spd.weathermap.domain;

import java.util.ArrayList;

/*
 * 格点数据类
 * by zouwei, 2015-05-10
 * */
public class GridData {

	private double left;
	
	private double bottom;
	
	private double right;
	
	private double top;
	
	private int rows;
	
	private int cols;
	
	private double noDataValue;
	
	private String values;
	
	private ArrayList<Double> dvalues;
	
	private String nwpModelTime;

	public double getLeft() {
		return left;
	}

	public void setLeft(double left) {
		this.left = left;
	}

	public double getBottom() {
		return bottom;
	}

	public void setBottom(double bottom) {
		this.bottom = bottom;
	}

	public double getRight() {
		return right;
	}

	public void setRight(double right) {
		this.right = right;
	}

	public double getTop() {
		return top;
	}

	public void setTop(double top) {
		this.top = top;
	}

	public int getRows() {
		return rows;
	}

	public void setRows(int rows) {
		this.rows = rows;
	}

	public int getCols() {
		return cols;
	}

	public void setCols(int cols) {
		this.cols = cols;
	}

	public String getValues() {
		return values;
	}

	public void setValues(String values) {
		this.values = values;
	}
	
	public double getNoDataValue() {
		return noDataValue;
	}

	public void setNoDataValue(double noDataValue) {
		this.noDataValue = noDataValue;
	}
	
	public ArrayList<Double> getDValues() {
		return dvalues;
	}

	public void setDValues(ArrayList<Double> dvalues) {
		this.dvalues = dvalues;
	}
	
	public String getNWPModelTime(){
		return this.nwpModelTime;
	}
	
	public void setNWPModelTime(String nwpModelTime){
		this.nwpModelTime = nwpModelTime; 
	}
}
