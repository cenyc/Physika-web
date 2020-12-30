import registerWebworker from 'webworker-promise/lib/register';

let ws;

registerWebworker(async function (message, emit) {
    return new Promise((resolve, reject) => {

        if (message.init) {
            console.log('Creating socket');
            ws = new WebSocket('ws://localhost:8888/');
            ws.onopen = function () {
                console.log('Socket open.');
            }
        }
        ws.onclose = function () {
            console.log('Socket close.');
        }

        if (message.data) {
            let data = JSON.stringify(message.data);
            console.log("////////", data);
            ws.send(data);

            
        }

        ws.onmessage = function (message) {

            console.log('Socket server message', message);
            resolve(new registerWebworker.TransferableResponse(message.data));
        };

    })
})