/**
 * Class Generator
 * @author rexer
 * @date   2016-10-18
 * @param  {Object}   proto 原型
 * @return {BaseClass}
 */
function clazz(proto) {
    proto = proto || Object.create(null);
    return BaseClass.prototype.extend(proto);
}


/**
 * 基类
 * @author rexer
 * @date   2016-10-18
 */
function BaseClass() {
    this.guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    this.init.apply(this, Array.prototype.slice.call(arguments));
}

/**
 * 构造器
 */
BaseClass.prototype.init = function() {}

/**
 * 继承
 */
BaseClass.prototype.extend = function(proto) {
    var Base = this.constructor;

    function Clazz() {
        Base.apply(this, arguments);
    }

    function inherit(Child, Parent) {
        function Bridge() {}
        Bridge.prototype = Parent.prototype;
        Child.prototype = new Bridge();
        Child.prototype.constructor = Child;
        for (var p in proto) {
            Child.prototype[p] = proto[p];
        }
        return Child;
    }

    return inherit(Clazz, Base);
}
