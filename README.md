# Physika-web  

# 配置安装
//Todo d

# 问题记录

## API
+ [ParaViewWeb api](https://kitware.github.io/paraviewweb/api/)
+ [Webpack文档](https://webpack.docschina.org/guides/)
***
## ES6 and CommonJS
+ 如果使用commonjs模式，在packge.json中加入
>
  "type": "module",
  
  
+ 自定义module（commonjs规范）
```
function test(req, res) {
    console.log('finish');
    res.end();
}
module.exports.test = test;
```


+ 一定要搞清楚什么是**ES6**和**commonjs**，ES6是浏览器运行的js，commonjs是node端可以直接运行的js。通常用mjs表示ES6规范，以此加以区分。
```
ES6--以module为标准--以export导出接口--以import引入模块；
commonjs--以module.exports导出--以require引入模块；
```


+ [import和require的区别](https://imweb.io/topic/582293894067ce9726778be9)、[使用](https://www.jianshu.com/p/ce92a09ad6eb)。


+ 直接在终端运行mjs要添加"--es-module-specifier-resolution=node"
> node --es-module-specifier-resolution=node test.mjs


+ 在CommonJS规范的代码中使用ES6 module
```
第一步：安装babel
 npm install @babel/core @babel/register @babel/preset-env --save-dev

第二步：编写fun.mjs
function aa() {
    console.log('this is aa write in ES6');
}

function bb() {
    console.log('this is bb write in ES6');
}
export {aa,bb}

第三步：编写start.js，使用babel转换fun.mjs
require('@babel/register')({
    presets: ['@babel/preset-env']
});

module.exports = require('./fun');

第四步：在CommonJS中require需要的模块，并调用
var start = require('./src/start');
start.aa();
start.bb();
```


***
## express


+ express中，结束访问要添加
> res.end();
