function FeatureUtilityClass() {}

FeatureUtilityClass.prototype.getRecordsetFromJson = function(jsonObject) {
    if (!jsonObject) {
        return;
    }
    var feature = null,
        features = null;
    if (jsonObject.features) {
        features = [];
        for (var i = 0, fe = jsonObject.features, len = fe.length; i < len; i++) {
            feature = this.getFeatureFromJson(fe[i]);
            features.push(feature);
        }
    }
    return new WeatherMap.REST.Recordset({
        datasetName: jsonObject.datasetName,
        fieldCaptions: jsonObject.fieldCaptions,
        fields: jsonObject.fields,
        fieldTypes: jsonObject.fieldTypes,
        features: features
    });
};

FeatureUtilityClass.prototype.getFeatureFromJson = function(jsonObject) {
    var geo = null;
    if (!jsonObject) {
        return;
    }
    geo = jsonObject.geometry;
    if (geo) {
        if (geo.type == "REGION") //解决多边形岛洞问题，其他几何对象创建方法不变
            geo = this.getGeoRegionFromJson(geo);
        else if (geo.type == "POINT")
            geo = WeatherMap.REST.ServerGeometry.fromJson(geo).toGeoPoint();
        else if (geo.type == "LINE")
            geo = WeatherMap.REST.ServerGeometry.fromJson(geo).toGeoLine();
    }

    var names, values, geo,
        attr = {},
        me = this,
        feature;

    names = jsonObject.fieldNames;
    values = jsonObject.fieldValues;
    for (var i in names) {
        attr[names[i]] = values[i];
    }
    feature = new WeatherMap.Feature.Vector(geo, attr);
    if (geo && geo.id) feature.fid = geo.id;
    return feature;
};

FeatureUtilityClass.prototype.getGeoRegionFromJson = function(jsonObject) {
    if (!jsonObject) {
        return;
    }
    var nStart = 0;
    var lines = [];
    for (var p = 0; p < jsonObject.parts.length; p++) {
        var pts = [];
        var ptCount = jsonObject.parts[p];
        for (var i = nStart; i < nStart + ptCount; i++) {
            var pt = new WeatherMap.Geometry.Point(jsonObject.points[i].x, jsonObject.points[i].y);
            pts.push(pt);
        }
        nStart += ptCount;
        var line = new WeatherMap.Geometry.LinearRing(pts);
        lines.push(line);
    }
    return new WeatherMap.Geometry.Polygon(lines);
};
