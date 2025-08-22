const Booking = require('../models/Booking');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../middleware/asyncHandler');
const puppeteer = require('puppeteer');

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in kilometers
  
  // Use latitude and longitude properties (matching frontend payload)
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    pickup,
    destination,
    date,
    time,
    passengers = 1,
    specialRequests = '',
    paymentMethod
  } = req.body;

  // Validate required fields
  if (!vehicleId || !pickup || !destination || !date || !time || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: vehicleId, pickup, destination, date, time, paymentMethod'
    });
  }

  // Normalize date to YYYY-MM-DD format
  const normalizedDate = date.split('T')[0];

  // Validate time format (HH:MM or HH:MM:SS)
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(time)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid time format. Please use HH:MM format (e.g., 09:00)',
        statusCode: 400
      }
    });
  }

  // Validate vehicle exists and get driver info
  const vehicle = await Vehicle.findById(vehicleId).populate('driver');
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  if (!vehicle.driver) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle has no assigned driver'
    });
  }

  // Validate coordinates are valid numbers
  if (isNaN(pickup.latitude) || isNaN(pickup.longitude) || 
      isNaN(destination.latitude) || isNaN(destination.longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates provided. Latitude and longitude must be valid numbers.'
    });
  }

  // Calculate distance
  const distance = calculateDistance(pickup, destination);
  
  // Validate distance calculation
  if (isNaN(distance) || distance <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Unable to calculate distance. Please check coordinates.'
    });
  }
  
  // Calculate total amount using vehicle pricing
  let totalAmount = 0;
  let ratePerKm = 0;
  
  try {
    // Get trip type from request or default to one-way
    const tripType = req.body.tripType || 'one-way';
    
    // Calculate fare based on vehicle type and pricing
    if (vehicle.pricingReference?.category === 'auto') {
      // For auto vehicles, use fixed auto price
      const autoPricing = vehicle.pricing?.autoPrice;
      if (tripType === 'return') {
        totalAmount = autoPricing?.return || autoPricing?.oneWay || 0;
        ratePerKm = totalAmount / distance; // Calculate rate for display
      } else {
        totalAmount = autoPricing?.oneWay || autoPricing?.return || 0;
        ratePerKm = totalAmount / distance; // Calculate rate for display
      }
    } else {
      // For car and bus vehicles, calculate distance-based pricing
      const distancePricing = vehicle.pricing?.distancePricing;
      if (distancePricing) {
        // Try multiple possible trip type keys
        let pricing = distancePricing[tripType];
        if (!pricing) {
          pricing = distancePricing['oneWay'] || 
                    distancePricing['one-way'] || 
                    distancePricing['oneway'] ||
                    distancePricing['return'] ||
                    Object.values(distancePricing)[0];
        }
        
        if (pricing) {
          // Determine rate based on distance tier
          if (distance <= 50 && pricing['50km']) {
            ratePerKm = pricing['50km'];
          } else if (distance <= 100 && pricing['100km']) {
            ratePerKm = pricing['100km'];
          } else if (distance <= 150 && pricing['150km']) {
            ratePerKm = pricing['150km'];
          } else if (pricing['150km']) {
            ratePerKm = pricing['150km'];
          } else if (pricing['100km']) {
            ratePerKm = pricing['100km'];
          } else if (pricing['50km']) {
            ratePerKm = pricing['50km'];
          }
          
          totalAmount = ratePerKm * distance;
        }
      }
    }
    
    // Round total amount to whole rupees (no decimal places)
    totalAmount = Math.round(totalAmount);
    ratePerKm = Math.round(ratePerKm);
    
    if (totalAmount === 0 || isNaN(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate fare. Please check vehicle pricing.'
      });
    }
    
  } catch (error) {
    console.error('Error calculating fare:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating fare'
    });
  }

  // Determine if this is a partial payment booking (bus/car with cash method)
  const isPartialPayment = (vehicle.pricingReference?.category !== 'auto' && paymentMethod === 'cash');
  
  // Calculate partial payment amounts (30% online, 70% cash)
  const onlineAmount = isPartialPayment ? Math.round(totalAmount * 0.3) : 0;
  const cashAmount = isPartialPayment ? Math.round(totalAmount * 0.7) : totalAmount;
  
  // Create booking with the new structure
  const booking = new Booking({
    user: req.user.id,
    driver: vehicle.driver._id,
    vehicle: vehicleId,
    tripDetails: {
      pickup: {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        address: pickup.address
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        address: destination.address
      },
      date: normalizedDate,
      time: time,
      passengers: passengers,
      distance: distance,
      duration: Math.round(distance * 2)
    },
    pricing: {
      basePrice: vehicle.pricing?.basePrice,
      perKmPrice: vehicle.pricing?.perKmPrice,
      ratePerKm: ratePerKm,
      distance: distance,
      totalAmount: totalAmount
    },
    payment: {
      method: paymentMethod,
      status: 'pending',
      isPartialPayment: isPartialPayment,
      partialPaymentDetails: isPartialPayment ? {
        onlineAmount: onlineAmount,
        cashAmount: cashAmount,
        onlinePaymentStatus: 'pending',
        cashPaymentStatus: 'pending'
      } : undefined
    },
    status: 'pending'
  });

  await booking.save();

  // Update vehicle availability (mark as booked)
  await vehicle.markAsBooked(booking._id);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      totalAmount: booking.pricing.totalAmount,
      status: booking.status
    }
  });
});

