import { Server, Socket } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // ── Ride tracking ──────────────────────────────────────────────────────────

    socket.on('join_ride', (rideId: string) => {
      socket.join(rideId);
      console.log(`User ${socket.id} joined ride: ${rideId}`);
    });

    socket.on('update_location', (data: { rideId: string; lat: number; lng: number }) => {
      socket.to(data.rideId).emit('location_update', data);
    });

    // ── Route incident watching ────────────────────────────────────────────────
    // All users on the same route join room `route:<routeId>` and get instant alerts

    socket.on('join_route_watch', (routeId: string) => {
      socket.join(`route:${routeId}`);
      console.log(`User ${socket.id} watching route: ${routeId}`);
    });

    socket.on('leave_route_watch', (routeId: string) => {
      socket.leave(`route:${routeId}`);
    });

    // ── Incident reporting ────────────────────────────────────────────────────
    // Broadcasts to ALL users in the route room (including reporter)

    socket.on('report_incident', (incident: {
      id: string;
      lat: number;
      lng: number;
      type: string;
      description: string;
      routeId: string;
      reportedBy: string;
      severity: string;
      createdAt: string;
    }) => {
      console.log(`Incident reported on route ${incident.routeId}: ${incident.type}`);
      io.to(`route:${incident.routeId}`).emit('incident_alert', incident);
    });

    socket.on('confirm_incident', (data: { incidentId: string; routeId: string }) => {
      io.to(`route:${data.routeId}`).emit('incident_confirmed', data);
    });

    socket.on('resolve_incident', (data: { incidentId: string; routeId: string }) => {
      io.to(`route:${data.routeId}`).emit('incident_resolved', data);
    });

    // ── Shared Auto real-time seat updates ────────────────────────────────────
    // All interested users join room `auto:<autoId>` to get live seat changes

    socket.on('join_auto_room', (autoId: string) => {
      socket.join(`auto:${autoId}`);
    });

    socket.on('leave_auto_room', (autoId: string) => {
      socket.leave(`auto:${autoId}`);
    });

    // Broadcast updated seat count to all watchers (after book/cancel API call)
    socket.on('auto_seat_update', (data: { autoId: string; availableSeats: number; status: string; passengers: any[] }) => {
      io.to(`auto:${data.autoId}`).emit('auto_seats_changed', data);
    });

    socket.on('auto_departed', (data: { autoId: string }) => {
      io.to(`auto:${data.autoId}`).emit('auto_has_departed', data);
    });

    // ── Disconnect ────────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
