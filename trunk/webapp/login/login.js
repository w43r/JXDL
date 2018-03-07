window.onload = function() {
    var HOST = window.location.protocol + '//' + window.location.host + '/',
        name = document.querySelector('#username'),
        pwd = document.querySelector('#password'),
        login = document.querySelector('.login-btn');
    var tip = new(function() {
        var tipNode = document.querySelector('.tip');
        this.show = function(msg) {
            tipNode.innerHTML = msg;
            tipNode.style.display = 'block';
        };
        this.hide = function() {
            tipNode.style.display = 'none';
        };
    });

    window.onkeyup = function(event) {
        tip.hide();
        if (event.which === 13) login.click();
    };

    login.onclick = function(event) {
        event.preventDefault();
        tip.hide();
        var username = name.value,
            pword = pwd.value;
        if (!username || !pword) {
            tip.show('请输入用户名/密码');
            return;
        }
        if (!(/^[A-Za-z0-9_]+$/.test(username))) {
            tip.show('用户名不合法');
            return;
        }
        login.disabled = true;
        login.innerHTML = '登录中...';
        var xhr = new XMLHttpRequest();
        xhr.open('POST', HOST + 'SPDUser/services/UserService/login', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.timeout = 10000;
        xhr.onload = function() {
            if (xhr.status === 200) {
                var ret = JSON.parse(xhr.response);
                if (ret.code) window.location.href = HOST + 'CIMAS/index.html' + window.location.hash;
                else tip.show(ret.message);
            } else {
                tip.show('登录失败');
            }
        };
        xhr.onerror = function() {
            tip.show('登录失败');
        };
        xhr.ontimeout = function() {
            tip.show('登录超时');
        };
        xhr.onloadend = function() {
            login.disabled = false;
            login.innerHTML = '登录';
        };
        xhr.send('para=' + JSON.stringify({ UserName: username, PassWord: pword }));
    };

    tip.hide();
    name.focus();
};
