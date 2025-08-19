# Vehicle Pricing System Documentation

## Overview

The Vehicle Pricing System is a comprehensive solution for managing vehicle pricing across different categories, types, models, and trip types. It provides a centralized way for admins to set pricing and for drivers to automatically fetch appropriate pricing when adding vehicles.

## Features

- **Multi-level Pricing**: Supports auto, car, and bus categories
- **Distance-based Pricing**: Different rates for 50km, 100km, 150km, and 200km distances (for car and bus only)
- **Base Price**: Fixed base price for all vehicle categories
- **Trip Type Support**: One-way and return trip pricing
- **Admin Management**: Full CRUD operations for pricing management
- **Driver Integration**: Automatic pricing selection in driver vehicle forms

## Database Schema

### VehiclePricing Model

```javascript
{
  category: 'auto' | 'car' | 'bus',
  vehicleType: String,        // e.g., 'Auto', 'Sedan', 'Fuel Auto'
  vehicleModel: String,       // e.g., 'Standard Auto', 'Honda City', 'Standard'
  tripType: 'one-way' | 'return',
  distancePricing: {
    '50km': Number,           // Required for car and bus, optional for auto
    '100km': Number,          // Required for car and bus, optional for auto
    '150km': Number,          // Required for car and bus, optional for auto
    '200km': Number           // Required for car and bus, optional for auto
  },
  basePrice: Number,          // Required for all categories
  isActive: Boolean,
  isDefault: Boolean,
  notes: String,
  createdBy: ObjectId,
  updatedBy: ObjectId
}
```

## Pricing Logic

### Auto Category
- **Distance-based pricing**: Not used (all values are 0)
- **Base price**: Fixed fare for the trip
- **Total fare**: Base price only

### Car and Bus Categories
- **Distance-based pricing**: Per km rates for different distance ranges
- **Base price**: Additional fixed fare
- **Total fare**: (Distance rate × Distance) + Base price

## API Endpoints

### Public Endpoints (No Authentication Required)

#### GET /api/vehicle-pricing/categories
Get all available pricing categories and vehicle types.

#### GET /api/vehicle-pricing/calculate
Get pricing for a specific vehicle configuration.

**Query Parameters:**
- `category`: Vehicle category (auto, car, bus)
- `vehicleType`: Vehicle type (Auto, Sedan, Hatchback, SUV, Mini Bus, Luxury Bus)
- `vehicleModel`: Vehicle model (optional)
- `tripType`: Trip type (one-way, return)

#### POST /api/vehicle-pricing/calculate-fare
Calculate fare for a specific trip.

**Request Body:**
```json
{
  "category": "auto",
  "vehicleType": "Auto",
  "vehicleModel": "Standard Auto",
  "tripType": "one-way",
  "distance": 25
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "basePrice": 200,
    "totalFare": 200,
    "distancePricing": {
      "50km": 0,
      "100km": 0,
      "150km": 0,
      "200km": 0
    },
    "category": "auto"
  }
}
```

### Admin Endpoints (Authentication Required)

#### GET /api/vehicle-pricing/admin
Get all vehicle pricing with optional filters.

**Query Parameters:**
- `category`: Filter by category
- `tripType`: Filter by trip type
- `page`: Page number for pagination
- `limit`: Items per page

#### GET /api/vehicle-pricing/admin/:id
Get specific vehicle pricing by ID.

#### POST /api/vehicle-pricing/admin
Create new vehicle pricing.

#### PUT /api/vehicle-pricing/admin/:id
Update existing vehicle pricing.

#### DELETE /api/vehicle-pricing/admin/:id
Delete vehicle pricing (soft delete).

#### POST /api/vehicle-pricing/admin/bulk
Bulk create/update vehicle pricing.

## Usage Examples

### 1. Setting Up Initial Pricing

Run the seeding script to populate the database with initial pricing:

```bash
cd backend
node seed-pricing.js
```

This will create pricing entries for:
- Auto-ricksaw variants (Fuel, Electric, CNG)
- Car types (Sedan, Hatchback, SUV) with specific models
- Bus types (AC Sleeper, Non-AC Sleeper, etc.)

### 2. Admin Management

