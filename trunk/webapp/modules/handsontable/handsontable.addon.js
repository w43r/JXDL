/**
 * 拓展 handsontable.addon
 * 编辑器 handsontable.StationEditor
 * @author rexer
 * @date   2016-07-11
 */

+ function($, H) {

    /**
     * @namespace
     */
    H.addon = Object.create(null);

    H.addon.defaults = {
        rowHeaders: true,
        rowHeights: 30,
        height: '100%',
        width: '100%',
        stretchH: 'all', //拉伸所有单元格宽度
        manualColumnResize: true,
        manualRowResize: true,
        autoWrapCol: true,
        autoWrapRow: true,
        currentRowClassName: 'currentRow', //选中css
        currentColClassName: 'currentCol', //选中css
        manualColumnMove: true, //移动列
        manualRowMove: true, //移动行
        columnSorting: true,
        sortIndicator: true,
        filters: true,
        contextMenu: true, //右键菜单
        dropdownMenu: ['remove_col', '---------', 'make_read_only', '---------', 'alignment', '---------', 'filter_by_condition', 'filter_action_bar', '---------', 'filter_by_value'],
        minSpareRows: 0, //空行
        allowRemoveColumn: true,
        allowRemoveRow: true,
        renderAllRows: false,
        //以下属性与排序冲突，请勿使用
        // autoRowSize: true,
        // autoColumnSize: true,
    };

    /**
     * 参数化
     * @param  {Array}   cols dataSchema
     * @param  {Array}   data 数据
     * @param  {Object}  [opts] 自定义参数
     * @return {Object}	 handsontable参数
     */
    H.addon.paramize = function(cols, data, opts) {
        var headers = [],
            columns = [];
        cols.forEach(function(item) {
            headers.push(item.title);
            var col = $.extend({ className: 'htCenter htMiddle' }, item);
            delete col.title;
            columns.push(col);
        });
        return $.extend({
            data: data,
            colHeaders: headers,
            columns: columns
        }, H.addon.defaults, opts);
    };

    /**
     * 工具类
     * @param  {Handsontable|jQuery|HTMLElement|Selector}   para 实例对象
     * @constructor
     */
    H.addon.Util = function(para) {
        var instance;

        this.setInstance = function(table) {
            if (table instanceof $ || table instanceof HTMLElement || typeof table === 'string') {
                instance = $(table).handsontable('getInstance');
            } else instance = table;
            return this;
        };

        /**
         * 设置行属性
         * @param  {Number}   row  [description]
         * @param  {Object}   prop [description]
         */
        this.setRowMeta = function(row, prop) {
            var col = instance.countCols() - 1;
            while (col >= 0) {
                instance.setCellMetaObject(row, col, prop);
                col--;
            }
            return this;
        };

        /**
         * 设置列属性
         * @param  {Number}   col  [description]
         * @param  {Object}   prop [description]
         */
        this.setColMeta = function(col, prop) {
            var row = instance.countRows() - 1;
            while (row >= 0) {
                instance.setCellMetaObject(row, col, prop);
                row--;
            }
            return this;
        };

        /**
         * 选择整行
         * @param  {[type]}   row [description]
         * @return {[type]}       [description]
         */
        this.selectRow = function(row) {
            var col = instance.countCols() - 1;
            instance.selectCell(row, 0, row, col, true);
            return this;
        };

        /**
         * 选择整列
         * @param  {Number}   col [description]
         * @return {[type]}       [description]
         */
        this.selectCol = function(col) {
            var row = instance.countRows() - 1;
            instance.selectCell(0, col, row, col, true);
            return this;
        };

        /**
         * 导出表格
         * @param  {Function}   filter   过滤器 args: data,header
         * @param  {String}     filename 文件名
         */
        this.exportToExcel = function(filter, filename) {
            var BOM = '\uFEFF'; //utf-8 with bom
            var LF = '\r\n';
            var header = instance.getColHeader();
            var dataSource = instance.getData();
            var content = typeof filter === 'function' ? filter(dataSource, header) : dataSource;
            content.unshift(header);
            var blob = new Blob([BOM + content.join(LF)], { type: 'text/csv' });
            var name = (filename || 'export') + '.csv';
            G.download(blob, name);
        };

        this.setInstance(para);
    };


    //////////////////////////////
    //         Editor           //
    //////////////////////////////

    /**
     * 站点/区域编辑器
     * @requires customStationPanel
     * @extend BaseEditor
     */
    var StationEditor = H.editors.BaseEditor.prototype.extend();

    /**
     * 关联单元格联动
     */
    StationEditor.prototype.syncCell = function(val) {
        var instance = this.instance,
            rowIndex = this.row,
            colIndex;
        if (this.dataSync === true) {
            colIndex = instance.countCols() - 1;
            while (colIndex >= 0) {
                var cellProp = instance.getCellMeta(rowIndex, colIndex);
                if (colIndex !== this.col && cellProp.editor === 'station') {
                    instance.setDataAtCell(rowIndex, colIndex, val[cellProp.dataType], 'stationSync');
                }
                colIndex--;
            }
        } else if ($.isArray(this.dataSync)) {
            for (var i = this.dataSync.length; i--;) {
                colIndex = this.dataSync[i];
                var cellProp = instance.getCellMeta(rowIndex, colIndex);
                instance.setDataAtCell(rowIndex, colIndex, val[cellProp.dataType], 'stationSync');
            }
        }
    };

    StationEditor.prototype.init = function() {
        var that = this;
        var $container = $(this.instance.rootElement);
        var $panel = $('<div class="ht-stationpanel"><i class="stationpanel-text"></i><i class="stationpanel-btn"></i></div>').hide();
        $container.append($panel);
        this.StationPanel = $panel.customStationPanel({
            title: '区域选择',
            single: true,
            first: false,
            station: [{
                areaCode: '500000',
                stationCode: '50000',
                stationName: '市局',
                region: 'mainCity'
            }].concat($.fn.customStationPanel.defaults.station)
        }).data('customStationPanel');
        this.StationPanel.$this.on('close.station', function(event) {
            event.preventDefault();
            that.finishEditing(true, event, that.syncCell);
        });
        this.StationPanel.$panel.on('mousedown', function(event) {
            event.stopImmediatePropagation();
        });
    };

    StationEditor.prototype.getValue = function() {
        return {
            'data-code': this.StationPanel.getCodes('data-code'),
            'data-name': this.StationPanel.getCodes('data-name'),
            'data-area': this.StationPanel.getCodes('data-area')
        };
    };

    StationEditor.prototype.setValue = function(val) {
        this.StationPanel.first(val);
    };

    StationEditor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties) {
        H.editors.BaseEditor.prototype.prepare.apply(this, arguments);
        this.dataType = cellProperties.dataType;
        this.dataSync = cellProperties.dataSync;
        this.setValue(originalValue);
    };

    StationEditor.prototype.open = function() {
        this.StationPanel.show();
    };
    StationEditor.prototype.isOpened = function() {
        return !this.StationPanel.$panel.is(':hidden');
    };
    StationEditor.prototype.close = function() {
        this.StationPanel.hide();
    };
    StationEditor.prototype.focus = function() {
        this.StationPanel.$panel.focus();
    };
    StationEditor.prototype.startEditing = function() {};
    StationEditor.prototype.finishEditing = function(revertToOriginal, ctrlDown, callback) {
        var val = this.getValue();
        this.saveValue(val, ctrlDown);
        if (callback) callback.call(this, val);
    };
    StationEditor.prototype.saveValue = function(val, ctrlDown) {
        H.editors.BaseEditor.prototype.saveValue.call(this, [
            [val[this.dataType]]
        ], ctrlDown);
    };

    /**
     * station --> StationEditor
     */
    H.editors.registerEditor('station', StationEditor);

}(jQuery, Handsontable);
