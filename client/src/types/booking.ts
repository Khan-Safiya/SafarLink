export interface BookingSegment {
  mode: string;
  line_name: string;
  from_stop: string;
  to_stop: string;
  num_stops: number;
  fare_inr: number;
}

export interface BookingRequest {
  origin: string;
  destination: string;
  route_type: string; // fastest | cheapest | safest
  transit_segments: BookingSegment[];
  passenger_name?: string;
  phone?: string;
  estimated_fare_inr?: number;
}

export interface BookingResult {
  ticket_id: string;
  pnr: string;
  booking_time: string;
  passenger_name: string;
  phone?: string;
  origin: string;
  destination: string;
  route_type: string;
  segments: BookingSegment[];
  total_fare_inr: number;
  payment_id: string;
  payment_status: string;
  status: string;
  qr_data?: string | null;  // QR code URL — present for metro tickets
}
