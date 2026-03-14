// ─── PaySmart API Service ────────────────────────────────────────────────────
// Native fetch-based API client with full TypeScript typings.
// Base URL is read from Vite environment variable.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3001";

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface CreditCard {
  creditCardName: string;
  rewardType: string;
  speciality: string;
  pointsAccumulationRate: number;
  primaryUsageCategory: string;
  bankName: string;
  annualCharges: number;
}

export interface RecommendationResult {
  rank: number;
  creditCardName: string;
  bankName: string;
  rewardType: string;
  speciality: string;
  annualCharges: number;
  benefitAmount: number;
  breakdown: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }

  return json.data as T;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Get all available spend categories
 */
export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/api/cards/categories`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<string[]>(response);
}

/**
 * Get all available banks
 */
export async function getBanks(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/api/cards/banks`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<string[]>(response);
}

/**
 * Get card recommendations for a specific purchase.
 */
export async function getRecommendation(
  spendCategory: string,
  amount: number
): Promise<RecommendationResult[]> {
  const response = await fetch(`${BASE_URL}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spendCategory, amount }), // Removing userId as per instructions
  });

  return handleResponse<RecommendationResult[]>(response);
}

/**
 * Get all 299 cards
 */
export async function getAllCards(): Promise<CreditCard[]> {
  const response = await fetch(`${BASE_URL}/api/cards/all`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<CreditCard[]>(response);
}

/**
 * Filter cards by bank and/or category
 */
export async function filterCards(bank?: string, category?: string): Promise<CreditCard[]> {
  const params = new URLSearchParams();
  if (bank) params.append('bank', bank);
  if (category) params.append('category', category);
  
  const response = await fetch(`${BASE_URL}/api/cards/filter?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<CreditCard[]>(response);
}

/**
 * Get spending insights and cashback analysis.
 */
export async function getInsights(): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/insights`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return handleResponse<any>(response);
}
