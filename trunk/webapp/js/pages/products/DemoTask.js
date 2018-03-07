/**
 * DemoTask
 * @author rexer
 * @date   2016-10-26
 */

~ function(ProductCreator) {

    // 任务定义
    var DemoTask = ProductCreator.Task.prototype.extend({
        create: function(OptUtil, template, corePage) {
            var self = this;
            var datepicker = tpl.Plugin.yearmonth(OptUtil.toolbar);
            var form = OptUtil.initForm(),
                titleInput = form.find('input[name="productTitle"]'),
                summaryInput = form.find('input[name="productSummary"]');

            //刷新按钮
            $('<button type="button" class="btn btn-primary">制作</button>').css({
                margin: '10px auto',
                width: '200px',
                display: 'block'
            }).click(init).appendTo(OptUtil.toolbar.find('.condition-content'));

            //数据
            var queryData = null;
            // 进度条
            var loader = new tpl.Plugin.loader(OptUtil.layero).show('');

            // 初始化
            function init() {

            }


            // 注册提交
            OptUtil.submitter(function() {
                if (!queryData) {
                    layer.tips('暂无数据');
                    return;
                }

                loader.show('');
                var para = {
                    productTemplateId: template.TemplateId,
                    productTitle: titleInput.val(),
                    productSummary: summaryInput.val(),
                    content: '产品内容'
                };

                ProductCreator.Query.addProduct('demoAction', para, function(product) {
                    loader.hide();
                    if (!product) return G.tip('产品添加失败,请重试', false);
                    G.tip('产品添加成功', true);
                    OptUtil.closePage();
                    OptUtil.display(product);
                });
            });

            init();
        }
    });

    // 任务注册
    ProductCreator.registerTask('demo', 'DemoTask', DemoTask);

}(ProductCreator);
