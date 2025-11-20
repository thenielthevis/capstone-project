# Food Log API Documentation

## Base URL
```
/api/food-logs
```

## Authentication
All endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Create Food Log
**POST** `/create`

Save a new food analysis entry.

**Request Body:**
```json
{
  "inputMethod": "image",
  "imageBase64": "data:image/jpeg;base64,...",
  "foodName": "Grilled Chicken Salad",
  "dishName": "Caesar Salad",
  "brandedProduct": {
    "isBranded": false,
    "brandName": null,
    "productName": null,
    "ingredients": null,
    "purchaseLinks": {
      "lazada": null,
      "shopee": null,
      "puregold": null
    }
  },
  "nutritionSources": [
    {
      "source": "USDA FoodData Central",
      "url": "https://fdc.nal.usda.gov/...",
      "reliability": "high"
    }
  ],
  "recipeLinks": [
    {
      "title": "Caesar Salad Recipe",
      "source": "Google",
      "url": "https://www.google.com/search?q=..."
    }
  ],
  "calories": 350,
  "servingSize": "1 large bowl (300g)",
  "nutrients": {
    "protein": 35,
    "carbs": 20,
    "fat": 15,
    "fiber": 5,
    "sugar": 3,
    "saturatedFat": 4,
    "transFat": 0,
    "sodium": 450,
    "cholesterol": 85,
    "potassium": 450,
    "vitaminA": 25,
    "vitaminC": 15,
    "vitaminD": 0,
    "calcium": 10,
    "iron": 8
  },
  "allergyWarnings": {
    "detected": ["Gluten", "Eggs"],
    "mayContain": ["Dairy"],
    "warning": "Contains gluten and eggs"
  },
  "userAllergies": ["Gluten", "Peanuts"],
  "healthyAlternatives": [
    {
      "name": "Grilled Chicken with Quinoa",
      "reason": "Lower in sodium and calories",
      "caloriesSaved": 100
    }
  ],
  "confidence": "high",
  "notes": "Analysis based on USDA database",
  "ingredientsList": null
}
```

**Response:**
```json
{
  "message": "Food log created successfully",
  "foodLog": {
    "_id": "...",
    "userId": "...",
    "analyzedAt": "2025-11-21T10:30:00.000Z",
    ...
  }
}
```

---

### 2. Get User Food Logs
**GET** `/user`

Retrieve user's food logs with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `startDate` (ISO date string) - Filter from date
- `endDate` (ISO date string) - Filter to date
- `searchQuery` (string) - Search in food/dish/brand names
- `sortBy` (string, default: 'analyzedAt') - Sort field
- `sortOrder` ('asc'|'desc', default: 'desc') - Sort direction

**Example:**
```
GET /user?page=1&limit=20&searchQuery=chicken&sortBy=analyzedAt&sortOrder=desc
```

**Response:**
```json
{
  "message": "Food logs retrieved successfully",
  "foodLogs": [
    {
      "_id": "...",
      "userId": "...",
      "foodName": "Grilled Chicken",
      "calories": 350,
      "analyzedAt": "2025-11-21T10:30:00.000Z",
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20
  }
}
```

---

### 3. Get Food Log by ID
**GET** `/:id`

Retrieve a specific food log entry.

**Response:**
```json
{
  "message": "Food log retrieved successfully",
  "foodLog": {
    "_id": "...",
    "userId": "...",
    "foodName": "Grilled Chicken Salad",
    ...
  }
}
```

---

### 4. Get Nutrition Statistics
**GET** `/stats`

Get aggregate nutrition statistics for the user.

**Query Parameters:**
- `startDate` (ISO date string) - Stats from date
- `endDate` (ISO date string) - Stats to date
- `period` ('day'|'week'|'month'|'year', default: 'week') - Time period

**Example:**
```
GET /stats?period=week
```

**Response:**
```json
{
  "message": "Nutrition statistics retrieved successfully",
  "stats": {
    "totalLogs": 42,
    "totalCalories": 14700,
    "avgCalories": 350,
    "totalProtein": 1470,
    "totalCarbs": 840,
    "totalFat": 630,
    "totalFiber": 210,
    "totalSugar": 126,
    "totalSodium": 18900,
    "avgProtein": 35,
    "avgCarbs": 20,
    "avgFat": 15
  },
  "topFoods": [
    {
      "_id": "Grilled Chicken Salad",
      "count": 8,
      "avgCalories": 350
    },
    {
      "_id": "Oatmeal",
      "count": 6,
      "avgCalories": 250
    }
  ]
}
```

---

### 5. Update Food Log
**PATCH** `/:id`

Update specific fields of a food log entry.

