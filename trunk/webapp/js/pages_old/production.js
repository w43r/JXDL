/**
 * 产品制作
 * @author rexer
 * @date   2016-10-19
 */

var corePage;

function run() {
    corePage = new tpl('产品制作').ready(function() {
        corePage.Grid = null; //表格实例
        corePage.CurrentProduct = null; // 当前产品
        corePage.Templates = null; //模版数据
        // 初始化页面
        var menuOpts = [];
        var auth = G.User.getAuthority();
        var Alert = new tpl.Plugin.alert(this.$page);
        if (!auth.C && !auth.E) {
            Alert.show('对不起，您没有权限查看本页', 'warning');
            setTimeout(function() {
                Alert.remove(true);
                history.go(-1);
            }, 3000);
            return;
        }
        // 产品页面
        if (auth.C) menuOpts.push({ //业务
            text: '我的产品',
            handler: function() {
                corePage.CE = true;
                initPage(function() {
                    corePage.FAB.fab('add', null, '新建产品', createProduct);
                }, function() {
                    var btns = ['download', 'remove'];
                    switch (corePage.CurrentProduct.state) {
                        case 1:
                            btns.push('submit', 'upload');
                            break;
                        case 3:
                            btns.push('publish');
                            break;
                        case 4:
                            btns.push('submit', 'upload');
                            break;
                    }
                    corePage.FAB.clearBtns().addBtns(btns);
                });
            }
        });
        // 审核页面
        if (auth.E) menuOpts.push({
            text: '产品审核',
            handler: function() {
                corePage.CE = false;
                initPage(emptyFun, function() {
                    var productState = corePage.CurrentProduct.state;
                    if (productState === 2) { //待审核
                        corePage.FAB.fab('star_border', 'red', '审核该产品', reviewProduct);
                    } else if (productState === 3 || productState === 5) { //已审核
                        corePage.FAB.fab('star', 'green', false, false);
                    } else if (productState === 4) {
                        corePage.FAB.fab('star_half', 'orange', false, false);
                    } else {
                        corePage.FAB.fab('schedule', 'blue lighten-2', false, false);
                    }
                });
            }
        });
        ProductCreator.Query.getAllTemplate(function(templates) {
            if ($.isArray(templates) && templates.length > 0) {
                corePage.Templates = templates;
                return corePage.menu(menuOpts);
            }
            Alert.show('产品数据加载失败,请重试...', 'warning');
        }).fail(function() { Alert.show('产品数据加载失败,请重试...', 'warning'); });
    });
}

/**
 * 签发状态
 * @const
 */
var PRODUCT_STATE_DICT = [
    { code: 0, name: '新建', color: 'white' },
    { code: 1, name: '未提交', color: '#64b5f6' },
    { code: 2, name: '待审核', color: 'yellow' },
    { code: 3, name: '待发布', color: 'orange' },
    { code: 4, name: '未通过', color: '#ef5350' },
    { code: 5, name: '已发布', color: '#5cb85c' }
];

/**
 * 产品状态排序顺序
 * @const
 */
var PRODUCT_STATE_SORT = {
    C: [4, 1, 2, 3, 5, 0],
    E: [2, 4, 3, 5]
};

/**
 * 状态列号
 * @const
 */
var PRODUCT_STATE_COL = 1;

/**
 * 表格列属性
 * @const
 */
var COL_PROPS = [
    { title: '产品名称', data: 'ProductTitle', readOnly: true }, {
        title: '状态',
        data: 'state',
        readOnly: true,
        type: 'text',
        renderer: function(instance, td, row, col, prop, value, cellProperties) {
            var productState = PRODUCT_STATE_DICT[Number(value)];
            var args = Array.prototype.slice.call(arguments);
            args[5] = productState.name;
            Handsontable.renderers.TextRenderer.apply(this, args);
            td.style.backgroundColor = productState.color;
        }
    },
    { title: '产品类型', data: 'TemplateName', readOnly: true },
    { title: '制作者', data: 'UserName', readOnly: true },
    { title: '部门', data: 'Country', readOnly: true },
    { title: '创建时间', data: 'CreateTime', readOnly: true },
    { title: 'id', data: 'id', readOnly: true }
];

