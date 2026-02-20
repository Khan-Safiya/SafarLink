import express, { Request, Response } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Client, TravelMode, TransitMode } from "@googlemaps/google-maps-services-js";
import { calculateAutoFare, calculateMetroFare, calculateBusFare, getSafetyScoreForRoute, calculateCO2, calculateCalories } from '../utils/routeCalculations';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Journey Planning API
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get journey routes between two locations
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Starting location
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination location
 *     responses:
 *       200:
 *         description: List of suggested routes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [cheapest, fastest, safest]
 *                   totalCost:
 *                     type: number
 *                   totalDuration:
 *                     type: number
 *                   safetyScore:
 *                     type: number
 *                   segments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         mode:
 *                           type: string
 *                         duration:
 *                           type: number
 *                         cost:
 *                           type: number
 *                         description:
 *                           type: string
 */

interface SubRoute {
  mode: 'walking' | 'bus' | 'metro' | 'auto' | 'shared-auto' | 'pooling';
  duration: number; // minutes
  cost: number; // currency units
  description: string;
}

interface JourneyRoute {
  id: string;
  type: 'cheapest' | 'fastest' | 'safest';
  totalCost: number;
  totalDuration: number;
  safetyScore: number; // 1-100
  segments: SubRoute[];
  color: string;
  co2?: number;
  calories?: number;
}

const googleMapsClient = new Client({});

