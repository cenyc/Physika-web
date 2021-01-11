const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

const WSServer = require('ws').Server;
let server = require('http').createServer();
let app = require('./app');
let wss = new WSServer({
  server: server
});
server.on('request', app);

const VDPath = path.join(__dirname, '../data/visualize_data');

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    ws.binaryType = 'arraybuffer';

    let messageObj = JSON.parse(message);
    console.log("messageObj: ", messageObj);

    fs.readFile(VDPath + '/' + messageObj.fileName, null, function (err, data) {
      if (err) {
        console.log(err);
      }
      console.log(data.buffer);
      //对文件进行压缩
      const zip = new JSZip();
      zip.file(messageObj.fileName, data.buffer);
      zip.generateAsync({
        type: 'arraybuffer',
        compression: "DEFLATE",
        compressionOptions: {
          level: 9
        }
      }).then(res => {
        if (Math.random() > 0.5) {
          console.log('res', res);
          ws.send(res);
        }
        else {
          setTimeout(() => {
            console.log('res', res);
            ws.send(res);
          }, 7000);
        }
      })
      /*
      if (Math.random() > 0.5) {
        ws.send(data.buffer);
      }
      else {
        setTimeout(() => {
          ws.send(data.buffer);
        }, 5000);
      }
      */

    });
  });
});

//如何触发？
wss.on('close', function close() {
  console.log('Socket close.');
});


const port = process.env.PORT||8888;
server.listen(port,()=>{
  console.log('Listening at http://localhost:%s/index.html', port);
})
/*
server.listen(8888, function () {
  var port = server.address().port;
  console.log('Listening at http://localhost:%s', port);
});
*/