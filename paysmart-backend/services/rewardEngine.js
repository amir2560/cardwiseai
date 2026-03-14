/**
 * Reward Calculation Engine
 *
 * Calculates the best credit card for a given purchase category and amount.
 *
 * @param {Array} cards     - Array of Card objects from MongoDB
 * @param {string} spendCategory - Purchase category (e.g. "dining", "fuel", "groceries")
 * @param {number} amount   - Purchase amount in rupees
 * @returns {Array}         - Sorted array of top 5 card benefits
 */

function calculateBestCard(cards, spendCategory, amount) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return [];
  }

  const normalizedCategory = spendCategory.toLowerCase().trim();

  // Filter cards where primaryUsageCategory matches
  const matchedCards = cards.filter(
    (card) => card.primaryUsageCategory.toLowerCase() === normalizedCategory
  );

  // If no exact match for this category, maybe we fallback to all cards? 
  // The user prompt says: "Match cards where primaryUsageCategory === spendCategory"
  const cardsToEvaluate = matchedCards.length > 0 ? matchedCards : cards;

  const results = cardsToEvaluate.map((card) => {
    const { creditCardName, bankName, rewardType, speciality, annualCharges, pointsAccumulationRate } = card;

    // Calculate raw benefit: amount * (pointsAccumulationRate / 100)
    let rawBenefit = amount * ((pointsAccumulationRate || 0) / 100);
    
    let benefitAmount = 0;
    
    // For rewardType === 'cashback': return benefit as direct rupee value
    // For rewardType === 'travel_points' or premium_points: multiply by 0.25
    // For rewardType === 'dining_rewards' or shopping_rewards or fuel_rewards: multiply by 0.50
    if (rewardType === 'cashback') {
      benefitAmount = rawBenefit;
    } else if (rewardType === 'travel_points' || rewardType === 'premium_points') {
      benefitAmount = rawBenefit * 0.25;
    } else if (rewardType === 'dining_rewards' || rewardType === 'shopping_rewards' || rewardType === 'fuel_rewards') {
      benefitAmount = rawBenefit * 0.50;
    } else {
      // Default fallback
      benefitAmount = rawBenefit * 0.25;
    }

    // Breakdown string: "₹2000 × 4.48% = ₹89.60"
    const percentageString = pointsAccumulationRate ? pointsAccumulationRate.toFixed(2) : "0.00";
    const breakdown = `₹${amount} × ${percentageString}% = ₹${benefitAmount.toFixed(2)}`;

    return {
      creditCardName,
      bankName,
      rewardType,
      speciality,
      annualCharges,
      benefitAmount: parseFloat(benefitAmount.toFixed(2)),
      breakdown
    };
  });

  // Sort by benefitAmount descending
  results.sort((a, b) => b.benefitAmount - a.benefitAmount);

  // Return top 5 cards
  return results.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}

module.exports = { calculateBestCard };
