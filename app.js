// 引入模块
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var app = express();

// 测试ES6
// import express from 'express';
// import path from 'path';
// import ejs from 'ejs';
// var app = express();
// const __dirname = path.resolve();

// 新增接口路由
// app.get('/data/:module', function (req, res, next) {
//     var c_path = req.params.module;
//     var Action = require('./server/action/data/' + c_path);
//     Action.execute(req, res);
// });

app.get('/aa', function (req, res) {
    res.send("this is aa");
});

// 设置views路径和模板
app.set('views', './static/view');
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

// app.use配置
//把static设置为静态资源文件夹，可以让浏览器访问
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// 对所有(/)URL或路由返回index.html
app.get('/', function (req, res) {
    // const view = require('./static/view/index.html');
    res.render('index');
});

// 启动一个服务，监听从8888端口进入的所有连接请求
var server = app.listen(8888, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://localhost:%s', port);
});