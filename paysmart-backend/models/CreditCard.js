const mongoose = require('mongoose');

const CreditCardSchema = new mongoose.Schema({
  creditCardName: String,
  rewardType: String,
  speciality: String,
  pointsAccumulationRate: Number,
  primaryUsageCategory: String,
  bankName: String,
  annualCharges: Number
}, { timestamps: true });

// Add indexes for fast querying as requested
CreditCardSchema.index({ bankName: 1 });
CreditCardSchema.index({ primaryUsageCategory: 1 });

module.exports = mongoose.model('CreditCard', CreditCardSchema);
