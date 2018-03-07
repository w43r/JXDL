# MIS

> 项目介绍和相关说明

## 代码结构

```tree

│ root
├─audio
├─css 样式输出目录
├─data 配置|数据
│  └─dataschema
├─fonts
│  └─spdfont
├─imgs
├─js
│  ├─common 公共类
│  ├─map 地图相关
│  └─pages 各页面逻辑
│     └─products 产品制作相关逻辑
├─login 登录模块
├─modules 模块|插件
│
├─sass 样式
│  ├─components 组件
│  └─pages 各页面样式
├─theme
├─tpl 模板相关
└─weathermap

```

## 开发
1. 命令
```bash

## 安装依赖
npm install

## 启动开发服务器 + sass自动编译
npm start

## 打包 sass && postcss
npm run build

```

2. dev-server配置
> 配置文件：<code>dev.conf.json</code>

- 静态资源： <code>deploy</code> 配置 发布路径 : 发布目录
- 接口代理转发： <code>proxy</code> 配置 本地接口路径 : 远程服务

## 部署
1. 发布包名为<code>MIS</code>
2. 执行`npm run build`命令
3. 需要排除文件(夹)
- `node_modules` 目录
- `sass` 目录
- `.editorconfig`
- `dev.conf.json`
- `package-lock.json`
- 其他IDE配置、日志文件等
