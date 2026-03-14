# CardWise API Documentation

> **Base URL:** `http://localhost:5000/api`

---

## Cards

### `POST /api/cards` — Add a new credit card

**Request Body:**
```json
{
  "userId": "user123",
  "bankName": "HDFC",
  "cardName": "Regalia",
  "rewardRules": [
    {
      "category": "dining",
      "rewardType": "cashback",
      "percentage": 5,
      "monthlyCap": 500,
      "pointsValue": null
    }
  ]
}
```

**Response** `201 Created`:
```json
{
  "message": "Card added successfully",
  "card": {
    "cardId": "auto-generated-id",
    "userId": "user123",
    "bankName": "HDFC",
    "cardName": "Regalia",
    "rewardRules": [ … ],
    "createdAt": "2026-03-14T09:00:00.000Z",
    "updatedAt": "2026-03-14T09:00:00.000Z"
  }
}
```

---

### `GET /api/cards/:userId` — Get all cards for a user

**URL Params:** `userId` (string)

**Response** `200 OK`:
```json
{
  "cards": [
    {
      "id": "doc-id",
      "cardId": "auto-generated-id",
      "userId": "user123",
      "bankName": "HDFC",
      "cardName": "Regalia",
      "rewardRules": [ … ],
      "createdAt": "2026-03-14T09:00:00.000Z",
      "updatedAt": "2026-03-14T09:00:00.000Z"
    }
  ]
}
```

---

### `PUT /api/cards/:cardId` — Update a card

**URL Params:** `cardId` (string)

**Request Body** (any subset of updatable fields):
```json
{
  "bankName": "ICICI",
  "cardName": "Amazon Pay",
  "rewardRules": [ … ]
}
```

**Response** `200 OK`:
```json
{
  "message": "Card updated successfully",
  "cardId": "abc123",
  "updatedFields": ["bankName", "cardName", "rewardRules", "updatedAt"]
}
```

---

### `DELETE /api/cards/:cardId` — Delete a card

**URL Params:** `cardId` (string)

**Response** `200 OK`:
```json
{
  "message": "Card deleted successfully",
  "cardId": "abc123"
}
```

---

## Recommendations

### `POST /api/recommend` — Rank all cards by spending profile

**Request Body:**
```json
{
  "spending": {
    "dining": 500,
    "groceries": 300,
    "travel": 200,
    "gas": 150,
    "online": 400
  }
}
```

**Response** `200 OK`:
```json
{
  "recommendations": [
    {
      "card": { "id": "…", "cardName": "Regalia", "bankName": "HDFC", … },
      "estimatedReward": 42.50
    }
  ]
}
```

---

### `POST /api/recommend/best` — Best card for a single purchase

**Request Body:**
```json
{
  "userId": "user123",
  "category": "dining",
  "amount": 2000
}
```

**Response** `200 OK`:
```json
{
  "userId": "user123",
  "category": "dining",
  "amount": 2000,
  "results": [
    {
      "cardName": "Regalia",
      "bankName": "HDFC",
      "rewardType": "cashback",
      "benefitAmount": 100,
      "breakdown": {
        "matchedCategory": "dining",
        "percentage": 5,
        "rawReward": 100,
        "monthlyCap": 500,
        "cappedReward": 100,
        "pointsValue": null,
        "finalBenefit": 100
      }
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in a consistent format:

| Status | Meaning | Example |
|--------|---------|---------|
| `400`  | Validation failed | `{ "error": "userId, bankName, and cardName are required" }` |
| `404`  | Resource not found | `{ "error": "Card not found" }` |
| `500`  | Server error | `{ "error": "Failed to add card" }` |