// @desc    Test Puppeteer functionality
// @route   GET /api/bookings/test-puppeteer
// @access  Private
const testPuppeteer = async (req, res, next) => {
  try {
    console.log('Testing Puppeteer functionality...');
    
    if (!puppeteer) {
      return res.status(500).json({
        success: false,
        message: 'Puppeteer is not available'
      });
    }
    
    // Try to launch browser
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('Page created successfully');
    
    // Set simple content
    await page.setContent('<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>');
    console.log('Content set successfully');
    
    // Generate simple PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    
    await browser.close();
    console.log('Browser closed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Puppeteer is working correctly',
      pdfSize: pdfBuffer.length
    });
    
  } catch (error) {
    console.error('Puppeteer test failed:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Puppeteer test failed',
      error: error.message,
      stack: error.stack
    });
  }
};

// @desc    Get booking receipt
// @route   GET /api/bookings/:id/receipt
// @access  Private (User/Driver)
const getBookingReceipt = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'driver', select: 'firstName lastName phone' },
      { path: 'vehicle', select: 'type brand model color registrationNumber' }
    ]);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user owns this booking or is the driver
  if (booking.user._id.toString() !== req.user.id && 
      (!req.user.role || req.user.role !== 'driver' || booking.driver._id.toString() !== req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this booking'
    });
  }

  try {
    // Extract receipt data
    const receiptData = {
      bookingNumber: booking.bookingNumber,
      bookingDate: new Date(booking.createdAt).toLocaleDateString('en-IN'),
      from: booking.tripDetails?.pickup?.address || 'N/A',
      to: booking.tripDetails?.destination?.address || 'N/A',
      pickupDate: (() => {
        // Try multiple paths to get the date
        const date = booking.tripDetails?.pickup?.date || 
                    booking.tripDetails?.date || 
                    booking.date || 
                    booking.pickupDate || 
                    booking.departureDate;
        return date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
      })(),
      pickupTime: (() => {
        // Try multiple paths to get the time
        const time = booking.tripDetails?.pickup?.time || 
                    booking.tripDetails?.time || 
                    booking.time || 
                    booking.pickupTime || 
                    booking.departureTime;
        return time || 'N/A';
      })(),
      passengers: booking.tripDetails?.passengers || 'N/A',
      distance: `${booking.tripDetails?.distance || 'N/A'} km`,
      duration: `${booking.tripDetails?.duration || 'N/A'} min`,
      status: booking.status || 'N/A',
      paymentMethod: booking.payment?.method || 'N/A',
      paymentStatus: booking.payment?.status || 'N/A',
      customerName: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim() || 'N/A',
      customerPhone: booking.user?.phone || 'N/A',
      customerEmail: booking.user?.email || 'N/A',
      driverName: `${booking.driver?.firstName || ''} ${booking.driver?.lastName || ''}`.trim() || 'N/A',
      driverPhone: booking.driver?.phone || 'N/A',
      vehicleType: booking.vehicle?.type || 'N/A',
      vehicleInfo: `${booking.vehicle?.brand || ''} ${booking.vehicle?.model || ''}`.trim() || 'N/A',
      vehicleRegistration: booking.vehicle?.registrationNumber || 'N/A',
      ratePerKm: `₹${booking.pricing?.perKmPrice || 'N/A'}`,
      totalAmount: `₹${booking.pricing?.totalAmount || 'N/A'}`
    };

    // Generate HTML template for receipt
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Receipt - ${receiptData.bookingNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #ffffff; 
            color: #000000;
          }
          .receipt { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border: 2px solid #3b82f6;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #3b82f6; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #3b82f6; 
            margin-bottom: 10px; 
          }
          .subtitle { 
            color: #6b7280; 
            font-size: 16px; 
          }
          .booking-info { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 25px; 
            text-align: center;
          }
          .info-grid { 
            display: block; 
            margin-bottom: 25px; 
          }
          .info-section { 
            margin-bottom: 25px; 
            border: 1px solid #e5e7eb;
            padding: 15px;
          }
          .info-section h3 { 
            color: #1f2937; 
            border-bottom: 1px solid #e5e7eb; 
            padding-bottom: 8px; 
            margin-bottom: 15px; 
            margin-top: 0;
          }
          .info-row { 
            display: block; 
            margin-bottom: 8px; 
            padding: 5px 0;
          }
          .info-label { 
            font-weight: 600; 
            color: #374151; 
            display: inline-block;
            width: 150px;
          }
          .info-value { 
            color: #1f2937; 
            display: inline-block;
          }
          .total-section { 
            background: #3b82f6; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px;
          }
          .total-amount { 
            font-size: 24px; 
            font-weight: bold; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #6b7280; 
            font-size: 14px; 
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">CHALO SAWARI</div>
            <div class="subtitle">Your Journey Partner</div>
            <div style="margin-top: 15px; font-size: 18px; color: #1f2937;">Booking Receipt</div>
          </div>
          
          <div class="booking-info">
            <div style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">${receiptData.bookingNumber}</div>
            <div style="color: #6b7280;">Booking Date: ${receiptData.bookingDate}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-section">
              <h3>Journey Details</h3>
              <div class="info-row">
                <span class="info-label">From:</span>
                <span class="info-value">${receiptData.from || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">To:</span>
                <span class="info-value">${receiptData.to || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${receiptData.pickupDate || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">${receiptData.pickupTime || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Passengers:</span>
                <span class="info-value">${receiptData.passengers || 'N/A'}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Trip Information</h3>
              <div class="info-row">
                <span class="info-label">Distance:</span>
                <span class="info-value">${receiptData.distance || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">${receiptData.duration || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${receiptData.status || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">${receiptData.paymentMethod || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span class="info-value">${receiptData.paymentStatus || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Customer Details</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${receiptData.customerName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${receiptData.customerPhone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${receiptData.customerEmail || 'N/A'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Driver Details</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${receiptData.driverName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${receiptData.driverPhone || 'N/A'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Vehicle Details</h3>
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span class="info-value">${receiptData.vehicleType || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Model:</span>
              <span class="info-value">${receiptData.vehicleInfo || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registration:</span>
              <span class="info-value">${receiptData.vehicleRegistration || 'N/A'}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h3>Pricing Breakdown</h3>
            <div class="info-row">
              <span class="info-label">Distance:</span>
              <span class="info-value">${receiptData.distance || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rate per km:</span>
              <span class="info-value">${receiptData.ratePerKm || 'N/A'}</span>
            </div>
          </div>
          
          <div class="total-section">
            <div style="font-size: 16px; margin-bottom: 10px;">Total Amount</div>
            <div class="total-amount">${receiptData.totalAmount || 'N/A'}</div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Chalo Sawari!</p>
            <p>For support, contact us at support@chalosawari.com</p>
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      console.log('Starting PDF generation for booking:', receiptData.bookingNumber);
      
      // Test if Puppeteer is working
      console.log('Testing Puppeteer availability...');
      if (!puppeteer) {
        throw new Error('Puppeteer is not available');
      }
      
      // Try alternative PDF generation method first (more reliable)
      try {
        console.log('Attempting alternative PDF generation...');
        
        const browser = await puppeteer.launch({ 
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-plugins',
            '--no-first-run'
          ]
        });
        
        const page = await browser.newPage();
        
        // Set content with simpler approach
        await page.setContent(htmlTemplate);
        
        // Wait for content to be ready
        await page.waitForTimeout(1000);
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        });
        
        await browser.close();
        
        if (pdfBuffer && pdfBuffer.length > 0) {
          console.log('Alternative PDF generation successful, buffer size:', pdfBuffer.length);
          
          // Set response headers for PDF download
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="receipt_${receiptData.bookingNumber}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          res.setHeader('Cache-Control', 'no-cache');
          
          // Send the PDF buffer
          res.send(pdfBuffer);
          console.log('PDF response sent successfully');
          return;
        }
      } catch (altError) {
        console.log('Alternative PDF generation failed, trying main method:', altError.message);
      }
      
      // Main PDF generation method
      console.log('Using main PDF generation method...');
      
      // Generate PDF using Puppeteer with optimized settings
      const browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });
      
      console.log('Browser launched successfully');
      
      const page = await browser.newPage();
      console.log('Page created successfully');
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // Set content and wait for it to load
      console.log('Setting HTML content...');
      await page.setContent(htmlTemplate, { 
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000
      });
      
      console.log('HTML content set, waiting for render...');
      
      // Wait a bit more to ensure everything is rendered
      await page.waitForTimeout(2000);
      
      console.log('Generating PDF...');
      
      // Generate PDF with optimized settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });
      
      console.log('PDF generated successfully, buffer size:', pdfBuffer.length);
      
      await browser.close();
      console.log('Browser closed successfully');

      // Verify PDF was generated successfully
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF generation failed - empty buffer');
      }

      console.log('Sending PDF response...');
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt_${receiptData.bookingNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send the PDF buffer
      res.send(pdfBuffer);
      console.log('PDF response sent successfully');

    } catch (pdfError) {
      console.error('All PDF generation methods failed with error:', pdfError.message);
      console.error('Error stack:', pdfError.stack);
      
      // Check if it's a system compatibility issue
      if (pdfError.message.includes('Failed to launch') || 
          pdfError.message.includes('executable') ||
          pdfError.message.includes('chromium')) {
        console.error('This appears to be a system compatibility issue with Puppeteer');
        console.error('Common solutions:');
        console.error('1. Install system dependencies: sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget');
        console.error('2. Or use Docker with Puppeteer pre-installed');
      }
      
      // Fallback: Return HTML receipt that user can print
      console.log('Providing HTML fallback...');
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="receipt_${receiptData.bookingNumber}.html"`);
      
      // Add print button to HTML
      const htmlWithPrint = htmlTemplate.replace(
        '</body>',
        `
        <div style="text-align: center; margin-top: 20px; padding: 20px;">
          <button onclick="window.print()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
            🖨️ Print Receipt
          </button>
          <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">
            Click the button above to print this receipt
          </p>
          <p style="margin-top: 10px; color: #ef4444; font-size: 12px;">
            Note: PDF generation failed due to system compatibility. Please print this HTML receipt instead.
          </p>
        </div>
        </body>
        `
      );
      
      res.send(htmlWithPrint);
      console.log('HTML fallback sent successfully');
    }

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating receipt'
    });
  }
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private (User)
const getUserBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: req.user.id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate([
        { path: 'driver', select: 'firstName lastName phone rating' },
        { path: 'vehicle', select: 'type brand model color registrationNumber' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      docs: bookings,
      totalDocs: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: skip + bookings.length < total,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (User/Driver)
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate([
      { path: 'user', select: 'firstName lastName phone email' },
      { path: 'driver', select: 'firstName lastName phone rating' },
      { path: 'vehicle', select: 'type brand model color registrationNumber' }
    ]);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user is authorized to view this booking
  if (req.user && booking.user.toString() !== req.user.id) {
    if (req.driver && booking.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (User)
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking'
    });
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel booking in current status'
    });
  }

  // Update booking status with proper tracking
  booking.status = 'cancelled';
  booking._updatedByModel = 'User';
  booking._updatedBy = req.user.id;
  booking._statusReason = reason;
  
  // Add cancellation details
  booking.cancellation = {
    cancelledBy: req.user.id,
    cancelledByModel: 'User',
    cancelledAt: new Date(),
    reason: reason,
    refundAmount: booking.pricing.totalAmount,
    refundStatus: 'pending'
  };
  
  await booking.save();

  // Vehicle status will be automatically updated by the pre-save middleware
  // No need to manually update vehicle here

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (User/Driver)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user is authorized to update this booking
  if (req.user && booking.user.toString() !== req.user.id) {
    if (req.driver && booking.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }
  }

  // Update status with proper tracking
  const oldStatus = booking.status;
  booking.status = status;
  
  // Set tracking information based on who is updating
  if (req.user) {
    booking._updatedByModel = 'User';
    booking._updatedBy = req.user.id;
  } else if (req.driver) {
    booking._updatedByModel = 'Driver';
    booking._updatedBy = req.driver.id;
  }
  
  // Add reason if provided
  if (req.body.reason) {
    booking._statusReason = req.body.reason;
  }
  
  // Add notes if provided
  if (req.body.notes) {
    booking._statusNotes = req.body.notes;
  }
  
  await booking.save();

  // Vehicle status will be automatically updated by the pre-save middleware

  res.json({
    success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
});

// @desc    Mark cash payment as collected (for partial payment bookings)
// @route   PUT /api/bookings/:id/collect-cash-payment
// @access  Private (Driver only)
const collectCashPayment = asyncHandler(async (req, res) => {
  console.log('=== COLLECT CASH PAYMENT ===');
  console.log('Request params:', req.params);
  console.log('Request driver:', req.driver);
  console.log('Request user:', req.user);
  
  const booking = await Booking.findById(req.params.id);
  console.log('Booking found:', booking ? 'Yes' : 'No');
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  console.log('Booking driver ID:', booking.driver);
  console.log('Request driver ID:', req.driver?.id);
  console.log('Driver IDs match:', req.driver ? booking.driver.toString() === req.driver.id : 'No driver in request');

  // Only drivers can collect cash payments
  if (!req.driver || booking.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the assigned driver can collect cash payments'
    });
  }

  // Check if this is a partial payment booking
  if (!booking.payment.isPartialPayment) {
    return res.status(400).json({
      success: false,
      message: 'This booking does not have partial payment setup'
    });
  }

  // Check if online payment is completed
  if (booking.payment.partialPaymentDetails.onlinePaymentStatus !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Online payment must be completed before collecting cash payment'
    });
  }

  // Check if cash payment is already collected
  if (booking.payment.partialPaymentDetails.cashPaymentStatus === 'collected') {
    return res.status(400).json({
      success: false,
      message: 'Cash payment has already been collected'
    });
  }

  // Mark cash payment as collected
  booking.payment.partialPaymentDetails.cashPaymentStatus = 'collected';
  booking.payment.partialPaymentDetails.cashCollectedAt = new Date();
  booking.payment.partialPaymentDetails.cashCollectedBy = req.driver.id;
  booking.payment.partialPaymentDetails.cashCollectedByModel = 'Driver';

  // Update overall payment status to completed if both payments are done
  if (booking.payment.partialPaymentDetails.onlinePaymentStatus === 'completed' && 
      booking.payment.partialPaymentDetails.cashPaymentStatus === 'collected') {
    booking.payment.status = 'completed';
  }

  await booking.save();

  res.json({
    success: true,
    message: 'Cash payment marked as collected successfully',
    data: {
      bookingId: booking._id,
      cashAmount: booking.payment.partialPaymentDetails.cashAmount,
      totalAmount: booking.pricing.totalAmount,
      paymentStatus: booking.payment.status
    }
  });
});

module.exports = {
  createBooking,
  getBookingReceipt,
  cancelBooking,
  updateBookingStatus,
  collectCashPayment,
  testPuppeteer
};
