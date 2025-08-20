// Utility functions for distance calculations and pricing

export interface LocationData {
  lat: number;
  lng: number;
  description: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param from - Starting location coordinates
 * @param to - Destination location coordinates
 * @returns Distance in kilometers (rounded to 2 decimal places)
 */
export const calculateDistance = (from: LocationData, to: LocationData): number => {
  if (!from || !to || 
      typeof from.lat !== 'number' || typeof from.lng !== 'number' ||
      typeof to.lat !== 'number' || typeof to.lng !== 'number') {
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const deltaLat = (to.lat - from.lat) * Math.PI / 180;
  const deltaLon = (to.lng - from.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100;
};

/**
 * Get the appropriate distance-based pricing rate based on trip distance
 * @param distance - Trip distance in kilometers
 * @returns The distance category key (50km, 100km, or 150km)
 */
export const getDistancePricingCategory = (distance: number): '50km' | '100km' | '150km' => {
  if (distance <= 50) {
    return '50km';
  } else if (distance <= 100) {
    return '100km';
  } else {
    return '150km';
  }
};

/**
 * Calculate fare for a vehicle based on distance and trip type
 * @param vehicle - Vehicle object with pricing data
 * @param distance - Trip distance in kilometers
 * @param tripType - Trip type ('one-way' or 'return')
 * @returns Calculated fare amount
 */
export const calculateVehicleFare = (
  vehicle: any,
  distance: number,
  tripType: 'one-way' | 'return' = 'one-way'
): number => {
  if (!vehicle.pricing) {
    return 0;
  }

  // For auto vehicles, use fixed auto price
  if (vehicle.pricingReference?.category === 'auto') {
    const autoPricing = vehicle.pricing.autoPrice;
    const ratePerKm = tripType === 'one-way' ? (autoPricing?.oneWay || 0) : (autoPricing?.return || 0);
    return ratePerKm * distance;
  }

  // For car and bus vehicles, calculate distance-based pricing
  const distancePricing = vehicle.pricing.distancePricing;
  if (!distancePricing) {
    return 0;
  }

  const pricing = distancePricing[tripType] || distancePricing['one-way'];
  if (!pricing) {
    return 0;
  }

  const distanceCategory = getDistancePricingCategory(distance);
  const ratePerKm = pricing[distanceCategory] || 0;
  
  return ratePerKm * distance;
};

/**
 * Format price display with proper currency symbol and formatting
 * @param price - Price amount
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString()}`;
};

/**
 * Get pricing display text based on vehicle type and distance
 * @param vehicle - Vehicle object
 * @param distance - Trip distance in kilometers
 * @param tripType - Trip type
 * @returns Object with price and display text
 */
export const getPricingDisplay = (
  vehicle: any,
  distance: number,
  tripType: 'one-way' | 'return' = 'one-way'
) => {
  if (!vehicle.pricing) {
    return {
      price: 0,
      displayText: 'Pricing Unavailable',
      isValid: false
    };
  }

  // For auto vehicles
  if (vehicle.pricingReference?.category === 'auto') {
    const autoPricing = vehicle.pricing.autoPrice;
    const ratePerKm = tripType === 'one-way' ? (autoPricing?.oneWay || 0) : (autoPricing?.return || 0);
    
    if (ratePerKm === 0) {
      return {
        price: 0,
        displayText: 'Price not found',
        isValid: false
      };
    }
    
    const totalPrice = ratePerKm * distance;
    
    return {
      price: totalPrice,
      displayText: `${formatPrice(totalPrice)}`,
      isValid: totalPrice > 0
    };
  }

  // For car and bus vehicles
  const distancePricing = vehicle.pricing.distancePricing;
  if (!distancePricing) {
    return {
      price: 0,
      displayText: 'Pricing Unavailable',
      isValid: false
    };
  }

  const pricing = distancePricing[tripType] || distancePricing['one-way'];
  if (!pricing) {
    return {
      price: 0,
      displayText: 'Pricing Unavailable',
      isValid: false
    };
  }

  const distanceCategory = getDistancePricingCategory(distance);
  const ratePerKm = pricing[distanceCategory] || 0;
  const totalPrice = ratePerKm * distance;

  return {
    price: totalPrice,
    displayText: `${formatPrice(totalPrice)} (${distanceCategory} rate: ₹${ratePerKm}/km)`,
    isValid: totalPrice > 0
  };
};
