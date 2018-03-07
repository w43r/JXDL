/**
 * 用户页面
 * @author rexer
 * @date   2016-07-05
 */

var corePage;

var run = function() {
    corePage = new tpl('user').ready(function() {
        this.Alert = new tpl.Plugin.alert(this.$page);
        var userHandler = new UserHandler();
        var menu = [{
            text: '我的资料',
            value: 'm1',
            handler: function() {
                this.animated();
                this.$page.empty();
                this.$page.html($('#tpl_user_profile').html());
                userHandler.init().refresh();
            }
        }];
        if (G.User.getAuthority().A) {
            menu.push({
                text: '用户管理',
                value: 'm2',
                handler: function() {
                    this.animated();
                    this.$page.empty();
                    this.$page.html($('#tpl_user_manage').html());
                    this.$panel = $('#user-table');
                    this.$panel.outerHeight(this.$page.find('#user-panel').innerHeight() - this.$page.find('.panel-heading').outerHeight());
                    var handler = new AdminHandler();
                    var $sync = $('.operator.sync');
                    var $ctrl = $('.operator.ctrl');
                    var $this, operator, operatorCN;

                    //operator listener
                    $('.operator').click(function() {
                        $this = $(this);
                        operator = $this.attr('data-ctrl');
                        operatorCN = $this.html();
                    }).click(function(event) {
                        if (!$this.hasClass('ctrl')) return;
                        event.stopImmediatePropagation();
                        $ctrl.prop('disabled', true);
                        $sync.prop('disabled', false);
                        try {
                            handler.Operation[operator]([operator, operatorCN]);
                        } catch (e) {
                            $this.prop('disabled', false);
                            $sync.first().prop('disabled', true);
                        }
                    }).click(function(event) {
                        handler.Operation[operator]([operator, operatorCN]);
                    });
                    handler.Operation.refresh();
                }
            });
        }
        this.menu(menu);
    });
};

var UserHandler = function() {
    this.init = function() {
        var that = this;
        var $toolbar = $('.user-toolbar'),
            $modify = $toolbar.find('.modify'),
            $confirm = $toolbar.find('.confirm'),
            $cancel = $toolbar.find('.cancel'),
            $change = $toolbar.find('.change'),
            $profile = $('#profile').find('input.profile.writable');
        var change = false;
        var validate = function() {
            var state = true;
            $profile.each(function() {
                var $this = $(this),
                    key = $this.attr('name'),
                    val = $this.val(),
                    name = $this.html();
                var valid = validator(key, val);
                if (!valid.state) {
                    G.tip(valid.msg.replace(new RegExp('{' + key + '}', 'g'), name), valid.state);
                    state = false;
                    return false;
                }
            });
            return state;
        };
        var getPara = function() {
            var para = { UserName: G.User.getName() };
            $profile.each(function() {
                var $this = $(this);
                para[$this.attr('name')] = $this.val();
            });
            return para;
        };
        $change.click(function(event) {
            G.User.changePwd();
        });
        $modify.click(function(event) {
            $profile.prop('readonly', false);
            $modify.prop('disabled', true);
            $confirm.prop('disabled', false);
            $cancel.prop('disabled', false);
        });
        $profile.change(function(event) {
            change = true;
        });
        $confirm.click(function(event) {
            if (change && validate()) {
                var ret = G.User.update(getPara());
                G.tip(ret.message, ret.code);
                if (!ret.code) return;
            }
            $cancel.click();
        });
        $cancel.click(function(event) {
            $profile.prop('readonly', true);
            $modify.prop('disabled', false);
            $confirm.prop('disabled', true);
            $cancel.prop('disabled', true);
            that.refresh();
        });
        return this;
    };

    this.refresh = function() {
        var $profile = $('#profile');
        var $AB = $profile.find('input.authority[name="B"]');
        var $AD = $profile.find('input.authority[name="D"]');
        var auth = G.User.getAuthority();

        $AB.val(auth.B ? '浏览全市' : '浏览本地');
        $AD.val(auth.D ? '下载全市' : '下载本地');

        G.User.getUser(function(data) {
            if (tpl.ext.isExpectedType(data.data)) {
                var profile = data.data[0] || data.data;
                for (var key in profile) {
                    $profile.find('input[name="' + key + '"]').val(profile[key]);
                }
            } else corePage.Alert.show('无法获取您的资料...');
        }, function() {
            corePage.Alert.show('无法获取您的资料...');
        });
    };
};

