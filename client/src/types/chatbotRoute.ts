export interface Root {
  query: string;
  routes: Routes;
  fares: Fares;
  buddy: Buddy;
}

export interface Routes {
  origin: string;
  destination: string;
  transit_options: TransitOption[];
}

export interface TransitOption {
  mode: string;
  available: boolean;
  routes: Route[];
}

export interface Route {
  route_number: number;
  total_distance: string;
  total_duration: string;
  origin: string;
  destination: string;
  steps: Step[];
}

export interface Step {
  step_number: number;
  instruction: string;
  distance: string;
  duration: string;
  travel_mode: string;
  transit_info?: TransitInfo;
}

export interface TransitInfo {
  vehicle_type: string;
  line_name: string;
  departure_stop: string;
  arrival_stop: string;
  num_stops: number;
}

export interface Fares {
  origin: string;
  destination: string;
  ranked_by_cost: FareOption[];
  ranked_by_speed: FareOption[];
  cheapest: FareOption;
  fastest: FareOption;
  best_value: FareOption;
}

export interface FareOption {
  mode: string;
  route_number: number;
  distance_km: number;
  duration_minutes: number;
  estimated_fare_inr: number;
  actual_fare?: string | null;
  origin: string;
  destination: string;
  fare_source: string;
}

export interface Buddy {
  type: string;
  answer?: string;
  data?: unknown;
}
