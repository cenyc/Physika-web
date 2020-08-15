// 引入模块
const express = require('express');
const path = require('path');
const ejs = require('ejs');
//引入body-parser用于解析post的body
const bodyParser = require('body-parser');
//
const { spawn } = require('child_process');
//加载xml
const xml2js = require('xml-js');
const fs = require('fs');

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

app.post('/loadConfig', jsonParser, function (req, res) {
    if(!req.body){
        return res.sendStatus(400);
    }
    else{
        let reqInitConfig = req.body;
        console.log(reqInitConfig);

        //加载xml并解析为json
        let xml = fs.readFileSync('./Doc/test.xml','utf-8');
        let options = {compact: true, ignoreComment: true};
        let result = xml2js.xml2js(xml,options);
        console.log(result);
        res.json(result);

        /*
        //调用python
        let getData;
        const callPython = spawn('python', ['./src/test.py']);
        callPython.stdout.on('data', function(data){
            getData = data.toString();
            console.log(getData);
        });
        callPython.on('close',(code) => {
            console.log(`child process close all stdio with code ${code}`);
            res.send(getData);
        });
        */
    }

})

app.post('/uploadConfig', jsonParser, function (req, res){
    if(!req.body){
        return res.sendStatus(400);
    }
    else{
        let configData = req.body;
        console.log(configData);

        //将json转化为xml并写文件
        let options ={compact:true,ignoreComment:true,spaces:4};
        let xml = xml2js.json2xml(configData,options);
        fs.writeFile('./Doc/output.xml',xml,(err)=>{
            if(err){
                return console.error(err);
            }
        });
        //返回json对象
        res.json(configData);

    }
})

//引入multer
const multer = require('multer');

const storage = multer.diskStorage({
    // destination:'public/uploads/'+new Date().getFullYear() + (new Date().getMonth()+1) + new Date().getDate(),
    destination: './uploads/' + new Date().getFullYear() + (new Date().getMonth() + 1) + new Date().getDate(),
    filename(req, file, cb) {
        const filenameArr = file.originalname.split('.');
        cb(null, Date.now() + '.' + filenameArr[filenameArr.length - 1]);
    }
});

const upload = multer({storage});

app.use('/upload',upload.any());
//在req.files中获取文件数据
app.post('/upload',function(req, res){
    /*
    const path = '/home/cenyc/Sources/Physika-web/'+req.files[0].path
    const execSync = require('child_process').execSync;
    const output = execSync('cd /home/cenyc/Sources/PhysIKA/build/bin/Release && python app_elasticity.py -p '+path)
    console.log('sync: ' + 'cd /home/cenyc/Sources/PhysIKA/build/bin/Release && python app_elasticity.py -p '+path)
    */
    res.send('上传成功')
})
/*
app.get('/python', function (req, res) {
    const execSync = require('child_process').execSync;

    const output = execSync('python src/test.py')
    console.log('sync: ' + output.toString())
    console.log('over')
    res.send('sync: ' + output.toString());
});
*/
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
    console.log('index...');
    // const view = require('./static/view/index.html');
    res.render('index');
});

// 启动一个服务，监听从8888端口进入的所有连接请求
var server = app.listen(8888, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://localhost:%s', port);
});