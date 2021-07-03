
const net = require('net');
const http = require('http');

var connMap = new Object();

function sendDataToRemote(connId, data) {
  
  if ((connId != null) && (Array.isArray(data))) {
    var req = http.request(
      'http://localhost:3000/send',
      {method: 'POST'},
      (res) => {
	res.on('data', (data) => {
	});
	res.on('close', () => {
	});
      });
    
    req.write(JSON.stringify({connId: connId, data: data}), 'utf-8');
    req.end();
  }
}

function sendCloseToRemote(connId) {
  
  if ((connId != null) && (Array.isArray(data))) {
    var req = http.request(
      'http://localhost:3000/close',
      {method: 'POST'},
      (res) => {
	res.on('data', (data) => {
	});
	res.on('close', () => {
	});
      });
    
    req.write(JSON.stringify({connId: connId}), 'utf-8');
    req.end();
  }
}

function startNewConn(connId) {
  var connId1 = connId;
  var socket = net.createConnection(3002, '127.0.0.1', () => {
  });

  socket.on('data', (data) => {
    sendToRemote(connId1, data);
  });
  socket.on('end', () => {
    sendCloseToRemote(connId);
  });

  connMap[connId1] = socket;
  return socket;
}

function doAct(act) {
  if (act.type == 'receive') {
    var socket = connMap[act.connId];
    if (socket == null) {
      socket = startNewConn(act.connId);
    }
    socket.write(Buffer.from(act.data));
  }else if (act.type == 'close') {
    socket.end();
    delete connMap[act.connId];
  }
}

function readFromRemote() {
  var data1 = '';
  var req = http.request(
    'http://localhost:3000/receive',
    {method: 'POST'},
    (res) => {
      res.setEncoding('utf-8');
      res.on('data', (data) => {
	data1 += data;
      });
      res.on('close', () => {
	console.log(data1);
	readFromRemote();
      });
    });
  
  //req.write(JSON.stringify({connId: 'aaa-bbb'}), 'utf-8');
  req.end();
}

readFromRemote();

// var req = http.request(
//   'http://localhost:3000/close',
//   {method: 'POST'},
//   (res) => {
//     res.setEncoding('utf-8');
//     res.on('data', (data) => {
//       console.log(data);
//     });
//   });

// req.write(JSON.stringify({connId: 'aaa-bbb'}), 'utf-8');
// req.end();
