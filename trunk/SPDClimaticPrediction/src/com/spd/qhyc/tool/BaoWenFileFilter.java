package com.spd.qhyc.tool;

import java.io.File;
import java.io.FileFilter;

public class BaoWenFileFilter implements FileFilter {

	private String filtrStr;
	
	public BaoWenFileFilter(String filtrStr) {
		this.filtrStr = filtrStr;
	}
	
	@Override
	public boolean accept(File file) {
		String fileName = file.getName();
		return fileName.matches(filtrStr);
	}

}
