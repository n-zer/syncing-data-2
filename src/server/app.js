const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../../hosted/client.html`);
const js = fs.readFileSync(`${__dirname}/../../hosted/bundle.js`);

const onRequest = (request, response) => {
  console.log(request.url);
  if (request.url === '/hosted/bundle.js') {
    response.writeHead(200, { 'content-type': 'text/javascript' });
    response.end(js);
  } else {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(index);
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on port ${port}`);

const BETWEEN_ROUNDS_TIME_MS = 1500;
const SQUARE_APPEAR_DELAY_MS = 1000;
const ROUND_TIME_MS = 3000;
let playerCount = 0;
let newSquareTimeout;
let fastestInputSocket;
let currentSquare;

const squareSizeBounds = { min: 0.05, max: 0.2 };

const randomInRange = (min, max) => (Math.random() * (max - min)) + min;

const io = socketio(app);

let newSquare;

const clickIsInSquare = (click, square) => click.x >= square.x && click.x <= square.x + square.width
    && click.y >= square.y && click.y <= square.y + square.height;

const determineWinner = () => {
  if (fastestInputSocket) {
    fastestInputSocket.socket.broadcast.emit('lose');
    fastestInputSocket.socket.emit('win');
  } else {
    io.emit('lose');
  }

  currentSquare = undefined;
  fastestInputSocket = undefined;

  if (playerCount > 0) {
    newSquareTimeout = setTimeout(newSquare, BETWEEN_ROUNDS_TIME_MS);
  }
};

newSquare = () => {
  console.log('sending square');
  currentSquare = {
    x: Math.random(),
    y: Math.random(),
    width: randomInRange(squareSizeBounds.min, squareSizeBounds.max),
    height: randomInRange(squareSizeBounds.min, squareSizeBounds.max),
    color: `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`,
    time: Date.now() + SQUARE_APPEAR_DELAY_MS,
  };
  io.emit('square', currentSquare);

  setTimeout(determineWinner, ROUND_TIME_MS);
};

io.on('connection', (socket) => {
  if (playerCount++ === 0) {
    newSquareTimeout = setTimeout(newSquare, BETWEEN_ROUNDS_TIME_MS);
  }

  socket.on('click', (data) => {
    if (currentSquare
      && data.time > currentSquare.time
      && (!fastestInputSocket || data.time < fastestInputSocket.time)
      && clickIsInSquare(data, currentSquare)) {
      fastestInputSocket = { socket, time: data.time };
    }
  });

  socket.on('disconnect', () => {
    if (--playerCount === 0) {
      clearTimeout(newSquareTimeout);
    }
  });
});

