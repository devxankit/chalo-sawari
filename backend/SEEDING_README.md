# Vehicle Pricing Seeding Guide

This guide explains how to seed the database with comprehensive vehicle pricing data for the ChaloSawari application.

## Overview

The seeding script creates pricing rules for different vehicle categories:
- **Auto**: Standard Auto (one-way & return trips)
- **Cars**: Sedan, Hatchback, and SUV models (one-way & return trips)
- **Buses**: Mini Bus and Luxury Bus models (one-way & return trips)

## Features

- **Distance-based Pricing**: Different rates for 50km, 100km, 150km, and 200km distances
- **Trip Type Support**: One-way and return trip pricing
- **Base Price**: Base fare for all vehicle categories
- **Admin Management**: Full CRUD operations for pricing management

## Files

- `seed-comprehensive-pricing.js` - Main seeding script with all pricing data
- `run-seeding.js` - Simple runner script
- `SEEDING_README.md` - This documentation

## Prerequisites

1. **MongoDB**: Ensure MongoDB is running and accessible
2. **Environment**: Set up your `.env` file with `MONGODB_URI`
3. **Dependencies**: Install backend dependencies (`npm install`)

## Running the Seeding

### Option 1: Direct Node Execution
```bash
cd backend
node seed-comprehensive-pricing.js
```

### Option 2: Using the Runner Script
```bash
cd backend
node run-seeding.js
```

### Option 3: NPM Script (if added to package.json)
```bash
cd backend
npm run seed
```

## What Gets Created

### Auto Rickshaw Pricing
- **Standard Auto**: One-way and return trip pricing
- **Base Fare**: ₹50
- **Distance Pricing**: 50km (₹150), 100km (₹280), 150km (₹400), 200km (₹500)
- **Return Trip Discount**: 15%

### Car Pricing
#### Sedan
- **Honda Amaze**: One-way and return pricing
- **Swift Dzire**: One-way and return pricing  
- **Honda City**: One-way and return pricing
- **Base Fare**: ₹100
- **Return Trip Discount**: 20%

#### Hatchback
- **Swift**: One-way and return pricing
- **i20**: One-way and return pricing
- **Base Fare**: ₹100
- **Return Trip Discount**: 20%

#### SUV
- **Innova Crysta**: One-way and return pricing
- **Scorpio**: One-way and return pricing
- **XUV500**: One-way and return pricing
- **Base Fare**: ₹150
- **Return Trip Discount**: 25%

### Bus Pricing
#### Mini Bus
- **Tempo Traveller**: One-way and return pricing
- **Force Traveller**: One-way and return pricing
- **Base Fare**: ₹300
- **AC Charge**: ₹100
- **Return Trip Discount**: 30%

#### Luxury Bus
- **Volvo AC**: One-way and return pricing
- **Mercedes Benz**: One-way and return pricing
- **Base Fare**: ₹500
- **AC Charge**: ₹200
- **Return Trip Discount**: 35%

## Pricing Structure

Each pricing entry includes:

```javascript
{
  category: 'auto' | 'car' | 'bus',
  vehicleType: 'string',
  vehicleModel: 'string',
  tripType: 'one-way' | 'return',
  distancePricing: {
    '50km': number,
    '100km': number,
    '150km': number,
    '200km': number
  },
  additionalCharges: {
    baseFare: number,
    waitingCharge: number,
    nightCharge: number,
    acCharge: number,
    sleeperCharge: number
  },
  modifiers: {
    surgeMultiplier: number,
    returnTripDiscount: number
  },
  notes: 'string',
  isActive: boolean,
  isDefault: boolean
}
```

## Admin CRUD Operations

After seeding, admins can:

1. **View All Pricing**: See all pricing entries in the AdminPriceManagement page
2. **Edit Pricing**: Modify existing pricing for any vehicle configuration
3. **Add New Pricing**: Create pricing for additional vehicle models
4. **Delete Pricing**: Soft delete pricing (sets `isActive: false`)
5. **Bulk Update**: Update multiple pricing entries at once

## Driver Integration

Drivers can now:
1. Select vehicle category (auto, car, bus)
2. Choose vehicle type (Sedan, SUV, etc.)
3. Select specific model (Honda Amaze, Swift Dzire, etc.)
4. Pricing is automatically fetched based on selection
5. No manual price entry required

## Troubleshooting

### Common Issues

1. **Connection Error**: Check MongoDB is running and `MONGODB_URI` is correct
2. **Permission Error**: Ensure write access to the database
3. **Duplicate Key Error**: The script clears existing data first, so this shouldn't occur

### Verification

After seeding, verify the data:
1. Check MongoDB for `vehiclepricings` collection
2. Visit AdminPriceManagement page to see all pricing
3. Test driver form to ensure pricing selection works

## Customization

To add more vehicle models or modify pricing:

1. Edit `seed-comprehensive-pricing.js`
2. Add new entries to `comprehensivePricingData` array
3. Update frontend `vehicleConfigs` to match
4. Re-run the seeding script

## Notes

- **Return Trip Pricing**: Automatically calculated with appropriate discounts
- **Surge Multipliers**: Applied during peak hours (configurable by admin)
- **Soft Delete**: Pricing is never permanently removed, just marked inactive
- **Default Pricing**: Each configuration has a default pricing entry

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Check that the VehiclePricing model is properly defined
