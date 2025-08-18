const mongoose = require('mongoose');

const connectDB = async () => {
  try {
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
    console.log(`🔌 Connection State: ${conn.connection.readyState}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('🎉 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });

    // One-time fix: drop invalid compound multikey index on Vehicle.operatingArea
    try {
      const Vehicle = require('../models/Vehicle');
      const indexes = await Vehicle.collection.indexes();
      const badIndexName = 'operatingArea.cities_1_operatingArea.states_1';
      const hasBad = indexes.some(ix => ix.name === badIndexName);
      if (hasBad) {
        await Vehicle.collection.dropIndex(badIndexName);
        console.log(`🧹 Dropped invalid Vehicle index: ${badIndexName}`);
      }
    } catch (fixErr) {
      // Non-fatal: log and continue
      console.log('ℹ️ Vehicle index check:', fixErr?.message || fixErr);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('🔍 Error details:', error);
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
