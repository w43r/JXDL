package com.spd.weathermap.domain;

/*
 * 风填图类
 * */
public class PlotWind {
	Double x;
	Double y;
	Double speed;
	Double direction;
	
	public PlotWind(Double x, Double y, Double speed, Double direction)
	{
		this.x = x;
		this.y  = y;
		this.speed = speed;
		this.direction = direction;
	}

	public Double getX() {
		return x;
	}

	public void setX(Double value) {
		this.x = value;
	}	
	
	public Double getY() {
		return y;
	}

	public void setY(Double value) {
		this.y = value;
	}
	
	public Double getSpeed() {
		return speed;
	}

	public void setSpeed(Double value) {
		this.speed = value;
	}
	
	public Double getDirection() {
		return direction;
	}

	public void setDirection(Double value) {
		this.direction = value;
	}
}
