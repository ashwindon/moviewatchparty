// Connect to Socket.io
const socket = io();

const video = document.getElementById('syncVideo');

// Flag to prevent infinite seek loops
let isSeeking = false;

/**
 * Listen for local video events and notify the server.
 */
video.addEventListener('play', () => {
  // Send 'play' event to server with current time
  socket.emit('play', video.currentTime);
});

video.addEventListener('pause', () => {
  // Send 'pause' event to server with current time
  socket.emit('pause', video.currentTime);
});

/**
 * 'seeking' fires repeatedly while user drags the seek bar,
 * so we can also rely on 'seeked' or 'timeupdate'.
 * We'll pick 'seeked' which fires once the user stops dragging.
 */
video.addEventListener('seeked', () => {
  socket.emit('seek', video.currentTime);
});

/**
 * Respond to events from the server (other client).
 */
socket.on('play', (time) => {
  // If the video is currently paused, play it
  if (video.paused) {
    video.currentTime = time;
    video.play();
  }
});

socket.on('pause', (time) => {
  // If the video is currently playing, pause it
  if (!video.paused) {
    video.currentTime = time;
    video.pause();
  }
});

socket.on('seek', (time) => {
  if (!isSeeking) {
    isSeeking = true;
    video.currentTime = time;
    // Wait briefly before allowing another seek
    setTimeout(() => {
      isSeeking = false;
    }, 500);
  }
});
