
const express = require('express');
const net = require('net');
const uuid = require('uuid');

const app = express();

app.use(express.json());

const dataStore = [];
const connIdMap = new Object();
const connIdReverseMap = new Object();
const connMap = new Object();

function generateConnID() {
  return uuid.v4();
}

function storeReceivedData(c, receivedData) {
  var socketId = getSocketId(c);
  var connId = connIdMap[socketId];
  if (connId == null) {
    connId = generateConnID();
    connIdMap[socketId] = connId;
    connIdReverseMap[connId] = socketId;
    connMap[socketId] = c;
  }
  dataStore.push({connId: connId, data: receivedData, type: 'receive'});
}

function storeCloseAction(c) {
  var socketId = getSocketId(c);
  var connId = connIdMap[socketId];
  if (connId == null) {
    connId = generateConnID();
    connIdMap[socketId] = connId;
  }
  dataStore.push({connId: connId, type: 'close'});
}

function getSocketId(c) {
  return c.remoteAddress + "-" + c.remotePort;
}

function closeConnBySocketId(socketId) {
  var connId = connIdMap[socketId];
  var socket = connMap[connId];
  if (socket != null) {
    socket.end();
  }

  delete connIdMap[socketId];
  delete connIdReverseMap[connId];
  delete connMap[socketId];
}

function closeConnByConnId(connId) {
  var socketId = connIdReverseMap[connId];
  var socket = connMap[connId];
  if (socket != null) {
    socket.end();
  }

  delete connIdMap[socketId];
  delete connIdReverseMap[connId];
  delete connMap[socketId];
}

net.createServer((c) => {
  console.log('client connnected.');
  c.on('end', () => {
    storeCloseAction(getSocketId(c));
    console.log('client disconnected.');
  });
  c.on('data', (data) => {
    storeReceivedData(c, Array.from(data));
    console.log(dataStore);
    console.log(c.remoteAddress + "-" + c.remotePort);
  });
  c.on('close', (err) => {
    console.log('client closed.');
  });
  c.on('error', (err) => {
    let socketId = getSocketId(c);
    closeConnBySocketId(socketId);
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
    var dataBuffer = Buffer.from(data);
    var socketId = connIdReverseMap[connId];
    var socket = connMap[socketId];
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
