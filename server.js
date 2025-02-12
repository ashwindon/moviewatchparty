const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
// console.log('Process PATH:', process.env.PATH);

// Basic route (optional, in case you want to test a root endpoint)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to stream the vibrant processed video
app.get('/video/vibrant', (req, res) => {
  // Set response headers for MP4 streaming
  res.setHeader('Content-Type', 'video/mp4');

  // FFmpeg command:
  // - Use the remote video URL as input.
  // - Apply a filter to boost saturation, contrast, and brightness.
  // - Output in mp4 format with proper flags for fragmented mp4.
  const ffmpegArgs = [
    '-i', 'https://d1annbuehku5ne.cloudfront.net/movieee.mp4',
    '-vf', 'eq=saturation=2:contrast=1.5:brightness=0.05',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov',
    'pipe:1'
  ];

  // Spawn the FFmpeg process
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  // Pipe FFmpeg's stdout directly to the HTTP response
  ffmpegProcess.stdout.pipe(res);

  // Log any FFmpeg errors to the server console
  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`FFmpeg STDERR: ${data}`);
  });

  // When the process exits, end the response if not already ended
  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg exited with code ${code}`);
    res.end();
  });

  // If the client disconnects, kill the FFmpeg process
  req.on('close', () => {
    ffmpegProcess.kill('SIGKILL');
  });
});

/**
 * Socket.io logic:
 *  - Listen for 'play', 'pause', 'seek' events from a client.
 *  - Broadcast the same event (with data) to the other client.
 */
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('play', (time) => {
    console.log(`User ${socket.id} played at: ${time}`);
    socket.broadcast.emit('play', time);
  });

  socket.on('pause', (time) => {
    console.log(`User ${socket.id} paused at: ${time}`);
    socket.broadcast.emit('pause', time);
  });

  socket.on('seek', (time) => {
    console.log(`User ${socket.id} sought to: ${time}`);
    socket.broadcast.emit('seek', time);
  });

  // New toggleVibrant event
  socket.on('toggleVibrant', (state) => {
    console.log(`User ${socket.id} toggled vibrant to: ${state}`);
    // Broadcast to all other clients
    socket.broadcast.emit('toggleVibrant', state);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
