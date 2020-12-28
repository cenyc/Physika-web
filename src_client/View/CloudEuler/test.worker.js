import registerWebworker from 'webworker-promise/lib/register';
/*
function newWS() {
    let ws = new WebSocket('ws://localhost:8888/');
    return ws;
}

function openWS(ws) {
    ws.onopen = function () {
        console.log('Socket open.');
        socket.send(JSON.stringify({ uid: 1, test: 'test' }));
        console.log('Message sent.');
    }
}
*/
registerWebworker(async (message, emit)=>{
    console.log('Creating socket');
    let socket = new WebSocket('ws://localhost:8888/');
    socket.onopen = function () {

        console.log('Socket open.');
        socket.send(JSON.stringify({ message: 'What is the meaning of life, the universe and everything?' }));
        console.log('Message sent.')
    };
    /*
    let ws;
    switch (message.state) {
        case '0':
            ws = newWS();
        case '1':
            openWS(ws);
        case '2':
            ws.send(JSON.stringify({ uid: 1, test: 'test' }));
        case '3':
            ws.close();
    }
    */
   socket.onmessage = function (message) {

        console.log('Socket server message', message);
        return Promise.resolve(message);
        //return new registerWebworker.TransferableResponse(message, [message]);
    };

    /*
    let a={x:1};
    return Promise.resolve(
        new registerWebworker.TransferableResponse(a)
    );
    */
    /*
    var array = message.array;
    var min = message.min;
    var max = message.max;
  
    var offset = message.component || 0;
    var step = message.numberOfComponents || 1;
  
    var numberOfBins = message.numberOfBins;
    var delta = max - min;
    var histogram = new Float32Array(numberOfBins);
    histogram.fill(0);
    var len = array.length;
    for (var i = offset; i < len; i += step) {
      var idx = Math.floor(
        (numberOfBins - 1) * (Number(array[i]) - min) / delta
      );
      histogram[idx] += 1;
    }
    */
/*
    return Promise.resolve(
        new registerWebworker.TransferableResponse(histogram, [histogram.buffer])
    );
    */
});
