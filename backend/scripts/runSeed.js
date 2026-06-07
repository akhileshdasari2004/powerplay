import 'dotenv/config';
import mongoose from 'mongoose';
import { seedDatabase } from '../src/seed/seedDatabase.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');
    await seedDatabase({ onlyIfEmpty: false });
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

run();
