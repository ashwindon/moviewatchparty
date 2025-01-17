const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Basic route (optional, in case you want to test a root endpoint)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
