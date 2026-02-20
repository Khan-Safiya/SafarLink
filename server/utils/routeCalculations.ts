export const calculateAutoFare = (distanceKm: number): number => {
    const baseFare = 25;
    const ratePerKm = 17;
    // Base fare covers first 1.5km usually, but for simplicity we'll just add it.
    // If distance is less than 1.5km, charge base fare.
    if (distanceKm <= 1.5) return baseFare;
    return Math.round(baseFare + ((distanceKm - 1.5) * ratePerKm));
};

export const calculateMetroFare = (stationsCount: number): number => {
    // Based on Pune Metro Fare chart (PCMC to Swargate & Vanaz to Ramwadi)
    // Min fare is 10, max is 35. Roughly increases by 5 every 2-3 stations.
    if (stationsCount <= 1) return 10;
    if (stationsCount <= 3) return 15;
    if (stationsCount <= 6) return 20;
    if (stationsCount <= 9) return 25;
    if (stationsCount <= 12) return 30;
    return 35;
};

export const calculateBusFare = (distanceKm: number): number => {
    // Dummy PMPML Bus Fare logic
    // Usually starts at 5 INR, and maxes out around 50 INR for very long PMC/PCMC routes.
    if (distanceKm <= 2) return 5;
    if (distanceKm <= 5) return 10;
    if (distanceKm <= 10) return 15;
    if (distanceKm <= 15) return 20;
    if (distanceKm <= 25) return 25;
    return 30; // Max out at 30 for most city routes
};

// --- Safety Score Mock Data --- //
export const getSafetyScoreForRoute = (polyline: string): number => {
    // In a real app, we decode the polyline and check coordinates against a spatial DB.
    // For now, we generate a consistent mock score between 60 - 99 based on the string length.
    let hash = 0;
    for (let i = 0; i < polyline.length; i++) {
        hash = ((hash << 5) - hash) + polyline.charCodeAt(i);
        hash |= 0; 
    }
    const score = 60 + (Math.abs(hash) % 40); // 60 to 99
    return score;
};

// --- Emissions (CO2) Calculation --- //
// Average CO2 emissions per km in grams
const EMISSION_FACTORS: Record<string, number> = {
    'walking': 0,
    'bicycle': 0,
    'metro': 14, // highly efficient
    'bus': 82,   // per passenger average
    'auto': 110, // LPG/CNG Auto
    'car': 192   // Private car
};

export const calculateCO2 = (distanceKm: number, mode: string): number => {
    const factor = EMISSION_FACTORS[mode] || 150;
    return Math.round(distanceKm * factor); 
};

export const calculateCalories = (distanceKm: number, mode: string): number => {
    if (mode === 'walking') {
        return Math.round(distanceKm * 55); // ~55 kcal per km walking
    }
    return 0;
};
