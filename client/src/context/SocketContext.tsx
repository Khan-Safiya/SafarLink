import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

interface SocketContextType {
    socket: Socket | null;
    joinRide: (rideId: string) => void;
    sendLocationUpdate: (rideId: string, lat: number, lng: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { isSignedIn } = useAuth();

    useEffect(() => {
        if (isSignedIn) {
            // Connect to backend
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isSignedIn]);

    const joinRide = (rideId: string) => {
        if (socket) {
            socket.emit('join_ride', rideId);
        }
    };

    const sendLocationUpdate = (rideId: string, lat: number, lng: number) => {
        if (socket) {
            socket.emit('update_location', { rideId, lat, lng });
        }
    };

    return (
        <SocketContext.Provider value={{ socket, joinRide, sendLocationUpdate }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
