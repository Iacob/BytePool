
const net = require('net');
const http = require('http');

var connMap = new Object();

function sendDataToRemote(connId, data) {
  
  if ((connId != null) && (Array.isArray(data))) {
    var req = http.request(
      'http://localhost:3000/send',
      {method: 'POST'},
      (res) => {
	res.on('data', (dataResp) => {
	});
	res.on('close', () => {
	});
      });
    req.setHeader('Content-Type', 'application/json');
    req.write(JSON.stringify({connId: connId, data: data}), 'utf-8');
    req.end();
  }
}

function sendCloseToRemote(connId) {
  
  if (connId != null) {
    var req = http.request(
      'http://localhost:3000/close',
      {method: 'POST'},
      (res) => {
	res.on('data', (data) => {
	});
	res.on('close', () => {
	});
      });

    req.setHeader('Content-Type', 'application/json');
    req.write(JSON.stringify({connId: connId}), 'utf-8');
    req.end();
  }
}

function startNewConn(connId) {
  var connId1 = connId;
  var socket = net.createConnection(3002, '127.0.0.1', () => {
  });

  socket.on('data', (data) => {
    let dataArr = Array.from(data);
    sendDataToRemote(connId1, dataArr);
  });
  socket.on('end', () => {
    sendCloseToRemote(connId);
  });

  connMap[connId1] = socket;
  return socket;
}

function doAct(act) {
  if (act == null) {
    return;
  }
  if (act.data != null) {
    console.log(act);
  }
  // act: { connId, data, type }
  if (act?.data?.type == 'receive') {
    var socket = connMap[act.data.connId];
    if (socket == null) {
      socket = startNewConn(act.data.connId);
    }
    socket.write(Buffer.from(act.data.data));
  }else if (act?.data?.type == 'close') {
    var socket = connMap[act.data.connId];
    if (socket != null) {
      socket.end();
      delete connMap[act.data.connId];
    }
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
	let act1 = JSON.parse(data1);
	//console.log(data1);
	doAct(act1);
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
