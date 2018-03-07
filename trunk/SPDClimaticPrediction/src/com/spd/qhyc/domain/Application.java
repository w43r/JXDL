package com.spd.qhyc.domain;

import com.mg.objects.Workspace;

/*应用程序类*/
public class Application {
	public static Workspace m_workspace = null;	
	static {
		m_workspace = new Workspace();
	}
}
