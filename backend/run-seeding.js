#!/usr/bin/env node

console.log('🚀 Starting ChaloSawari Vehicle Pricing Seeding...\n');

// Import and run the seeding
const { seedDatabase } = require('./seed-comprehensive-pricing');

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