var AdminHandler = function() {
    var that = this,
        operator = null,
        operatorCN = null,
        currentRow = null,
        tableInstance = null,
        tableUtil = new Handsontable.addon.Util();

    var $sync = $('.operator.sync');
    var $ctrl = $('.operator.ctrl');

    var getSelectedRow = function() {
        var selection = tableInstance.getSelected();
        if ($.isArray(selection) && selection.length === 4) {
            currentRow = selection[0];
            return currentRow;
        }
        currentRow = null;
        G.tip('请先选择某一用户后,再进行操作...', null, {
            confirm: function() {
                that.Operation.reset();
            }
        });
        throw new Error('no selection of table');
    };

    var syncOperation = function(para, callback) {
        var sync = G.UAC[operator];
        var result = sync(para || tableInstance.getSourceDataAtRow(getSelectedRow()));
        if (result.code) {
            if (callback) callback(result.data);
            G.tip('<b>' + operatorCN + '</b>操作成功！', true);
            tableUtil.setRowMeta(currentRow, { readOnly: true });
            $ctrl.prop('disabled', false);
            $sync.prop('disabled', true);
            updateOperator();
        } else {
            G.tip('<b>' + operatorCN + '</b>操作失败,' + result.message + ',请重试！', false);
            $sync.prop('disabled', false);
        }
        currentRow = null;
    };
    var updateOperator = function(newOps) {
        newOps = newOps || [null, null];
        operator = newOps[0];
        operatorCN = newOps[1];
        //tip
        $('.user-ctrl-tip').html(typeof currentRow == 'number' && operator ? '当前操作：<b>' + operatorCN + '&nbsp;' + tableInstance.getDataAtCell(currentRow, 1) + '<sup>行' + (currentRow + 1) + '</sup></b>' : '<i>支持快捷键</i>');
    };
    var setRowWritable = function(row) {
        row = row || getSelectedRow();
        tableUtil.setRowMeta(row, { readOnly: false });
        tableInstance.setCellMetaObject(row, 0, { readOnly: true });
    };
    this.getOperator = function() {
        return [operator, operatorCN];
    };
    this.getCurrentRow = function() {
        return currentRow;
    };
    this.Operation = {
        select: function(row) {
            tableUtil.selectRow(row || currentRow);
        },
        reset: function() {
            currentRow = null;
            updateOperator();
            $sync.prop('disabled', true);
            $ctrl.prop('disabled', false);
        },
        insert: function(op) {
            currentRow = tableInstance.countRows();
            tableInstance.alter('insert_row', currentRow);
            setRowWritable(currentRow);
            tableInstance.selectCell(currentRow, 1, currentRow, 1, true);
            $sync.prop('disabled', false);
            updateOperator(op);
        },
        delete: function(op) {
            var user = tableInstance.getSourceDataAtRow(getSelectedRow());
            updateOperator(op);
            G.confirm('是否删除<b>' + user.UserName + '</b>用户?', function(ret) {
                if (ret) syncOperation({ UserName: user.UserName }, function(ret) {
                    tableInstance.alter('remove_row', currentRow);
                });
                else that.Operation.reset();
            });
        },
        update: function(op) {
            setRowWritable();
            updateOperator(op);
            // tableInstance.setCellMetaObject(getSelectedRow(), 2, { readOnly: true });
            // tableInstance.setCellMetaObject(currentRow, 3, { readOnly: true });
            $sync.prop('disabled', false);
        },
        pwd: function(op) {
            var user = tableInstance.getSourceDataAtRow(getSelectedRow());
            updateOperator(op);
            G.UAC.changePwd(user.UserName, function(ret) {
                that.Operation.reset();
            });
        },
        authority: function(op) {
            var username = tableInstance.getSourceDataAtRow(getSelectedRow()).UserName;
            var element; //权限
            updateOperator(op);
            G.confirm($('#tpl_user_auth').html(), function(ret) {
                if (!ret) return;
                var B = this.$content.find('.switch-btn[name="BROWSEALL"]').parent().parent('.bootstrap-switch').hasClass('bootstrap-switch-on');
                var D = this.$content.find('.switch-btn[name="DOWNLOADALL"]').parent().parent('.bootstrap-switch').hasClass('bootstrap-switch-on');
                var C = this.$content.find('.switch-btn[name="CREATEPRODUCT"]').parent().parent('.bootstrap-switch').hasClass('bootstrap-switch-on');
                var E = this.$content.find('.switch-btn[name="AUDIT"]').parent().parent('.bootstrap-switch').hasClass('bootstrap-switch-on');
                var codes = [
                    { AuthorityCode: B ? 'BROWSEALL' : 'BROWSEAREA' },
                    { AuthorityCode: D ? 'DOWNLOADALL' : 'DOWNLOADAREA' }
                ];
                if (C) { codes.push({ AuthorityCode: 'CREATEPRODUCT' }); }
                if (E) { codes.push({ AuthorityCode: 'AUDIT' }); }
                syncOperation({
                    UserName: username,
                    AuthorityCodes: codes
                });
            }, {
                onOpen: function() {
                    var jc = this;
                    jc.setTitle('权限管理 - ' + username);
                    G.UAC.getAuthorityByUserName({ UserName: username }, function(data) {
                        data.data.forEach(function(item) {
                            jc.$content.find('.switch-btn[name="' + item.AuthorityCode + '"]').prop('checked', true);
                        });
                        var $B = jc.$content.find('.switch-btn[name="BROWSEALL"]'),
                            $D = jc.$content.find('.switch-btn[name="DOWNLOADALL"]');

                        $B.on('switchChange.bootstrapSwitch', function(event, state) {
                            if (!state && $D.parent().parent('.bootstrap-switch').hasClass('bootstrap-switch-on')) {
                                $D.bootstrapSwitch('state', false, true);
                            }
                            $D.bootstrapSwitch('disabled', !state, true);
                        });
                        $D.on('switchChange.bootstrapSwitch', function(event, state) {
                            if (state && $B.parent().parent('.bootstrap-switch').hasClass('bootstrap-switch-off')) {
                                $D.bootstrapSwitch('state', false, true).bootstrapSwitch('disabled', true, true);
                            }
                        });

                        jc.$content.find('.switch-btn').bootstrapSwitch({
                            onColor: 'warning',
                            offColor: 'info'
                        });
                    });
                },
                onClose: function() {
                    that.Operation.reset();
                }
            });
        },
        confirm: function() {
            if (operator === 'insert') {
                var user = tableInstance.getSourceDataAtRow(getSelectedRow());

                var html = $('#tpl_user_changepwd').html();
                var $temp = $('<div></div>');
                $temp.append(html).find('.pwd_old').remove();
                G.confirm($temp.html(), function(ret) {
                    if (!ret) return;
                    var $pwd = this.$content.find('input[name="password"]'),
                        $confirm = this.$content.find('input[name="pwd_confirm"]');
                    if (!$pwd.val() || !$confirm.val()) {
                        G.tip('请输入完整,不能为空', false);
                        return false;
                    }
                    if ($pwd.val() != $confirm.val()) {
                        G.tip('两次密码输入不一致', false);
                        return false;
                    }
                    user.PassWord = $pwd.val();
                    syncOperation(user, function(data) {
                        tableInstance.setDataAtCell(currentRow, 0, data);
                    });
                }, { title: '初始密码 - ' + user.UserName, cancelButton: false });
            } else {
                syncOperation();
            }

        },
        cancel: function() {
            this.refresh();
        },
        refresh: function() {
            var loader = new tpl.Plugin.loader(corePage.$panel).show('正在刷新页面...');
            currentRow = null;
            G.UAC.getUsers(function(data) {
                var profile = data.data;
                loader.destroy();
                that.Operation.reset();
                if (tpl.ext.isExpectedType(profile)) {
                    var username = G.User.getName();
                    $.each(profile, function(i, item) {
                        if (item.UserName === username) {
                            profile.splice(i, 1);
                            return false;
                        }
                    });
                    that.initGrid(profile);
                } else {
                    that.initGrid([]);
                }
            }, function() {
                loader.destroy();
                corePage.Alert.show('无法获取用户数据...');
            });
        }
    };

    this.initGrid = function(profiles) {
        tableInstance = corePage.grid([
            { title: 'UID', data: 'id', readOnly: true },
            { title: '用户名', data: 'UserName', readOnly: true },
            { title: '地区', data: 'Country', readOnly: true, editor: 'station', dataType: 'data-name', dataSync: [3] },
            { title: '区域代码', data: 'AreaCode', readOnly: true, editor: 'station', dataType: 'data-area', dataSync: [2] },
            { title: '电话', data: 'Tel', readOnly: true },
            { title: 'E-Mail', data: 'EMail', readOnly: true }
        ], profiles, {
            multiSelect: false,
            fillHandle: false, //drag down to fill
            currentRowClassName: 'highlightRow', //选中css
            currentColClassName: '', //选中css
            manualColumnMove: false,
            manualRowMove: false,
            allowRemoveColumn: false,
            allowRemoveRow: true,
            contextMenu: false,
            dropdownMenu: ['filter_by_condition', 'filter_action_bar', '---------', 'filter_by_value'],
            outsideClickDeselects: false,
            minSpareCols: 0,
            enterMoves: { row: 0, col: 1 },
            pagination: false //不分页
        });
        tableInstance.addHook('afterSelectionEnd', function(row) {
            if (currentRow && row !== currentRow) {
                tableInstance.selectCell(currentRow, 1, currentRow, 1, true);
            }
        });
        tableInstance.addHook('afterChange', function(changes, source) {
            var change = changes[0],
                row = change[0],
                prop = change[1],
                oldVal = change[2],
                newVal = change[3];
            if (newVal === oldVal || /id|Country|AreaCode/.test(prop)) return;
            if (source === 'edit' || source === 'paste') {
                var valid = validator(prop, newVal);
                if (!valid.state) {
                    G.tip(valid.msg.replace(new RegExp('{' + prop + '}', 'g'), name), valid.state);
                    tableInstance.setDataAtRowProp(row, prop, oldVal, 'validate');
                }
            }
        });
        tableUtil.setInstance(tableInstance);
    };
};

/**
 * 输入校验
 */
var validator = function(key, val) {
    switch (key) {
        case 'UserName':
            var valid = !!val,
                msg = '用户名不能为空！';
            if (valid) {
                valid = /^[A-Za-z0-9_]+$/.test(val);
                msg = '非法字符,只支持字母、数字、下划线！';
                if (valid) {
                    valid = G.UAC.verifyName(val);
                    msg = '用户名已存在！';
                }
            }
            return { state: valid, msg: msg };
        case 'EMail':
            return {
                state: !val || /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(val),
                msg: '您输入的E-Mail地址不合法！'
            };
        case 'Tel':
            return {
                state: !val || /^0?(13[0-9]|15[012356789]|18[0236789]|14[57])[0-9]{8}$/.test(val),
                msg: '您输入的手机号码不合法！'
            };
        default:
            return {
                state: !!val,
                msg: '{' + key + '}不能为空！'
            };
    }
};