Admins can use the AdminPriceManagement page to:
- View all existing pricing
- Add new pricing entries
- Edit existing pricing
- Delete pricing entries
- Filter pricing by category and trip type

### 3. Driver Vehicle Form Integration

When drivers add vehicles, they:
1. Select vehicle category (auto, car, bus)
2. Choose vehicle type (e.g., Sedan, SUV)
3. Select vehicle model (e.g., Honda City)
4. The system automatically associates the vehicle with the appropriate pricing structure

### 4. Fare Calculation

The system automatically calculates fares based on:
- Distance (using the appropriate distance bracket)
- Trip type (one-way vs return with discount)
- Additional services (AC, sleeper, etc.)
- Base fare and other charges

## Frontend Components

### AdminPriceManagement
- Complete pricing management interface
- Add/edit/delete pricing entries
- Filter and view pricing data
- Form validation and error handling

### AddVehicleForm (Driver)
- Integrated pricing selection
- Automatic pricing structure display
- No manual pricing input required

## Configuration

### Vehicle Categories and Types

The system supports these predefined configurations:

#### Auto-Ricksaw
- Types: Fuel, Electric, CNG
- Models: Standard, Premium, Deluxe

#### Car
- Types: Sedan, Hatchback, SUV
- Models: Specific to each type (e.g., Honda City for Sedan)

#### Bus
- Types: AC Sleeper, Non-AC Sleeper, various seat configurations
- Models: Standard, Premium, Luxury

### Default Pricing

Initial pricing is set with reasonable defaults:
- Auto-ricksaw: ₹22-30/km depending on type
- Car: ₹24-55/km depending on type and model
- Bus: ₹55-120/km depending on type and amenities

## Migration from Old System

### Changes Made
1. **Vehicle Model**: Removed `pricing` field, added `pricingReference`
2. **New Collection**: Created `VehiclePricing` collection
3. **API Updates**: Added new pricing endpoints
4. **Frontend Updates**: Updated admin and driver forms

### Backward Compatibility
- Existing vehicles will need to be updated with pricing references
- Old pricing fields are no longer used
- New system provides more flexible and maintainable pricing structure

## Best Practices

### For Admins
1. **Set Realistic Pricing**: Consider market rates and competition
2. **Use Descriptive Names**: Clear vehicle type and model names
3. **Regular Updates**: Keep pricing current with market conditions
4. **Test Calculations**: Verify fare calculations work correctly

### For Developers
1. **Validation**: Always validate pricing data before saving
2. **Error Handling**: Graceful handling of missing pricing
3. **Caching**: Consider caching frequently accessed pricing data
4. **Monitoring**: Track pricing changes and usage patterns

## Troubleshooting

### Common Issues

1. **No Pricing Found**
   - Check if pricing exists for the vehicle configuration
   - Verify category, type, and model combinations
   - Ensure pricing is marked as active

2. **Fare Calculation Errors**
   - Validate distance is a positive number
   - Check if all required pricing fields are set
   - Verify trip type is valid

3. **Admin Access Issues**
   - Ensure admin token is valid
   - Check admin permissions
   - Verify API endpoint accessibility

### Debug Information

Enable logging in development mode to see:
- API request/response details
- Pricing lookup results
- Fare calculation steps
- Error details and stack traces

## Future Enhancements

### Planned Features
1. **Dynamic Pricing**: Time-based and demand-based pricing
2. **Zone-based Pricing**: Different rates for different areas
3. **Seasonal Pricing**: Holiday and peak season adjustments
4. **Bulk Import/Export**: Excel/CSV support for pricing management
5. **Pricing Analytics**: Usage reports and optimization suggestions

### Integration Opportunities
1. **Payment Gateway**: Direct fare calculation in payment flow
2. **Booking System**: Real-time fare estimation
3. **Driver App**: Offline pricing access
4. **Customer App**: Fare preview and comparison

## Support

For technical support or questions about the pricing system:
1. Check this documentation first
2. Review the API endpoints and examples
3. Check the database schema and validation rules
4. Contact the development team for specific issues

---

*This documentation covers the Vehicle Pricing System v1.0. For updates and changes, refer to the latest version.*
