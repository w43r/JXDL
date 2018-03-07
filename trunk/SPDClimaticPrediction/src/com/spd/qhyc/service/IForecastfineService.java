package com.spd.qhyc.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;



public interface IForecastfineService {

	public List<Map> getUserStation(HashMap paraMap);
	public List<Map> getUserStationNew(HashMap paraMap);
	public List<Map> getZDYBPublishTime(HashMap paraMap);
	public List<Map> getZDYBType(HashMap paraMap);
	public List<Map> getZDYBSet(HashMap paraMap);
	public List<Map> updateZDYBSet(HashMap paraMap);
	public List<Map> insertZDYBSet(HashMap paraMap);
	public List<Map> getZDYBElement(HashMap paraMap);
	public List<Map> getZDYBOutType(HashMap paraMap);
	public List<Map> getZDYBStationType(HashMap paraMap);
	public List<Map> getGDYBPublishTime(HashMap paraMap);
	public List<Map> deleteProductTime(HashMap paraMap);
	public List<Map> addProductType(HashMap paraMap);
	public List<Map> addStationType(HashMap paraMap);
	public List<Map> getStation();
}
