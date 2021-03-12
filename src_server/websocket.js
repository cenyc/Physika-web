const fsPromise = require('fs').promises;
const fs = require('fs');
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

const prefetchFileInfo = {
    0: ['cloud', '.vti'],
    5: ['ParticleData', '.vti']
};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        ws.binaryType = 'arraybuffer';

        const mObj = JSON.parse(message);
        console.log("mObj: ", mObj);

        if (mObj.usePrefetch) {
            const fileInfo = prefetchFileInfo[mObj.simType];
            const fileName = fileInfo[0] + '_' + mObj.frameIndex + fileInfo[1];
            const filePath = path.join(userPath, mObj.userID, mObj.uploadDate.toString(), 'sim_data', fileName);
            const queryFile = () => {
                if (fs.existsSync(filePath)) {
                    fsPromise.readFile(filePath)
                        .then(data => {
                            console.log(data.buffer);
                            //对文件进行压缩
                            const zip = new JSZip();
                            zip.file(fileName, data.buffer);
                            return zip.generateAsync({
                                type: 'arraybuffer',
                                compression: "DEFLATE",
                                compressionOptions: {
                                    level: 6
                                }
                            });
                        })
                        .then(zipData => {
                            console.log('zipData', zipData);
                            ws.send(zipData);
                        })
                        .catch(err => {
                            console.log('Error in websocket! ', err);
                            //出错如何处理？
                            ws.send([]);
                        });
                }
                else {
                    console.log("不存在");
                    setTimeout(queryFile, 1000);
                }
            }
            queryFile();
        }
        else {
            console.log("1111");
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
                            level: 6
                        }
                    });
                })
                .then(zipData => {
                    console.log('zipData', zipData);
                    ws.send(zipData);
                    //模拟网络延迟
                    // setTimeout(() => {
                    //     console.log('zipData', zipData);
                    //     ws.send(zipData);
                    // }, 7000);
                })
                .catch(err => {
                    console.log('Error in websocket! ', err);
                    //出错如何处理？
                    ws.send([]);
                });
        }


    });
});

//如何触发？
wss.on('close', function close() {
    console.log('Socket close.');
});

wss.on('error', function error(err) {
    console.log('Socket error.');
})

const port = process.env.PORT || 8888;
server.listen(port, () => {
    console.log('Listening at http://localhost:%s/index.html', port);
})