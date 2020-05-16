// 引入模块
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var app = express();

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
    const path = '/home/cenyc/'+req.files[0].path
    const execSync = require('child_process').execSync;
    const output = execSync('python src/test.py -p '+path)

    res.send('上传成功')
})

app.get('/python', function (req, res) {
    const execSync = require('child_process').execSync;

    const output = execSync('python src/test.py')
    console.log('sync: ' + output.toString())
    console.log('over')
    res.send('sync: ' + output.toString());
});

// 设置views路径和模板
app.set('views', './static/view');
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);

// app.use配置
//把static设置为静态资源文件夹，可以让浏览器访问
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// app.use('/', function (req, res, next) {
//     console.log('app get');
//     next();
// });

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