package com.spd.weathermap.domain;

import java.util.ArrayList;

/*
 * 格点数据压缩类
 * by zouwei, 2015-10-22
 * */
public class GridDataZip {

	private double left;
	
	private double bottom;
	
	private double right;
	
	private double top;
	
	private int rows;
	
	private int cols;
	
	private double noDataValue;
	
	//（所有出现的）格点值
	private ArrayList<Integer> values;
	
	//总的重复次数
	private ArrayList<Integer> toltalRepeats;
	
	//行索引
	private ArrayList<Integer> rowIndexs;
	
	//列索引
	private ArrayList<Integer> colIndexs;
	
	//各次重复次数
	private ArrayList<Integer> repeats;

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
	
	public double getNoDataValue() {
		return noDataValue;
	}

	public void setNoDataValue(double noDataValue) {
		this.noDataValue = noDataValue;
	}
	
	public ArrayList<Integer> getValues() {
		return values;
	}

	public void setValues(ArrayList<Integer> arrayValues) {
		this.values = arrayValues;
	}
	
	public ArrayList<Integer> getToltalRepeats() {
		return this.toltalRepeats;
	}

	public void setToltalRepeats(ArrayList<Integer> arrayTotalRepeat) {
		this.toltalRepeats = arrayTotalRepeat;
	};
	
	public ArrayList<Integer> getRowIndexs() {
		return this.rowIndexs;
	}

	public void setRowIndexs(ArrayList<Integer> rowIndexs) {
		this.rowIndexs = rowIndexs;
	};
	
	public ArrayList<Integer> getColIndexs() {
		return this.colIndexs;
	}

	public void setColIndexs(ArrayList<Integer> colIndexs) {
		this.colIndexs = colIndexs;
	};
	
	public ArrayList<Integer> getRepeats() {
		return this.repeats;
	}

	public void setRepeats(ArrayList<Integer> repeats) {
		this.repeats = repeats;
	};
}
