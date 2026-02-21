import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import type { Incident } from '../components/IncidentReporter';

interface SocketContextType {
    socket: Socket | null;
    joinRide: (rideId: string) => void;
    sendLocationUpdate: (rideId: string, lat: number, lng: number) => void;
    joinRouteWatch: (routeId: string) => void;
    leaveRouteWatch: (routeId: string) => void;
    reportIncident: (incident: Incident) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { isSignedIn } = useAuth();

    useEffect(() => {
        if (isSignedIn) {
            const newSocket = io('http://localhost:5000');
            setSocket(newSocket);
            return () => { newSocket.disconnect(); };
        }
    }, [isSignedIn]);

    const joinRide = (rideId: string) => socket?.emit('join_ride', rideId);

    const sendLocationUpdate = (rideId: string, lat: number, lng: number) =>
        socket?.emit('update_location', { rideId, lat, lng });

    const joinRouteWatch = (routeId: string) => socket?.emit('join_route_watch', routeId);

    const leaveRouteWatch = (routeId: string) => socket?.emit('leave_route_watch', routeId);

    const reportIncident = (incident: Incident) => socket?.emit('report_incident', incident);

    return (
        <SocketContext.Provider value={{
            socket, joinRide, sendLocationUpdate,
            joinRouteWatch, leaveRouteWatch, reportIncident,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within a SocketProvider');
    return context;
};