**Request Body:**
```json
{
  "notes": "Added extra vegetables",
  "dishName": "Caesar Salad with Extra Chicken",
  "servingSize": "1.5 bowls"
}
```

**Response:**
```json
{
  "message": "Food log updated successfully",
  "foodLog": {
    "_id": "...",
    "notes": "Added extra vegetables",
    ...
  }
}
```

---

### 6. Delete Food Log
**DELETE** `/:id`

Delete a single food log entry.

**Response:**
```json
{
  "message": "Food log deleted successfully"
}
```

---

### 7. Delete Multiple Food Logs
**DELETE** `/bulk/delete`

Delete multiple food log entries at once.

**Request Body:**
```json
{
  "ids": ["foodLogId1", "foodLogId2", "foodLogId3"]
}
```

**Response:**
```json
{
  "message": "Food logs deleted successfully",
  "deletedCount": 3
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized"
}
```

### 404 Not Found
```json
{
  "message": "Food log not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

---

## Data Models

### FoodLog Schema
```javascript
{
  userId: ObjectId,              // Reference to User
  analyzedAt: Date,              // Analysis timestamp
  inputMethod: String,           // 'image' or 'manual'
  imageUrl: String,              // Cloudinary URL
  foodName: String,              // Food name
  dishName: String,              // Optional dish name
  brandedProduct: {
    isBranded: Boolean,
    brandName: String,
    productName: String,
    ingredients: String,
    purchaseLinks: {
      lazada: String,
      shopee: String,
      puregold: String
    }
  },
  nutritionSources: [{
    source: String,
    url: String,
    reliability: String         // 'high', 'medium', 'low'
  }],
  recipeLinks: [{
    title: String,
    source: String,
    url: String
  }],
  calories: Number,
  servingSize: String,
  nutrients: {
    protein: Number,            // grams
    carbs: Number,              // grams
    fat: Number,                // grams
    fiber: Number,              // grams
    sugar: Number,              // grams
    saturatedFat: Number,       // grams
    transFat: Number,           // grams
    sodium: Number,             // milligrams
    cholesterol: Number,        // milligrams
    potassium: Number,          // milligrams
    vitaminA: Number,           // % daily value
    vitaminC: Number,           // % daily value
    vitaminD: Number,           // % daily value
    calcium: Number,            // % daily value
    iron: Number                // % daily value
  },
  allergyWarnings: {
    detected: [String],
    mayContain: [String],
    warning: String
  },
  userAllergies: [String],
  healthyAlternatives: [{
    name: String,
    reason: String,
    caloriesSaved: Number
  }],
  confidence: String,           // 'high', 'medium', 'low'
  notes: String,
  ingredientsList: String,
  createdAt: Date,              // Auto-generated
  updatedAt: Date               // Auto-generated
}
```

---

## Usage Examples

### JavaScript/TypeScript (using axios)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://your-api-url/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Create food log
const createLog = async (foodData) => {
  const response = await api.post('/food-logs/create', foodData);
  return response.data;
};

// Get user logs with search
const getLogs = async (searchQuery) => {
  const response = await api.get('/food-logs/user', {
    params: {
      page: 1,
      limit: 20,
      searchQuery,
      sortBy: 'analyzedAt',
      sortOrder: 'desc'
    }
  });
  return response.data;
};

// Get nutrition stats for last 7 days
const getStats = async () => {
  const response = await api.get('/food-logs/stats', {
    params: { period: 'week' }
  });
  return response.data;
};
```

### cURL Examples
```bash
# Create food log
curl -X POST http://localhost:5000/api/food-logs/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"foodName":"Apple","calories":95,...}'

# Get user logs
curl -X GET "http://localhost:5000/api/food-logs/user?page=1&limit=20" \
  -H "Authorization: Bearer <token>"

# Get nutrition stats
curl -X GET "http://localhost:5000/api/food-logs/stats?period=week" \
  -H "Authorization: Bearer <token>"

# Delete food log
curl -X DELETE http://localhost:5000/api/food-logs/<id> \
  -H "Authorization: Bearer <token>"
```

---

## Notes

1. **Image Upload**: Images are uploaded to Cloudinary automatically when `imageBase64` is provided
2. **Pagination**: Default limit is 20 items per page to maintain performance
3. **Search**: Search is case-insensitive and searches across food name, dish name, brand name, and product name
4. **Date Filters**: Use ISO 8601 format for dates (e.g., "2025-11-21T00:00:00.000Z")
5. **Bulk Operations**: Use bulk delete for efficiency when removing multiple entries
6. **Statistics**: Stats calculation uses MongoDB aggregation for optimal performance
