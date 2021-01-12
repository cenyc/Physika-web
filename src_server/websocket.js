const fsPromise = require('fs').promises;
const JSZip = require('jszip');
const path = require('path');

const WSServer = require('ws').Server;
const server = require('http').createServer();
const app = require('./app');

const wss = new WSServer({
    server: server,
});
server.on('request', app);

const userPath = path.join(__dirname, '../data/user_file');

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        ws.binaryType = 'arraybuffer';

        const mObj = JSON.parse(message);
        console.log("mObj: ", mObj);
        const filePath = path.join(userPath, mObj.userID, mObj.uploadDate.toString(), 'sim_data', mObj.fileName);

        fsPromise.readFile(filePath)
            .then(data => {
                console.log(data.buffer);
                //对文件进行压缩
                const zip = new JSZip();
                zip.file(mObj.fileName, data.buffer);
                return zip.generateAsync({
                    type: 'arraybuffer',
                    compression: "DEFLATE",
                    compressionOptions: {
                        level: 9
                    }
                });
            })
            .then(zipData => {
                //模拟网络延迟
                if (Math.random() > 0.5) {
                    console.log('zipData', zipData);
                    ws.send(zipData);
                }
                else {
                    setTimeout(() => {
                        console.log('zipData', zipData);
                        ws.send(zipData);
                    }, 7000);
                }
            })
            .catch(err => {
                console.log('Error in websocket! ', err);
                //出错如何处理？
                ws.send([]);
            });
    });
});

//如何触发？
wss.on('close', function close() {
    console.log('Socket close.');
});

wss.on('error',function error(err){
    console.log('Socket error.');
})

const port = process.env.PORT || 8888;
server.listen(port, () => {
    console.log('Listening at http://localhost:%s/index.html', port);
})