/**
 * FAB Util
 * @author rexer
 * @date   2016-10-26
 * @param  {[type]}   element [description]
 */
function FABClass(element) {
    var btn = element.find('.fab-btn'),
        btnContent = element.find('ul');

    this.close = function() {
        element.closeFAB();
        return this;
    };
    this.open = function() {
        element.closeFAB();
        setTimeout(function() {
            element.openFAB();
        }, 500);
        return this;
    };
    // 更新FAB位置
    this.position = function() {
        var position = {};
        var topElement = $('#product-table'),
            bottomElement = $('#product-condtion'),
            leftElement = $('#product-list'),
            rightElement = $('#product-display'),
            // 左上高度
            topHeight = topElement.height(),
            // 左下高度
            bottomHeight = bottomElement.height(),
            // 左侧宽度
            leftWidth = leftElement.width(),
            // 右侧宽度
            rightWidth = rightElement.width();

        if (topHeight <= 255) position.top = 255;
        else if (bottomHeight <= 0) position.bottom = 0;
        else position.bottom = bottomHeight - 25;
        if (leftWidth <= 0) position.left = 0;
        else if (rightWidth <= 0) position.right = 0;
        else position.right = rightWidth - 30;

        element.removeAttr('style').css(position);

        return this;
    };
    this.addBtn = function(icon, color, title, handler) {
        $('<li><a class="fab-btns fab-floating scale2 ' + color + '" title="' + (title || '') + '"><i class="material-icons">' + icon + '</i></a></li>')
            .click(handler)
            .appendTo(btnContent);
        return this;
    };
    this.addBtns = function(btns) {
        var self = this,
            addBtnFun = this.addBtn;
        btns.forEach(function(item) {
            var args = FABClass.BTNS[item];
            addBtnFun.apply(self, args);
        });
    };
    this.clearBtns = function() {
        btnContent.empty();
        return this;
    };
    this.removeBtn = function(index) {
        btnContent.find('.fab-btns').eq(index).remove();
        return this;
    };
    this.activeBtn = function(index) {
        element.openFAB();
        btnContent.find('.fab-btns').eq(index).focus();
        return this;
    };
    this.fab = function(icon, color, title, handler) {
        if (icon) btn.find('i').html(icon);
        if (color) btn[0].className = 'fab-btn fab-floating fab-large ' + color;
        if (title === false) {
            btn.attr('title', '');
        } else if (typeof title === 'string') {
            btn.attr('title', title);
        }
        if (handler === false) {
            btn.off('click');
        } else if (typeof handler === 'function') {
            btn.off('click').click(handler);
        }
        return this;
    };
}

/**
 * FAB按钮集
 * @const
 */
