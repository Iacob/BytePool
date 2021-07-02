
const express = require('express');
const net = require('net');
const uuid = require('uuid');

const app = express();

app.use(express.json());

const dataStore = [];
const connMap = new Object();

function generateConnId() {
  return uuid.v4();
}

function storeReceivedData(connId, receivedData) {
  dataStore.push({connId: connId, data: receivedData, type: 'receive'});
  console.log(">>>>>>>>>>>>>>>>");
  console.log(dataStore);
  console.log("<<<<<<<<<<<<<<<<");
}

function storeCloseAction(connId) {
  dataStore.push({connId: connId, type: 'close'});
  console.log(">>>>>>>>>>>>>>>>");
  console.log(dataStore);
  console.log("<<<<<<<<<<<<<<<<");
}

function getSocketId(c) {
  return c.remoteAddress + "-" + c.remotePort;
}

function closeConnByConnId(connId) {
  var socket = connMap[connId];
  if (socket != null) {
    socket.end();
  }
  
  delete connMap[socketId];
}

net.createServer((c) => {
  console.log('client connnected.');
  
  let connId = generateConnId();
  connMap[connId] = c;
  
  c.on('end', () => {
    storeCloseAction(connId);
    console.log('client disconnected.');
  });
  c.on('data', (data) => {
    storeReceivedData(connId, Array.from(data));
  });
  c.on('close', (err) => {
    console.log('client closed.');
  });
  c.on('error', (err) => {
    closeConnByConnId(connId);
    console.log('client error.');
  });
}).listen(3001, '0.0.0.0', 10, () => {
  console.log('listening');
});

app.get('/', (req, res) => {
  res.end('Hola');
});

app.post('/receive', (req, res) => {
  var currentData = dataStore.shift();
  if (currentData != null) {
    res.json({ret: 0, data: currentData});
  }else {
    res.json({ret: 0, data: null});
  }
});

app.post('/send', (req, res) => {

  var data = req?.body?.data;
  var connId = req?.body?.connId;
  if ((connId != null) && (Array.isArray(data))) {
    var socket = connMap[connId];
    if (socket != null) {
      socket.write(data);
    }
  }
  
  res.end('.');
});

app.post('/close', (req, res) => {
  var connId = req?.body?.connId;
  closeConnByConnId(connId);
  res.end('.');
});

app.listen(3000);

console.log('started.');
