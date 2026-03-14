/**
 * rewardEngine.js
 * ──────────────────────────────────────────────────────────────
 * Core recommendation logic.
 * Takes a list of credit cards and the user's monthly spending
 * breakdown, then scores and ranks each card by estimated rewards.
 *
 * Also exposes `calculateBestCard` — a single-purchase engine
 * that compares every card for one specific purchase and returns
 * a ranked list with a full calculation breakdown.
 */

// ═══════════════════════════════════════════════════════════════
//  EXISTING HELPERS  (unchanged)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate the total estimated reward value for a single card
 * given the user's spending.
 *
 * @param {Object} card          - Card document from Firestore
 * @param {Object} card.rewardRates - { category: multiplier }  e.g. { dining: 3, groceries: 2 }
 * @param {Object} spending      - { category: amountInUSD }    e.g. { dining: 500 }
 * @returns {number} Total estimated reward value (in dollars / points)
 */
function calculateRewardValue(card, spending) {
  const rates = card.rewardRates || {};
  const defaultRate = rates.default || 1; // fallback 1× on uncategorized spend
  let totalReward = 0;

  for (const [category, amount] of Object.entries(spending)) {
    const rate = rates[category] || defaultRate;
    totalReward += amount * (rate / 100); // treat rate as a percentage
  }

  return Math.round(totalReward * 100) / 100; // two-decimal precision
}

/**
 * Rank an array of cards by their estimated reward value (descending).
 *
 * @param {Array}  cards    - Array of card objects from Firestore
 * @param {Object} spending - User's spending breakdown
 * @returns {Array} Sorted array of { card, estimatedReward }
 */
function rankCards(cards, spending) {
  const scored = cards.map((card) => ({
    card,
    estimatedReward: calculateRewardValue(card, spending),
  }));

  // Sort descending by estimatedReward
  scored.sort((a, b) => b.estimatedReward - a.estimatedReward);

  return scored;
}

// ═══════════════════════════════════════════════════════════════
//  NEW — SINGLE-PURCHASE BEST-CARD ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * calculateBestCard
 * ─────────────────
 * Given a list of credit-card objects, a purchase category, and
 * a purchase amount (in ₹), determine which card yields the
 * highest reward and return a ranked breakdown.
 *
 * ── Card object shape (from Firestore / addCard controller) ──
 * {
 *   cardName   : "Regalia",
 *   bankName   : "HDFC",
 *   rewardRules: [
 *     {
 *       category   : "dining",         // spending category
 *       rewardType : "cashback",       // "cashback" | "points"
 *       percentage : 5,                // reward rate (%)
 *       monthlyCap : 500,              // max reward per month (₹)
 *       pointsValue: null              // ₹ value of 1 point (only for "points")
 *     },
 *     …
 *   ]
 * }
 *
 * @param {Array}  cards             - Array of card objects
 * @param {string} purchaseCategory  - e.g. "dining", "fuel", "groceries"
 * @param {number} purchaseAmount    - Purchase amount in ₹
 *
 * @returns {Array} Sorted (best-first) array of result objects:
 *   {
 *     cardName      : string,
 *     bankName      : string,
 *     rewardType    : "cashback" | "points",
 *     benefitAmount : number,          // final benefit in ₹
 *     breakdown     : {                // step-by-step calculation
 *       matchedCategory : string,
 *       percentage      : number,
 *       rawReward       : number,
 *       monthlyCap      : number|null,
 *       cappedReward    : number,
 *       pointsValue     : number|null,
 *       finalBenefit    : number
 *     }
 *   }
 */