FABClass.BTNS = {
    // 下载
    download: ['file_download', 'teal', '下载产品', function() {
        var productId = corePage.CurrentProduct.id;
        ProductCreator.Query.download(productId, 'doc', function(err) {
            G.tip(err ? '对不起，无法完成下载。' : '对不起，无法找到文档。', false);
        });
    }],
    // 上传附件
    upload: ['file_upload', 'blue lighten-2', '上传附件', function() {
        var html = $('#tpl_production_upload').html();
        openPage('上传附件', html, function(layero, index) {
            /**
             * 关闭弹出页
             */
            function closePage() {
                layer.close(index);
            }
            var product = corePage.CurrentProduct,
                url = G.URL.getProductService() + 'updateFile',
                $filename = $(layero).find('.filename'),
                $progress = $('#progress .progress-bar'),
                $form = $(layero).find('form'),
                $productTitle = $form.find('input[name="productTitle"]').val(product.ProductTitle),
                $productSummary = $form.find('input[name="productSummary"]').val(product.ProductSummary),
                $cancel = $('#product-upload-cancel').click(closePage),
                $yes = $('#product-upload-yes').click(function() {
                    $yes.prop('disabled', true);
                    $cancel.prop('disabled', true);
                    $(this).data().submit();
                });
            var loader = new tpl.Plugin.loader(layero);
            // 上传组件
            $('#fileupload').fileupload({
                url: url,
                dataType: 'json',
                autoUpload: false,
                acceptFileTypes: /(\.|\/)(doc)$/i,
                // maxFileSize: 999000,
                submit: function(e, data) {
                    var $this = $(this);
                    data.formData = G.paramize({
                        productId: product.id,
                        productTitle: $productTitle.val(),
                        productSummary: $productSummary.val(),
                        fileName: data.files[0].name
                    });
                    data.jqXHR = $this.fileupload('send', data);
                    return false;
                },
                progressall: function(e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $progress.css('width', progress + '%');
                    if (progress === 100) {
                        loader.show('');
                    }
                }
            }).on('fileuploadadd', function(e, data) {
                // 添加文件
                $.each(data.files, function(index, file) {
                    $filename.html(file.name);
                });
                $yes.data(data);
            }).on('fileuploaddone', function(e, data) {
                loader.destroy();
                // 上传完成
                $.each(data.files, function(index, file) {
                    G.tip(file.name + '，上传成功', true);
                });
                closePage();
                displayProduct();
            }).on('fileuploadfail', function(e, data) {
                // 上传失败
                loader.destroy();
                $yes.prop('disabled', false);
                $cancel.prop('disabled', false);
                $.each(data.files, function(index, file) {
                    G.tip(file.name + '，上传失败', false);
                });
                $progress.css('width', 0);
            });
        });
    }],
    // 提交
    submit: ['check', 'yellow darken-1', '提交产品', function() {
        var productId = corePage.CurrentProduct.id;

        function handler(isSuccess) {
            if (isSuccess) {
                G.tip('产品提交成功', true);
                updateStateCellOfGrid(2);
            } else {
                G.tip('提交失败,请重试', false);
            }
        }
        ProductCreator.Query.updateProduct(productId, 2).success(handler).fail(function() { handler(false) });
    }],
    // 发布
    publish: ['send', 'orange', '发布产品', function() {
        var productId = corePage.CurrentProduct.id;

        function handler(isSuccess) {
            if (isSuccess) {
                G.tip('产品发布成功', true);
                updateStateCellOfGrid(5);
            } else {
                G.tip('发布失败,请重试', false);
            }
        }
        ProductCreator.Query.updateProduct(productId, 5).success(handler).fail(function() { handler(false) });
    }],
    // 删除
    remove: ['delete_forever', 'red darken-2', '删除产品', function() {
        var product = corePage.CurrentProduct;
        var productId = product.id;
        G.confirm('是否删除《' + product.ProductTitle + '》？', function(ret) {
            if (!ret) return;
            ProductCreator.Query.removeProduct(productId).done(function() {
                corePage.Grid.alter('remove_row', product.ROW);
                corePage.Grid.selectCell(0, 0);
                G.tip('已经删除《' + product.ProductTitle + '》', true);
            }).fail(function() {
                G.tip('删除《' + product.ProductTitle + '》时出错，请重试...', false);
            });
        });
    }]
};

/**
 * 初始化页面
 */
