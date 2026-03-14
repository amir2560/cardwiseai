const mongoose = require('mongoose')

const RewardRuleSchema = new mongoose.Schema({
  category:    String,
  rewardType:  String,   // 'cashback' or 'points'
  percentage:  Number,
  monthlyCap:  Number,
  pointsValue: Number
})

const CardSchema = new mongoose.Schema({
  userId:      String,
  bankName:    String,
  cardName:    String,
  rewardRules: [RewardRuleSchema]
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.cardId = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
})

module.exports = mongoose.model('Card', CardSchema)