function calculateBestCard(cards, purchaseCategory, purchaseAmount) {

  // ── Step 1 ─ Normalise the category string so comparisons are
  //             case-insensitive (e.g. "Dining" matches "dining").
  const category = purchaseCategory.trim().toLowerCase();

  // ── Step 2 ─ Iterate over every card and compute the benefit.
  const results = cards.map((card) => {

    // 2a. Extract the card's reward rules; default to an empty
    //     array if the field is missing or null.
    const rules = card.rewardRules || [];

    // 2b. Try to find a reward rule whose category matches the
    //     purchase category exactly (case-insensitive).
    let matchedRule = rules.find(
      (rule) => rule.category && rule.category.trim().toLowerCase() === category
    );

    // 2c. If no category-specific rule exists, fall back to the
    //     generic "other" rule (a catch-all rate the card may define).
    if (!matchedRule) {
      matchedRule = rules.find(
        (rule) => rule.category && rule.category.trim().toLowerCase() === 'other'
      );
    }

    // 2d. If the card has no applicable rule at all, its benefit
    //     is ₹0 — we still include it in the results so the caller
    //     can see that the card was considered.
    if (!matchedRule) {
      return {
        cardName: card.cardName || 'Unknown Card',
        bankName: card.bankName || 'Unknown Bank',
        rewardType: 'none',
        benefitAmount: 0,
        breakdown: {
          matchedCategory: null,
          percentage: 0,
          rawReward: 0,
          monthlyCap: null,
          cappedReward: 0,
          pointsValue: null,
          finalBenefit: 0,
        },
      };
    }

    // ── Step 3 ─ Calculate the raw (uncapped) reward.
    //    Formula:  rawReward = purchaseAmount × (percentage / 100)
    //    Example:  ₹2 000 × 5% = ₹100
    const percentage = matchedRule.percentage || 0;
    const rawReward = purchaseAmount * (percentage / 100);

    // ── Step 4 ─ Apply the monthly cap.
    //    If a monthlyCap is defined (and is > 0), the reward
    //    must not exceed that cap.  Otherwise we use the raw value.
    const monthlyCap = matchedRule.monthlyCap || null;
    const cappedReward =
      monthlyCap !== null && monthlyCap > 0
        ? Math.min(rawReward, monthlyCap)
        : rawReward;

    // ── Step 5 ─ Convert to a rupee value.
    //    • For "cashback" cards the capped reward is already in ₹.
    //    • For "points"  cards each point has a monetary value
    //      defined by `pointsValue` (₹ per point).  The capped
    //      reward represents the number of reward-points earned,
    //      so:  finalBenefit = cappedReward × pointsValue
    const rewardType = matchedRule.rewardType || 'cashback';
    const pointsValue = matchedRule.pointsValue || null;

    let finalBenefit;
    if (rewardType === 'points' && pointsValue) {
      // Points earned × rupee value of each point
      finalBenefit = cappedReward * pointsValue;
    } else {
      // Cashback — already denominated in ₹
      finalBenefit = cappedReward;
    }

    // Round to two decimal places for clean output
    finalBenefit = Math.round(finalBenefit * 100) / 100;

    // ── Step 6 ─ Return the result with a full breakdown so the
    //             caller (or the UI) can display the calculation.
    return {
      cardName: card.cardName || 'Unknown Card',
      bankName: card.bankName || 'Unknown Bank',
      rewardType,
      benefitAmount: finalBenefit,
      breakdown: {
        matchedCategory: matchedRule.category,    // which rule was used
        percentage,                               // reward rate (%)
        rawReward:                                // reward before cap
          Math.round(rawReward * 100) / 100,
        monthlyCap,                               // cap limit (₹) or null
        cappedReward:                             // reward after cap
          Math.round(cappedReward * 100) / 100,
        pointsValue,                              // ₹ per point or null
        finalBenefit,                             // final ₹ benefit
      },
    };
  });

  // ── Step 7 ─ Sort the results in descending order of benefit
  //             so the best card appears first.
  results.sort((a, b) => b.benefitAmount - a.benefitAmount);

  return results;
}

// ── Exports ──────────────────────────────────────────────────
module.exports = { rankCards, calculateRewardValue, calculateBestCard };