function initPage(afterPageLoad, afterSelectionEnd) {
    // 载入模版
    corePage.clear();
    corePage.$page.html($('#tpl_production').html());
    corePage.animated();

    //重置当前产品
    corePage.CurrentProduct = null;

    // 缓存变量
    corePage.$leftPanel = $('#product-list'); //左侧栏
    corePage.$rightPanel = $('#product-display'); //右侧栏

    // Splitter
    corePage.$page.css('display', 'flex');
    var splitter = Split(['#product-list', '#product-display'], {
        minSize: 0,
        onDrag: function() {
            //边缘隐藏
            var panel1 = $('#product-list');
            if (panel1.width() <= 10) panel1.hide();
            else panel1.show();
            var panel2 = $('#product-display');
            if (panel2.width() <= 10) panel2.hide();
            else panel2.show();

            // 更新表格大小
            var instance = corePage.Grid;
            if (instance && instance.updateSettings) {
                instance.updateSettings({
                    width: panel1.innerWidth()
                });
            }

            corePage.FAB.position();
        }
    });
    var splitter2 = Split(['#product-table', '#product-condtion'], {
        direction: 'vertical',
        sizes: [60, 40],
        minSize: 0,
        onDrag: function() { //边缘隐藏
            var panel1 = $('#product-table');
            if (panel1.width() <= 10) panel1.hide();
            else panel1.show();
            var panel2 = $('#product-condtion');
            if (panel2.width() <= 10) panel2.hide();
            else panel2.show();

            corePage.FAB.position();
        }
    });

    var $datepicker = $('.query-time').customDatePicker({
            timePicker: true,
            timePicker24Hour: true,
            drops: 'up',
            locale: { format: 'YYYY-MM-DD HH:mm' },
            startDate: moment().subtract(1, 'days').startOf('day'),
            endDate: moment()
        }),
        $productType = $('#productType'),
        $productState = $('#productState');

    function toNumberInArray(array) {
        var res = [];
        array.forEach(function(item) {
            res.push(Number(item));
        });
        return res;
    }

    // FAB Instance
    corePage.FAB = new FABClass($('.fixed-action-fab'));
    corePage.FAB.position()
        .clearBtns()
        .addBtns(['download', 'remove']);

    // 产品类型列表
    corePage.Templates.forEach(function(template) {
        $('<option selected></option>')
            .val(template.TemplateId)
            .html(template.TemplateName)
            // .data('template', template)
            .appendTo($productType);
    });

    // click
    $('#product-query-10').click(function(event) {
        initPagination(10, 10, 1);
    });
    $('#product-query-100').click(function(event) {
        initPagination('auto', 100, 1);
    });
    // 产品检索
    $('#product-btn-query').click(function(event) {

        var productType = $productType.val(),
            productState = $productState.val();
        var para = {
            state: productState.join(),
            productTemplateID: productType.join(),
            startTime: $datepicker.customDatePicker('getStartTime').format('YYYY-MM-DD HH:mm:ss'),
            endTime: $datepicker.customDatePicker('getEndTime').format('YYYY-MM-DD HH:mm:ss')
        };
        if (corePage.CE) para.userName = G.User.getName();
        // 查询当前检索记录数
        ProductCreator.Query.getProduct(para, function(data) {
            if ($.isArray(data) && data.length > 0) {
                initPagination('auto', data.length, 1, para);
            } else {
                corePage.Grid.updateSettings({
                    data: []
                });
                G.tip('产品检索结果: 无数据');
            }
        }).fail(function() { G.tip('产品检索失败,请重试.', false); });
    });

    afterPageLoad(); //页面加载完成回调

    // 初始化表格&分页器
    var pageSize = initPagination('auto', 'auto', false);
    var para = { pageIndex: 1, pageSize: pageSize };
    if (corePage.CE) para.userName = G.User.getName();
    ProductCreator.Query.getProduct(para, function(data) {
        // 无数据时，创建空表格
        if (!$.isArray(data) || data.length === 0) return initGrid([], afterSelectionEnd);
        initGrid(data, afterSelectionEnd); //创建表格
        corePage.Grid.selectCell(0, 0); //默认选择第一条，触发动作
    });
}

/**
 * 初始化分页器
 * @param  {Number|String}   limit  每页行数(为'auto'时，根据页面大小计算行数)
 * @param  {Number|String}   rows   总行数(为'auto'时，一页的行数)
 * @param  {Boolean||Number}  [isFirstLoad] 初次加载第几页[false为不加载]
 * @param  {Object}   [para]      loadDataByPagination查询参数
 */
function initPagination(limit, rows, isFirstLoad, para) {
    if (limit === 'auto') limit = parseInt(($('#product-table').innerHeight() - 25) / 30 - 1);
    if (rows === 'auto') rows = limit;
    // 分页初始化
    $('#product-pager').empty().rpagination({
        limit: limit,
        pages: Math.ceil(rows / limit),
        first: isFirstLoad, //首次是否触发回调
        callback: function(rowIndexs, pageIndexs) {
            loadDataByPagination(pageIndexs[0], pageIndexs[2], para);
        }
    });
    return limit;
}

/**
 * 按页加载数据
 * @param  {Number}   pageIndex 第几页
 * @param  {Number}   pageSize  页数
 * @param  {Object}   [para]    参数
 */
