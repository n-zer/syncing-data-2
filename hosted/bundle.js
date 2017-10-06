'use strict';

var socket = void 0;
var canvas = void 0;
var context = void 0;
var feedbackText = void 0;

var init = function init() {
  socket = io.connect();

  canvas = document.querySelector('#mainCanvas');
  context = canvas.getContext('2d');
  feedbackText = document.querySelector('#feedbackText');
  feedbackText.innerHTML = 'Waiting for server';

  var clickFunction = function clickFunction(e) {
    console.log('click');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var brect = canvas.getBoundingClientRect();
    var pos = {
      x: e.clientX - brect.left,
      y: e.clientY - brect.top
    };

    socket.emit('click', { time: Date.now(), x: pos.x / canvas.width, y: pos.y / canvas.height });
    feedbackText.innerHTML = 'Waiting for results...';
    canvas.onclick = function () {};
  };

  socket.on('square', function (data) {
    console.log('square');
    while (Date.now() < data.time) {}
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = data.color;
    context.fillRect(data.x * canvas.width, data.y * canvas.height, data.width * canvas.width, data.height * canvas.height);
    feedbackText.innerHTML = 'Click the square!';
    canvas.onclick = clickFunction;
  });

  socket.on('win', function () {
    console.log('win');
    feedbackText.innerHTML = 'You win!';
  });

  socket.on('lose', function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
    console.log('lose');
    feedbackText.innerHTML = 'You Lose!';
  });
};

window.onload = init;
