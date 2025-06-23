const express = require('express');
const http = require('http');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

const port = new SerialPort({
  path: '/dev/ttyACM0', // ✔ تأكد من هذا المسار
  baudRate: 9600        // ✔ تأكد من نفس البود في كود الأردوينو
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

parser.on('data', (line) => {
  console.log('UID from Arduino:', line); // يجب أن يظهر هنا عند تمرير البطاقة
  io.emit('rfid-data', line);
});

io.on('connection', (socket) => {
  console.log('Client connected');
});

server.listen(5000, () => {
  console.log('Server listening on http://localhost:5000');
});
