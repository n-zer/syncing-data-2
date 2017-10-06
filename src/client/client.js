let socket;
let canvas;
let context;
let feedbackText;

const init = () => {
  socket = io.connect();

  canvas = document.querySelector('#mainCanvas');
  context = canvas.getContext('2d');
  feedbackText = document.querySelector('#feedbackText');
  feedbackText.innerHTML = 'Waiting for server';

  const clickFunction = (e) => {
    console.log('click');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const brect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - brect.left,
      y: e.clientY - brect.top,
    };

    socket.emit('click', { time: Date.now(), x: pos.x / canvas.width, y: pos.y / canvas.height });
    feedbackText.innerHTML = 'Waiting for results...';
    canvas.onclick = () => {};
  };

  socket.on('square', (data) => {
    console.log('square');
    while (Date.now() < data.time);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = data.color;
    context.fillRect(
      data.x * canvas.width,
      data.y * canvas.height,
      data.width * canvas.width,
      data.height * canvas.height,
    );
    feedbackText.innerHTML = 'Click the square!';
    canvas.onclick = clickFunction;
  });

  socket.on('win', () => {
    console.log('win');
    feedbackText.innerHTML = 'You win!';
  });

  socket.on('lose', () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    console.log('lose');
    feedbackText.innerHTML = 'You Lose!';
  });
};

window.onload = init;