router.get('/', ClerkExpressRequireAuth({}), async (req: any, res: Response) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
      return res.status(400).json({ error: "From and To locations are required" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
      return res.status(500).json({ error: "Maps API key not configured" });
  }

  try {
      // Fetch 3 route types in parallel
      const [drivingRes, transitRes, alternativesRes] = await Promise.all([
          googleMapsClient.directions({
              params: {
                  origin: from as string,
                  destination: to as string,
                  mode: TravelMode.driving,
                  departure_time: 'now',
                  key: apiKey
              }
          }).catch((e: any) => { console.error("Driving Error:", e.response?.data || e.message); return null; }),
          
          googleMapsClient.directions({
              params: {
                  origin: from as string,
                  destination: to as string,
                  mode: TravelMode.transit,
                  transit_mode: [TransitMode.subway, TransitMode.bus],
                  alternatives: true,
                  key: apiKey
              }
          }).catch((e: any) => { console.error("Transit Error:", e.response?.data || e.message); return null; }),

          googleMapsClient.directions({
              params: {
                  origin: from as string,
                  destination: to as string,
                  mode: TravelMode.driving,
                  alternatives: true,
                  key: apiKey
              }
          }).catch((e: any) => { console.error("Alternatives Error:", e.response?.data || e.message); return null; })
      ]);

      const isWomen = req.query.womenOnly === 'true';
      const routes: JourneyRoute[] = [];

      // HELPER: Build detailed segments from a Directions Leg
      const buildSegmentsFromLeg = (leg: any, baseType: string, isTransit=false) => {
          let totalCost = 0;
          let totalMins = 0;
          const segments: SubRoute[] = [];
          let distWalking = 0;
          let distTransit = 0;
          let distAuto = 0;
          let accAutoDist = 0;
          let accAutoDur = 0;

          const flushAutoSegment = () => {
              if (accAutoDist > 0) {
                  const cost = calculateAutoFare(accAutoDist);
                  totalCost += cost;
                  distAuto += accAutoDist;
                  const autoDesc = isWomen ? `Women Only Auto (${accAutoDist.toFixed(1)} km)` : `Direct Auto Ride (${accAutoDist.toFixed(1)} km)`;
                  segments.push({ mode: 'auto', duration: accAutoDur, cost, description: autoDesc });
                  accAutoDist = 0;
                  accAutoDur = 0;
              }
          };

          leg.steps?.forEach((step: any) => {
              const dist = step.distance.value / 1000;
              const dur = Math.round(step.duration.value / 60);
              totalMins += dur;

              if (step.travel_mode === 'TRANSIT') {
                  flushAutoSegment();
                  const transitDetails = step.transit_details;
                  if (transitDetails?.line.vehicle.type === 'HEAVY_RAIL' || transitDetails?.line.vehicle.type === 'SUBWAY') {
                      const cost = calculateMetroFare(transitDetails.num_stops || 5);
                      totalCost += cost;
                      distTransit += dist;
                      const lineName = transitDetails.line.short_name || transitDetails.line.name;
                      const fromStop = transitDetails.departure_stop.name;
                      const toStop = transitDetails.arrival_stop.name;
                      segments.push({ mode: 'metro', duration: dur, cost, description: `Metro (${lineName}): ${fromStop} to ${toStop}` });
                  } else {
                      const cost = calculateBusFare(dist);
                      totalCost += cost;
                      distTransit += dist;
                      const lineName = transitDetails?.line.short_name || 'City Bus';
                      const fromStop = transitDetails?.departure_stop?.name || 'Stop';
                      const toStop = transitDetails?.arrival_stop?.name || 'Destination';
                      segments.push({ mode: 'bus', duration: dur, cost, description: `Bus ${lineName}: ${fromStop} to ${toStop}` });
                  }
              } else if (step.travel_mode === 'WALKING') {
                  flushAutoSegment();
                  const cleanInstruction = step.html_instructions ? step.html_instructions.replace(/<[^>]*>?/gm, '') : `Walk ${dist.toFixed(1)} km`;
                  // If walk is too long (> 1.2km) in a transit route, convert it to an Auto connector for realism
                  if (isTransit && dist > 1.2) {
                      accAutoDist += dist;
                      // Subtract brief boarding delay to keep duration realistic
                      accAutoDur += Math.max(dur - 2, 1);
                  } else {
                      segments.push({ mode: 'walking', duration: dur, cost: 0, description: cleanInstruction });
                  }
              } else if (step.travel_mode === 'DRIVING') {
                  accAutoDist += dist;
                  accAutoDur += dur;
              }
          });
          
          flushAutoSegment();

          // Fallback if no specific steps generated
          if (segments.length === 0) {
             const distKm = leg.distance.value / 1000;
             const dur = Math.round(leg.duration.value / 60);
             if (isTransit) {
                 const cost = calculateBusFare(distKm);
                 totalCost = cost;
                 distTransit = distKm;
                 segments.push({ mode: 'bus', duration: dur, cost, description: `Direct Bus Ride (${distKm.toFixed(1)} km)` });
             } else {
                 const cost = calculateAutoFare(distKm);
                 totalCost = cost;
                 distAuto = distKm;
                 const autoDesc = isWomen ? `Women Only Auto (${distKm.toFixed(1)} km)` : `Direct Auto Ride (${distKm.toFixed(1)} km)`;
                 segments.push({ mode: 'auto', duration: dur, cost, description: autoDesc });
             }
             totalMins = dur;
          }

          return { segments, totalCost, totalMins, distWalking, distTransit, distAuto };
      };

      // 1. FASTEST (Driving -> Auto)
      if (drivingRes?.data.routes.length) {
          const route = drivingRes.data.routes[0];
          const leg = route.legs[0];
          const { segments, totalCost, totalMins, distAuto } = buildSegmentsFromLeg(leg, 'fastest');
          
          routes.push({
              id: 'fastest',
              type: 'fastest',
              totalCost,
              totalDuration: totalMins,
              safetyScore: getSafetyScoreForRoute(route.overview_polyline.points),
              color: '#3b82f6', // blue-500
              segments,
              co2: calculateCO2(distAuto, 'auto'),
              calories: 0
          });
      }

      // 2. CHEAPEST (Transit or Shared Auto)
      if (transitRes?.data.routes.length) {
          const route = transitRes.data.routes[0];
          const leg = route.legs[0];
          const { segments, totalCost, totalMins, distWalking, distTransit } = buildSegmentsFromLeg(leg, 'cheapest', true);

          routes.push({
              id: 'cheapest',
              type: 'cheapest',
              totalCost,
              totalDuration: totalMins,
              safetyScore: getSafetyScoreForRoute(route.overview_polyline.points),
              color: '#2FCE65', // emerald-500
              segments,
              co2: calculateCO2(distTransit, 'bus'), // rough approx
              calories: calculateCalories(distWalking, 'walking')
          });
      } else if (drivingRes?.data.routes.length) {
          // Fallback to shared auto if NO transit exists
          const route = drivingRes.data.routes[0];
          const leg = route.legs[0];
          const distKm = leg.distance.value / 1000;
          const durationMins = Math.round(leg.duration.value / 60);
          const sharedCost = Math.round(calculateAutoFare(distKm) * 0.4); 
          
          routes.push({
              id: 'cheapest',
              type: 'cheapest',
              totalCost: sharedCost,
              totalDuration: durationMins + 10, // Wait time penalty
              safetyScore: getSafetyScoreForRoute(route.overview_polyline.points),
              color: '#2FCE65',
              segments: [
                  { 
                      mode: 'shared-auto', 
                      duration: durationMins + 10, 
                      cost: sharedCost, 
                      description: isWomen ? `Women Only Pooled Auto (${distKm.toFixed(1)} km)` : `Pooled Auto Ride (${distKm.toFixed(1)} km)` 
                  }
              ],
              co2: Math.round(calculateCO2(distKm, 'auto') / 3),
              calories: 0
          });
      }

      // 3. SAFEST (Prioritize Metro, otherwise fallback to highest-score alternative, avoid Bus if possible)
      let safestRouteFound = false;

      // First try to find a Metro route in the transit alternatives
      if (transitRes?.data.routes.length) {
          let bestMetroRoute: any = null;
          let maxMetroDist = 0;

          transitRes.data.routes.forEach((r: any) => {
              let metroDist = 0;
              r.legs[0].steps?.forEach((step: any) => {
                  if (step.travel_mode === 'TRANSIT' && (step.transit_details?.line.vehicle.type === 'HEAVY_RAIL' || step.transit_details?.line.vehicle.type === 'SUBWAY')) {
                      metroDist += step.distance.value;
                  }
              });
              if (metroDist > maxMetroDist) {
                  maxMetroDist = metroDist;
                  bestMetroRoute = r;
              }
          });

          if (bestMetroRoute) {
              const leg = bestMetroRoute.legs[0];
              const { segments, totalCost, totalMins, distAuto } = buildSegmentsFromLeg(leg, 'safest', true);
              
              routes.push({
                  id: 'safest',
                  type: 'safest',
                  totalCost,
                  totalDuration: totalMins + 2,
                  safetyScore: 98, // Metro is inherently safest due to CCTVs and crowd security
                  color: '#f59e0b', // amber-500
                  segments,
                  co2: calculateCO2(maxMetroDist / 1000, 'bus') + calculateCO2(distAuto, 'auto'),
                  calories: 0
              });
              safestRouteFound = true;
          }
      }

      // If no Metro exists, fallback to alternative driving route with highest spatial safety score
      if (!safestRouteFound && alternativesRes?.data.routes.length) {
          const options = alternativesRes.data.routes.length > 1 
              ? alternativesRes.data.routes.slice(1) 
              : alternativesRes.data.routes;

          let safestRoute: any = options[0];
          let maxSafety = 0;
          
          options.forEach((r: any) => {
              const score = getSafetyScoreForRoute(r.overview_polyline.points);
              if (score > maxSafety) {
                  maxSafety = score;
                  safestRoute = r;
              }
          });

          const leg = safestRoute.legs[0];
          const { segments, totalCost, totalMins, distAuto } = buildSegmentsFromLeg(leg, 'safest');
          
          let finalSafety = maxSafety + 8; // Boost to justify it being "Safest" category
          if (finalSafety > 99) finalSafety = 98; // Cap

          routes.push({
              id: 'safest',
              type: 'safest',
              totalCost,
              totalDuration: totalMins + 2, 
              safetyScore: finalSafety, 
              color: '#f59e0b', 
              segments,
              co2: calculateCO2(distAuto, 'auto'),
              calories: 0
          });
      }

      // If absolutely no routes found
      if (routes.length === 0) {
          return res.status(404).json({ error: "No viable routes found between these locations." });
      }

      res.json(routes);

  } catch (error) {
      console.error("Google Maps API Error:", error);
      res.status(500).json({ error: "Failed to calculate dynamic routes." });
  }
});

export default router;
