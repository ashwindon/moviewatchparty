// Connect to Socket.io
const socket = io();

// Define video URLs
const originalVideoUrl = "https://d1annbuehku5ne.cloudfront.net/movieee.mp4";
const vibrantVideoUrl = "/video/vibrant";
// Flag to prevent infinite seek loops
let isSeeking = false;
// Global flag for vibrant state
let vibrantEnabled = false;
// Set the new source
const newSrc = vibrantEnabled ? vibrantVideoUrl : originalVideoUrl;
const video = document.getElementById('syncVideo');

// Reference to the toggle button
const vibrantToggle = document.getElementById('vibrantToggle');

// Listen for toggle clicks
vibrantToggle.addEventListener('click', () => {
  // Toggle the flag
  vibrantEnabled = !vibrantEnabled;
  
  // Update the button text
  vibrantToggle.innerText = `Vibrant Colors: ${vibrantEnabled ? "ON" : "OFF"}`;
  
  // Emit the new state to the server (this will broadcast to all clients)
  socket.emit('toggleVibrant', vibrantEnabled);
  
  // Switch the video source while attempting to preserve playback position.
  // Save the current time and paused state.
  const currentTime = video.currentTime;
  const wasPaused = video.paused;
  
  // Set the new source
  const newSrc = vibrantEnabled ? vibrantVideoUrl : originalVideoUrl;
  document.getElementById('videoSource').src = newSrc;
  
  // Load the new source and set playback position when metadata is loaded
  video.load();
  video.onloadedmetadata = () => {
    // Set the currentTime and resume play if necessary
    video.currentTime = currentTime;
    if (!wasPaused) {
      video.play();
    }
  };
});

// Listen for the toggle event from the server (in case another client toggles it)
socket.on('toggleVibrant', (state) => {
  // If this client’s toggle does not match the new state, update it.
  if (vibrantEnabled !== state) {
    vibrantEnabled = state;
    vibrantToggle.innerText = `Vibrant Colors: ${vibrantEnabled ? "ON" : "OFF"}`;
    
    const currentTime = video.currentTime;
    const wasPaused = video.paused;
    const newSrc = vibrantEnabled ? vibrantVideoUrl : originalVideoUrl;
    document.getElementById('videoSource').src = newSrc;
    video.load();
    video.onloadedmetadata = () => {
      video.currentTime = currentTime;
      if (!wasPaused) {
        video.play();
      }
    };
  }
});

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
