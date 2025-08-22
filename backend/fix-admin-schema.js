const mongoose = require('mongoose');
require('dotenv').config();

const fixAdminSchema = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo_sawari'
    );
    console.log('✅ Connected to MongoDB');

    // Get the Admin collection
    const adminCollection = mongoose.connection.collection('admins');
    
    // List all indexes
    const indexes = await adminCollection.indexes();
    console.log('📋 Current indexes:', indexes.map(ix => ix.name));

    // Find and drop the problematic email index
    const emailIndex = indexes.find(ix => ix.name === 'email_1');
    if (emailIndex) {
      console.log('🗑️ Dropping problematic email index...');
      await adminCollection.dropIndex('email_1');
      console.log('✅ Email index dropped successfully');
    } else {
      console.log('ℹ️ No problematic email index found');
    }

    // List indexes again to confirm
    const updatedIndexes = await adminCollection.indexes();
    console.log('📋 Updated indexes:', updatedIndexes.map(ix => ix.name));

    console.log('✅ Admin schema fix completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin schema:', error);
    process.exit(1);
  }
};

fixAdminSchema();
