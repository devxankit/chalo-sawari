const mongoose = require('mongoose');
require('dotenv').config();

const fixDatabase = async () => {
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

    // Get the database instance
    const db = mongoose.connection.db;

    // Drop the problematic email index
    try {
      await db.collection('users').dropIndex('email_1');
      console.log('✅ Dropped email_1 index successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ email_1 index does not exist, skipping...');
      } else {
        console.log('⚠️ Error dropping email_1 index:', error.message);
      }
    }

    // Drop the compound index that includes email
    try {
      await db.collection('users').dropIndex('email_1_phone_1');
      console.log('✅ Dropped email_1_phone_1 index successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ email_1_phone_1 index does not exist, skipping...');
      } else {
        console.log('⚠️ Error dropping email_1_phone_1 index:', error.message);
      }
    }

    // Create new indexes without email
    try {
      await db.collection('users').createIndex({ phone: 1 }, { unique: true });
      console.log('✅ Created phone_1 unique index');
      
      await db.collection('users').createIndex({ isActive: 1, isVerified: 1 });
      console.log('✅ Created isActive_1_isVerified_1 index');
    } catch (error) {
      console.log('⚠️ Error creating new indexes:', error.message);
    }

    console.log('✅ Database fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
};

fixDatabase();
