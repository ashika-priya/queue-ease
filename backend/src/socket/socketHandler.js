let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client joins room for their specific queue
    socket.on('join:queue', (queueId) => {
      if (queueId) {
        socket.join(`queue:${queueId}`);
      }
    });

    socket.on('leave:queue', (queueId) => {
      if (queueId) {
        socket.leave(`queue:${queueId}`);
      }
    });

    // Client joins room for public TV display
    socket.on('join:public', (orgId) => {
      if (orgId) {
        socket.join(`public:${orgId}`);
      }
    });

    socket.on('leave:public', (orgId) => {
      if (orgId) {
        socket.leave(`public:${orgId}`);
      }
    });

    // Admin console room
    socket.on('join:admin', () => {
      socket.join('admin');
    });

    socket.on('disconnect', () => {
      // Disconnection handled automatically by socket.io
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };
