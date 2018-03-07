package com.spd.qhyc.tool;

import com.mg.objects.Analyst;
import com.mg.objects.DatasetVector;
import com.mg.objects.Datasource;
import com.spd.qhyc.domain.Application;
import com.spd.weathermap.util.LogTool;
import java.awt.geom.Rectangle2D;

public class RasterService
{
  public void IDW(DatasetVector dv, String IDWField, Rectangle2D rc, Double size, String outDSName, String outDRName) {
    Analyst pAnalyst = Analyst.CreateInstance("IDW", Application.m_workspace);
    try
    {
      String dsName = dv.GetDatasource().GetAlias();
      String drName = dv.GetName();
      String str = String.format("{\"Datasource\":\"%s\",\"Dataset\":\"%s\"}", new Object[] { dsName, drName });
      pAnalyst.SetPropertyValue("Point", str);
      pAnalyst.SetPropertyValue("Field", IDWField);
      str = String.format("{\"left\":%f,\"bottom\":%f,\"right\":%f,\"top\":%f}", new Object[] { Double.valueOf(rc.getX()), Double.valueOf(rc.getY()), Double.valueOf(rc.getX() + rc.getWidth()), Double.valueOf(rc.getY() + rc.getHeight()) });
      pAnalyst.SetPropertyValue("Bounds", str);
      pAnalyst.SetPropertyValue("CellSize", String.format("%s %s", new Object[] { size, size }));
      pAnalyst.SetPropertyValue("CellValueType", "Single");
      pAnalyst.SetPropertyValue("SearchMode", "RadiusVariable");
      str = String.format("{\"PointCount\":%d,\"MaxRadius\":%d}", new Object[] { Integer.valueOf(12), Integer.valueOf(0) });
      pAnalyst.SetPropertyValue("RadiusVariable", str);
      pAnalyst.SetPropertyValue("Power", "2");
      pAnalyst.SetPropertyValue("CrossValidation", "false");
      str = String.format("{\"Type\":\"Memory\",\"Alias\":\"%s\",\"Server\":\"\"}", new Object[] { outDSName });
      Application.m_workspace.CloseDatasource("outDSName");
      Datasource DSOut = Application.m_workspace.CreateDatasource(str);
      str = String.format("{\"Datasource\":\"%s\",\"Dataset\":\"%s\"}", new Object[] { outDSName, outDRName });
      pAnalyst.SetPropertyValue("Raster", str);
      pAnalyst.Execute();
    }
    catch (Exception ex)
    {
    	LogTool.logger.error("插值出错!");
    }
    finally
    {
      pAnalyst.Destroy();
    }
  }
}