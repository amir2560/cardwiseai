require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const CreditCard = require('../models/CreditCard');
const connectDB = require('../config/db');

const SEED_FILE = path.join(__dirname, '../data/credit_card_reward.csv');

async function seedDatabase() {
  await connectDB();
  
  console.log('Dropping existing CreditCard collection...');
  await CreditCard.deleteMany({});
  
  const cards = [];
  
  console.log(`Reading CSV from ${SEED_FILE}...`);
  fs.createReadStream(SEED_FILE)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }))
    .on('data', (row) => {
      cards.push({
        creditCardName: row.credit_card_name,
        rewardType: row.reward_type,
        speciality: row.speciality,
        pointsAccumulationRate: Number(row.points_accumulation_rate) || 0,
        primaryUsageCategory: row.primary_usage_category,
        bankName: row.bank_name,
        annualCharges: Number(row.annual_charges_in_inr) || 0
      });
    })
    .on('end', async () => {
      try {
        console.log(`Inserting ${cards.length} cards into MongoDB...`);
        await CreditCard.insertMany(cards);
        console.log('✅ Seeding completed successfully!');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
      }
    })
    .on('error', (err) => {
      console.error('❌ Error reading CSV file:', err);
      process.exit(1);
    });
}

seedDatabase();
