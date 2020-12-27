const WSServer = require('ws').Server;
let server = require('http').createServer();
let app = require('./app');
let wss = new WSServer({
    server: server
});
server.on('request', app);


wss.on('connection', function connection(ws) {
 
    ws.on('message', function incoming(message) {
      
      console.log(`received: ${message}`);
      
      ws.send(JSON.stringify({
  
        answer: 42
      }));
    });
  });

server.listen(8888, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:%s', port);
})