function loadDataByPagination(pageIndex, pageSize, para) {
    var param = $.extend(true, {}, para, {
        pageIndex: pageIndex,
        pageSize: pageSize
    });
    // 权限
    if (corePage.CE) param.userName = G.User.getName();
    return ProductCreator.Query.getProduct(param, function(data) {
        if ($.isArray(data) && data.length > 0) {
            corePage.Grid.updateSettings({
                data: sortProductByState(data)
            });
            corePage.Grid.render();
            corePage.Grid.selectCell(0, 0);
        } else {
            corePage.Grid.updateSettings({
                data: []
            });
            G.tip('产品检索结果: 无数据');
        }
    }).fail(function() { alert('数据加载失败,请重试'); });
}

/**
 * 生成表格
 * @param  {Array}   	data              数据
 * @param  {Function}   afterSelectionEnd 选中回调
 */
function initGrid(data, afterSelectionEnd) {
    /**
     * 获取表格参数
     */
    var option = Handsontable.addon.paramize(COL_PROPS, sortProductByState(data), {
        multiSelect: false,
        fillHandle: false, //drag down to fill
        currentRowClassName: 'highlightRow', //选中css
        currentColClassName: '', //选中css
        manualColumnMove: false,
        manualRowMove: false,
        allowRemoveColumn: false,
        allowRemoveRow: true,
        contextMenu: false,
        outsideClickDeselects: false,
    });

    corePage.Grid = $('<div class="tpl-result-grid"></div>').appendTo('#product-table')
        .handsontable(option).handsontable('getInstance');

    // add hooks
    corePage.Grid.addHook('afterSelectionEnd', function(row) {
        layer.closeAll(); //关闭所有弹出层
        var current = this.getSourceDataAtRow(row);
        if (current.state === 4) showSuggest(current.id); //“未通过”显示审核意见
        if (corePage.CurrentProduct && corePage.CurrentProduct.id === current.id) return;
        corePage.CurrentProduct = current;
        corePage.CurrentProduct.ROW = row;
        displayProduct();
        afterSelectionEnd();
        corePage.FAB.open();
    });
}

/**
 * 按状态排序产品列表
 */
function sortProductByState(data) {
    var dataSorted = [],
        state_orders = corePage.CE ? PRODUCT_STATE_SORT.C : PRODUCT_STATE_SORT.E;
    state_orders.forEach(function(state) {
        data.forEach(function(product) {
            if (product.state === state)
                dataSorted.push(product);
        });
    });
    data = dataSorted;
    return dataSorted;
}

/**
 * 更新表格当前行状态Cell的值
 */
function updateStateCellOfGrid(state) {
    corePage.Grid.setDataAtCell(corePage.CurrentProduct.ROW, PRODUCT_STATE_COL, state);
}

/**
 * 预览产品
 */
function displayProduct(productId) {
    if (isNaN(productId)) productId = corePage.CurrentProduct.id;
    var container = corePage.$rightPanel.empty();

    function failed() {
        container.html('<p class="alert alert-warning" style="margin:20px;">对不起，该产品无法预览</p>')
    }
    ProductCreator.Query.getFileById(productId, 'pdf', function(pdf) {
        // FIXME 跨域
        container.append('<iframe width="100%" height="100%" style="border:none;" src="' + pdf + '"></iframe>');
        // $.get(pdf).done(function() { //PDF是否存在
        //     if (PDFObject.supportsPDFs) PDFObject.embed(pdf, container);
        //     else container.append('<iframe width="100%" height="100%" src="' + pdf + '"></iframe>');
        // }).fail(failed);
    }, failed);
}

/**
 * 新建弹出层
 */
function openPage(title, html, callback) {
    return layer.open({
        title: title || '',
        type: 1,
        skin: 'layui-layer-lan',
        content: html,
        area: '600px',
        offset: '100px',
        maxmin: true,
        scrollbar: false,
        success: callback
    });
}

/**
 * 产品制作
 */
function createProduct() {
    var html = $('#tpl_production_create').html();
    openPage('新建产品', html, initProductCreator);
}

/**
 * 产品制作派发
 */
