import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning:', err.message);
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const joinQueueRoom = (queueId) => {
    if (socket && queueId) {
      socket.emit('join:queue', queueId);
    }
  };

  const leaveQueueRoom = (queueId) => {
    if (socket && queueId) {
      socket.emit('leave:queue', queueId);
    }
  };

  const joinPublicRoom = (orgId) => {
    if (socket && orgId) {
      socket.emit('join:public', orgId);
    }
  };

  const leavePublicRoom = (orgId) => {
    if (socket && orgId) {
      socket.emit('leave:public', orgId);
    }
  };

  const joinAdminRoom = () => {
    if (socket) {
      socket.emit('join:admin');
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinQueueRoom,
        leaveQueueRoom,
        joinPublicRoom,
        leavePublicRoom,
        joinAdminRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
