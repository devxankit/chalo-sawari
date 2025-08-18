const mongoose = require('mongoose');
require('dotenv').config();

const testAdminSystem = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo_sawari',
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Test admin signup
    console.log('\n🧪 Testing Admin Signup...');
    
    const signupResponse = await fetch('http://localhost:5000/api/admin/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Admin',
        phone: '9876543210',
        password: 'testpass123',
        confirmPassword: 'testpass123'
      }),
    });

    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);

    if (signupResponse.ok) {
      console.log('✅ Admin signup successful!');
      
      // Test admin login
      console.log('\n🧪 Testing Admin Login...');
      
      const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '9876543210',
          password: 'testpass123'
        }),
      });

      const loginData = await loginResponse.json();
      console.log('Login Response:', loginData);

      if (loginResponse.ok) {
        console.log('✅ Admin login successful!');
        console.log('Token:', loginData.data.token);
        
        // Test protected route
        console.log('\n🧪 Testing Protected Route...');
        
        const dashboardResponse = await fetch('http://localhost:5000/api/admin/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.data.token}`,
            'Content-Type': 'application/json',
          },
        });

        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard Response Status:', dashboardResponse.status);
        console.log('Dashboard Data:', dashboardData);

        if (dashboardResponse.ok) {
          console.log('✅ Protected route access successful!');
        } else {
          console.log('❌ Protected route access failed!');
        }
      } else {
        console.log('❌ Admin login failed!');
      }
    } else {
      console.log('❌ Admin signup failed!');
    }

    console.log('\n✅ Admin system test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing admin system:', error);
    process.exit(1);
  }
};

testAdminSystem();
