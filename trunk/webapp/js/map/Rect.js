/**
 * Rect定义
 * Created by zouwei
 */

SuperMap.Rect = SuperMap.Class({

    //左
    left:null,

    //上
    top:null,

    //右
    right:null,

    //下
    bottom:null,

    //宽度
    width:null,

    //高度
    height:null,

    initialize: function(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.width = this.right - this.left;
        this.height = this.top - this.bottom;
    },

    CLASS_NAME: 'SuperMap.Rect'
});

