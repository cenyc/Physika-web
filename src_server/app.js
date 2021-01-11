// 引入模块
const express = require('express');
const path = require('path');
//引入body-parser用于解析post的body
const bodyParser = require('body-parser');
//开启子线程调用python
const { spawn } = require('child_process');
//加载xml
const xml2js = require('xml-js');
const fs = require('fs');
//用于存储用户上传文件
const multer = require('multer');

const app = express();
// create application/json parser
const jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

/*
app.post('/login', urlencodedParser, function (req, res) {
    res.send('welcome, ' + req.body.username)
})
*/
//读取路径配置文件
const pathConfigFileName = path.join(__dirname, 'pathconfig.json');

app.post('/loadConfig', jsonParser, function (req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }
    let reqBody = req.body;
    console.log('/loadConfig: \nreqBody: ', reqBody);
    //读取路径配置文件
    fs.readFile(pathConfigFileName, 'utf-8', function (err, data) {
        if (err) {
            console.log("Error: ", err)
            res.json({ err: err });
        }
        //将json转化为js对象
        let config = JSON.parse(data);
        //通过key获取对象的value：若key是变量，则只能使用obj[key]；
        //若key是唯一固定值，则可以使用obj['key']或obj.key。
        //获取初始化文件路径
        let initConfigFileName = config[reqBody.simType].initConfigFileName;
        //加载xml并解析为json
        let xml = fs.readFileSync(initConfigFileName, 'utf-8');
        let options = { compact: true, ignoreComment: true };
        let result = xml2js.xml2js(xml, options);
        console.log('result:', result);
        res.json(result);
        console.log('---------------');
    });
})



//上传配置的同时调用python
app.post('/uploadConfig', jsonParser, function (req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }
    console.log('/uploadConfig: \nreq.body: ', req.body);
    const extraInfo = req.body.extraInfo;
    const jsonObj = req.body.jsonObj;

    //将json转化为xml并写文件
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    const xml = xml2js.json2xml(jsonObj, options);

    //读配置文件
    fs.readFile(pathConfigFileName, 'utf-8', function (err, data) {
        if (err) {
            console.log("Error: ", err)
            res.json({ err: err });
        }
        const config = JSON.parse(data);
        const userPath = config.userPath;
        const callPythonFileName = config[extraInfo.simType].callPythonFileName;
        //用户路径
        const userDir = path.join(userPath, extraInfo.userID);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }
        //上传时间路径
        const uploadDateDir = path.join(userDir, extraInfo.uploadDate.toString());
        fs.mkdirSync(uploadDateDir);
        //上传仿真配置文件
        const uploadConfigFileName = path.join(uploadDateDir, 'upload_config_file.xml');
        //仿真数据存储路径
        const simDataDir = path.join(uploadDateDir, 'sim_data');
        fs.mkdirSync(simDataDir);
        //上传文件目录，可能不存在
        const uploadFileDir = path.join(uploadDateDir, 'upload_file');

        fs.writeFile(uploadConfigFileName, xml, err => {
            if (err) {
                console.log("Error: ", err)
                res.json({ err: err });
            }
            //如果写成功则调用对应python脚本
            //spawn第二个参数是一个数组（array[0]:python脚本路径，array[1]:接受的第一个参数）
            let simConfigFileName;
            const callPython = spawn('python', [callPythonFileName, uploadConfigFileName, uploadFileDir, uploadDateDir, simDataDir]);
            callPython.stdout.on('data', function (data) {
                //当脚本在控制台打印内容并返回收集输出数据的缓冲区时，将发出此事件
                //为了将缓冲区数据转换为可读形式，使用了toString()。
                simConfigFileName = data.toString();
            });
            callPython.on('close', (code) => {
                //当子进程的stdio流已关闭时，发出'close'事件，
                //此时再将所有数据传给浏览器
                console.log(`child process close all stdio with code ${code}`);
                console.log('simConfigFileName: ', simConfigFileName);
                //加载模拟返回的xml并解析为json
                fs.readFile(simConfigFileName, 'utf-8', function (err, data) {
                    if (err) {
                        console.log("Error: ", err)
                        res.json({ err: err });
                    }
                    let xml = data;
                    let options = { compact: true, ignoreComment: true };
                    let result = xml2js.xml2js(xml, options);
                    res.json(result);
                    console.log('---------------');
                });
            });
        });
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const extraInfo = req.body;
        //如何捕获这里的错误？
        fs.readFile(pathConfigFileName, 'utf-8', function (err, data) {
            if (err) {
                console.log(err);
            }
            const config = JSON.parse(data);
            const userPath = config.userPath;
            const userDir = path.join(userPath, extraInfo.userID);
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir);
            }
            const uploadFileDir = path.join(userDir, 'upload_file');
            if (!fs.existsSync(uploadFileDir)) {
                fs.mkdirSync(uploadFileDir);
            }
            cb(null, uploadFileDir);
        });
    },
    filename: function (req, file, cb) {
        const extraInfo = req.body;
        cb(null, extraInfo.uploadDate + '_' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/uploadFile', upload.any(), function (req, res, next) {
    const files = req.files;
    if (!files) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(files)
});

app.use(express.static(path.join(__dirname, '../dist')));

/*
// 对所有(/)URL或路由返回index.html
app.get('/sdd', function (req, res) {
    console.log('index...');
    //res.sendFile(path.join(__dirname, '../dist/index.html'))
});
*/
/*
// 启动一个服务，监听从8888端口进入的所有连接请求
var server = app.listen(8888, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://localhost:%s', port);
});
*/

module.exports = app;