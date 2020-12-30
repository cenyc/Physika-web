const fs = require('fs');
const path = require('path');

const WSServer = require('ws').Server;
let server = require('http').createServer();
let app = require('./app');
let wss = new WSServer({
    server: server
});
server.on('request', app);

const VDPath=path.join(__dirname, '../data/visualize_data');

wss.on('connection', function connection(ws) {
 
    ws.on('message', function incoming(message) {
      
      console.log(`received: ${message}`);
      mObj=JSON.parse(message);
      ws.binaryType='arraybuffer';
      
      fs.readFile(VDPath+'/'+'head-binary-zlib.vti',null,function(err,data){
        if(err){
          console.log(err);
        }
        console.log(data.buffer);
        ws.send(data.buffer);
      })
    });
  });

server.listen(8888, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:%s', port);
})