function initProductCreator(layero, index) {
    //弹出层
    var $layero = $(layero);
    // 类型选择
    var $selectType = $layero.find('select[name="product-type"]');
    // 自定义content
    var $content = $('#product-create-content');
    // 提交按钮
    var $submitBtn = $('#product-create-submit');
    // 取消按钮
    var $cancelBtn = $('#product-create-cancel');
    /**
     * 初始化表单
     */
    function initForm(hasContent) {
        var temp = $('#tpl_production_create_form').html();
        var $form = null;
        if (!hasContent) {
            var $temp = $('<div></div>').html(temp);
            $temp.find('#product-create-form-content').remove();
            $form = $temp.find('.panel');
        } else {
            $form = $(temp);
        }
        $content.empty().append($form);
        return $form;
    }

    /**
     * 关闭弹出页
     */
    function closePage() {
        layer.close(index);
    }
    $cancelBtn.click(closePage);

    // 初始化产品类别列表
    corePage.Templates.forEach(function(template) {
        $('<option></option>')
            .val(template.TemplateCode)
            .html(template.TemplateName)
            .data('template', template)
            .appendTo($selectType);
    });
    // 按产品类型分发Handler
    $selectType.change(function(event) {
        var template = $(this).find('option:selected').data('template');
        var resolved = ProductCreator.run(this.value, {
            layer: index,
            layero: $layero,
            toolbar: $layero.find('.toolbar').empty(),
            submitBtn: $submitBtn.prop('disabled', false).off('click'),
            cancelBtn: $cancelBtn.prop('disabled', false),
            initForm: initForm,
            closePage: closePage,
            submitter: function(handler) {
                $submitBtn.off('click').click(handler);
            },
            display: function(product) { //产品展示
                corePage.Grid.updateSettings({ data: product.concat(corePage.Grid.getSourceData()) });
                // corePage.Grid.render();
                corePage.Grid.selectCell(0, 0);
            }
        }, template, corePage);
        if (resolved === false) {
            $submitBtn.prop('disabled', true);
            $content.html('<p class="alert alert-danger">该产品尚未注册，无法制作</p>');
        }
    }).change();
}


/**
 * 产品审核
 */
function reviewProduct() {
    var html = $('#tpl_production_review').html();
    openPage('审批', html, initReviewProduct);
}

/**
 * 审核逻辑
 */
function initReviewProduct(layero, index) {
    var productId = corePage.CurrentProduct.id,
        productTitle = corePage.CurrentProduct.ProductTitle,
        productTime = corePage.CurrentProduct.CreateTime,
        user = corePage.CurrentProduct.UserName,
        country = corePage.CurrentProduct.Country;
    var $layero = $(layero),
        $title = $layero.find('.page-header'),
        $textarea = $layero.find('textarea[name="productComment"]'),
        $yes = $('#product-review-yes'),
        $no = $('#product-review-no'),
        $cancel = $('#product-review-cancel');

    /**
     * 关闭弹出页
     */
    function closePage() {
        layer.close(index);
    }

    // 失败handler
    function failed() {
        G.tip('提交至服务器失败,请重试', false);
    }

    // 审核handler
    function audit(result) {
        var productComment = $textarea.val();
        ProductCreator.Query.auditProduct(productId, productComment).success(function(res) {
            if (res) ProductCreator.Query.updateProduct(productId, result).success(function(res) {
                if (!res) return failed();
                closePage();
                updateStateCellOfGrid(result);
            }).fail(failed);
            else failed();
        }).fail(failed);
    }

    // 产品信息
    $title.find('h3').html(productTitle);
    $title.find('p').html(user + '@' + country + '&nbsp;<i>' + productTime + '</i>');

    // btn click event
    $cancel.click(closePage);
    $yes.click(function() {
        audit(3);
    });
    $no.click(function() {
        audit(4);
    });
}

/**
 * 提示审核意见
 */
function showSuggest(productId) {
    ProductCreator.Query.getSuggestById(productId, function(res) {
        if (!res) return;
        var tips = [
            '<b>审核意见</b>',
            '<i style="float:right;">' + res.auditTime + '</i>',
            '<br>',
            res.suggest || ''
        ];
        layer.tips(tips.join(''), '#product-display', {
            tips: [4, '#ff5722'],
            time: false
        });
    });
}

function emptyFun() {}
