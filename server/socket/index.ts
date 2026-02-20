import { Server, Socket } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a ride room for tracking
    socket.on('join_ride', (rideId: string) => {
      socket.join(rideId);
      console.log(`User ${socket.id} joined ride: ${rideId}`);
    });

    // Driver sends location updates
    socket.on('update_location', (data: { rideId: string, lat: number, lng: number }) => {
      // Broadcast to everyone in the ride room EXCEPT the sender (driver)
      socket.to(data.rideId).emit('location_update', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};
