/**
 * 产品制作类
 * @author rexer
 * @date 2016-10-26
 */
var ProductCreator;
~ function(clazz) {
    /**
     * 产品制作基类
     */
    var ProductCreatorClass = clazz({
        init: function() {
            // 产品类别字典
            this._TASK_DICT_ = {};
        },
        /**
         * 注册产品
         * @param  {[type]}   productType 产品类别
         * @param  {[type]}   taskName    任务名称|描述
         * @param  {[type]}   taskHandler 任务Handler
         */
        registerTask: function(productType, taskName, taskHandler) {
            if (!taskHandler.prototype.create) {
                throw new Error('注册失败,产品代码:' + productType);
            }
            // TASK属性
            taskHandler.prototype.TASK = { code: productType, description: taskName };
            // 插入字典
            this._TASK_DICT_[productType] = {
                name: taskName,
                handler: taskHandler
            };
        },
        /**
         * 产品制作分发
         * @param  {[type]}   productType 产品类别
         * @param handler接收参数
         */
        run: function(productType) {
            var task = this._TASK_DICT_[productType];
            if (!task) {
                console.warn('该类型产品未注册,产品代码:' + productType);
                return false;
            }
            var args = Array.prototype.slice.call(arguments, 1);
            var TaskHandler = new task.handler();
            TaskHandler.create.apply(TaskHandler, args);
        }
    });

    // 全局唯一实例
    ProductCreator = new ProductCreatorClass();

    /**
     * 产品制作任务基类
     */
    ProductCreator.Task = clazz({
        // 初始化
        init: function() {
            this.log('初始化', 'info');
        },
        // 制作入口
        create: function() {
            this.log('Empty creator!', 'warn');
        },
        log: function(msg, type) {
            var logger = console[type || 'log'];
            logger.call(console, 'ProductCreator.Task::' + this.TASK.description + '[' + this.TASK.code + '], ' + msg);
        },
        /**
         * 静默生成统计图
         * @author rexer
         * @date   2016-12-02
         * @param  {Object}   options HChart参数
         * @return {Deferred}
         */
        chartMuse: function(options) {
            // Deferred对象
            var defer = $.Deferred();

            // 图片大小
            var IMG_WIDTH = 1000,
                IMG_HEIGHT = 500;

            var container = $('.body');
            // 生成元素id
            var id = 'chart-' + new Date().valueOf();
            var chartElement = $('<div id="' + id + '" class="chart-generate"></div>').css({
                display: 'none',
                width: IMG_WIDTH / 2,
                height: IMG_HEIGHT / 2
            });
            container.append(chartElement);

            // 默认着色
            options.series = ChartControl.color(options.series);
            // 默认开启标注
            var labels = { dataLabels: { enabled: true } };
            // 生成chart
            var instance = Highcharts.chart(id, $.extend(true, {}, ChartControl.defaults, {
                tooltip: { enabled: false },
                credits: { enabled: false },
                title: { text: false },
                plotOptions: {
                    column: labels,
                    spline: labels,
                    areaspline: labels
                }
            }, options));
            // 转为图片
            instance.convertImage(function(dataURI) {
                // 销毁
                instance.destroy();
                chartElement.remove();
                // 标记解决
                defer.resolve(dataURI);
            });

            // 返回promise对象
            return defer.promise();
        },

        /**
         * 静默Surfer出图
         * @param  {Array}    data     数据
         * @param  {Object}   options  参数
         * @return {Deferred}
         */
        surferMuse: function(data, options) {
            // Deferred对象
            var defer = $.Deferred();
            // 容错标记解决状态
            function failed() {
                defer.resolve(null);
            }
            // 标记解决
            function done(res) {
                defer.resolve(res);
            }

            if (!G.isPretty(data)) {
                defer.resolve(null);
                return defer.promise();
            }

            // 默认全市
            var bounds = [105.2901, 28.1607, 110.1994, 32.2098];
            var areaCode = '500000';
            // 数据键值
            var dataSchema = {};
            if (options.hasOwnProperty('dataSchema')) {
                dataSchema = options.dataSchema;
                delete options.dataSchema;
            }
            // surfer参数
            var surferPara = $.extend({
                xMin: bounds[0],
                yMin: bounds[1],
                xMax: bounds[2],
                yMax: bounds[3],
                areaCode: areaCode
            }, options);
            // 实例
            var SC = new SurferControl(this.$panel, surferPara);

            SC.dealWiz(data, dataSchema) // 处理数据
                .then(SC.surfer.bind(SC), failed) // 出图,返回URL
                .then(function(imageURL) { // 读取图片
                    G.image2DataURI(imageURL, done, failed);
                }, failed);

            return defer.promise();
        }
    });

    /**
     * 查询相关
     */
    ProductCreator.Query = {
        // 添加产品
        addProduct: function(action, para, success) {
            return ProductCreator.Query.post('ProductService/' + action, $.extend(true, {
                userName: G.User.getName()
            }, para), success);
        },
        // 获取产品
        getProduct: function(para, success) {
            return ProductCreator.Query.post('ProductService/getProduct', para, success);
        },
        // 更改状态
        updateProduct: function(productId, state) {
            return ProductCreator.Query.post('ProductService/updateProductState', { productId: productId, state: state });
        },
        // 审核
        auditProduct: function(productId, suggest) {
            return ProductCreator.Query.post('ProductService/auditProduct', {
                productId: productId,
                userName: G.User.getName(),
                suggest: suggest
            });
        },
        removeProduct: function(productId) {
            return ProductCreator.Query.post('ProductService/deleteProduct', {
                productId: productId
            });
        },
        // 通过产品ID获取文件URL
        getFileById: function(id, fileType, success, fail) {
            return ProductCreator.Query.post('ProductService/getProductFileById', { productId: id }, function(files) {
                if (G.isPretty(files)) {
                    for (var i = files.length; i--;) {
                        var file = files[i];
                        if (file.Category === fileType) {
                            success(G.URL.getProductHost() + file.WebPath);
                            return;
                        }
                    }
                }
                if (fail) fail(false);
            }).fail(fail);
        },
        // 文件下载
        download: function(productId, fileType, fail) {
            fileType = fileType || 'doc';
            ProductCreator.Query.getFileById(productId, fileType, function(url) {
                var filename = url.substr(url.lastIndexOf('/') + 1);
                G.downloading(url, filename);
            }, fail);
        },
        // 获取审核修改意见
        getSuggestById: function(productId, success) {
            return ProductCreator.Query.post('ProductService/getSuggestByProductId', { productId: productId }, success);
        },
        // 获取产品模版（类型）
        getAllTemplate: function(success) {
            return ProductCreator.Query.post('ProductTemplateService/getAllTemplate', null, success);
        },
        // POST
        post: function(service, para, success) {
            return $.post(G.URL.getProductManager() + service, G.paramize(para), success);
        }
    };

}(clazz);
