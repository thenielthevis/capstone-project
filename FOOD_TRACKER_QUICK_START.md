# Food Calorie Tracker - Quick Start Guide

## What's New

✅ **Public Database Integration**: Now uses USDA FoodData Central, Nutritionix, and MyFitnessPal data before guessing
✅ **Auto-Save**: All food analyses are automatically saved to your account
✅ **History View**: Browse and search all your previous food logs
✅ **Better Accuracy**: Prioritizes verified nutrition data over AI estimates

---

## For End Users

### Analyzing Food

1. **Open the Food Tracker** in the app
2. Choose your input method:
   - **Upload Image**: Take a photo or select from gallery
   - **Manual Input**: Type in ingredients

3. **Optional Enhancements**:
   - Add a dish name for better accuracy
   - Select your allergies to get warnings

4. **Analyze**: Tap the analyze button
5. **Results**: View detailed nutrition information
   - Your analysis is automatically saved to history!

### Viewing History

1. Tap the **History** tab
2. **Search**: Use the search bar to find specific foods
3. **Browse**: Scroll through your past meals
4. **Details**: Tap any item to see full analysis
5. **Refresh**: Pull down to refresh the list

---

## For Developers

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Variables**
Ensure `.env` has:
```
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

3. **Start Server**
```bash
npm start
```

The backend will start on `http://localhost:5000` (or your configured port)

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend/mobile
npm install
```

2. **Environment Variables**
Ensure `.env` has:
```
EXPO_PUBLIC_API_URL=http://your-backend-url:5000
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

3. **Start App**
```bash
npm start
```

---

## Testing the Features

### 1. Test Food Analysis
- Take a photo of food with a nutrition label
- Verify it extracts exact values from the label
- Check that it provides source links (USDA, etc.)

### 2. Test Auto-Save
- Analyze a food item
- Check your History tab to confirm it's saved
- Verify the image is displayed in history

### 3. Test Search & Filtering
- Add multiple food logs
- Search for a specific food name
- Verify search results are accurate

### 4. Test with Allergies
- Select some allergies before analyzing
- Verify allergy warnings appear in results
- Check that history shows allergy badges

---

## API Endpoints

All food log endpoints are at `/api/food-logs`:

```
POST   /create              - Save new food log
GET    /user               - Get user's logs (paginated)
GET    /stats              - Get nutrition statistics
GET    /:id                - Get specific log
PATCH  /:id                - Update log
DELETE /:id                - Delete log
DELETE /bulk/delete        - Delete multiple logs
```

See `backend/FOOD_LOG_API.md` for complete API documentation.

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Mobile App (React Native)       │
│  ┌─────────────────────────────────┐   │
│  │  Food.tsx (UI Component)        │   │
│  │  - Analysis view                │   │
│  │  - History view                 │   │
│  └───────────┬─────────────────────┘   │
│              │                           │
│  ┌───────────▼─────────────────────┐   │
│  │  geminiService.ts               │   │
│  │  - AI food analysis             │   │
│  │  - USDA/Nutritionix integration │   │
│  └───────────┬─────────────────────┘   │
│              │                           │
│  ┌───────────▼─────────────────────┐   │
│  │  foodLogApi.ts                  │   │
│  │  - API client                   │   │
│  └───────────┬─────────────────────┘   │
└──────────────┼─────────────────────────┘
               │ HTTP/REST
               │
┌──────────────▼─────────────────────────┐
│         Backend (Node.js/Express)      │
│  ┌─────────────────────────────────┐   │
│  │  foodLogRoutes.js               │   │
│  │  - Route definitions            │   │
│  └───────────┬─────────────────────┘   │
│              │                           │
│  ┌───────────▼─────────────────────┐   │
│  │  foodLogController.js           │   │
│  │  - Business logic               │   │
│  │  - Image upload (Cloudinary)    │   │
│  └───────────┬─────────────────────┘   │
│              │                           │
│  ┌───────────▼─────────────────────┐   │
│  │  foodLogModel.js                │   │
│  │  - MongoDB schema               │   │
│  └───────────┬─────────────────────┘   │
└──────────────┼─────────────────────────┘
               │
               ▼
         MongoDB Database
         - Food logs collection
         - Indexed queries
```

---

## Troubleshooting

### Issue: Images not uploading
**Solution**: 
- Check Cloudinary credentials in `.env`
- Verify image size is under 50MB
- Ensure base64 encoding is correct

### Issue: History not loading
**Solution**:
- Verify user is logged in
- Check JWT token is valid
- Ensure backend is running
- Check network connectivity

### Issue: Inaccurate nutrition data
**Solution**:
- Provide dish name for better context
- Take clear photos with nutrition labels visible
- For branded products, ensure packaging is visible
- Use manual input with specific quantities

### Issue: Search not working
**Solution**:
- Search requires at least 3 characters
- Check spelling
- Try searching by brand name instead
- Refresh the history list

---

## Database Schema

### FoodLog Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Link to user
  analyzedAt: Date,              // When analyzed
  inputMethod: 'image'|'manual', // How entered
  imageUrl: String,              // Cloudinary URL
  foodName: String,              // "Chicken Salad"
  dishName: String,              // Optional user input
  calories: Number,              // 350
  servingSize: String,           // "1 bowl"
  nutrients: {
    protein: 35,                 // grams
    carbs: 20,                   // grams
    fat: 15,                     // grams
    // ... 12 more nutrients
  },
  allergyWarnings: {
    detected: ['Gluten'],        // User's allergens found
    mayContain: ['Dairy'],       // Possible allergens
    warning: "Contains gluten"
  },
  confidence: 'high',            // AI confidence level
  // ... additional fields
}
```

### Indexes
- `userId + analyzedAt`: Fast chronological queries
- `userId + foodName`: Fast search
- `userId + isBranded`: Filter by branded products

---

## Performance Considerations

1. **Pagination**: History loads 20 items at a time
2. **Image Compression**: Images resized to 1024px max width
3. **Database Indexing**: Optimized for common queries
4. **Caching**: Consider implementing Redis for frequent queries
5. **CDN**: Cloudinary handles image delivery

---

## Security

✅ **Authentication Required**: All endpoints require valid JWT
✅ **User Isolation**: Users can only access their own logs
✅ **Input Validation**: Mongoose schema validation
✅ **XSS Protection**: Data sanitized before storage
✅ **CORS**: Configured for mobile app origin

---

## Future Enhancements

Ideas for future development:
- [ ] Daily nutrition goals tracking
- [ ] Meal planning from history
- [ ] Export logs to CSV/PDF
- [ ] Barcode scanning for packaged foods
- [ ] Recipe saving and sharing
- [ ] Integration with fitness trackers
- [ ] Nutrition charts and graphs
- [ ] Meal reminders/notifications

---

## Support

For issues or questions:
1. Check this guide first
2. Review API documentation in `backend/FOOD_LOG_API.md`
3. Check enhancement summary in `FOOD_TRACKER_ENHANCEMENTS.md`
4. Review code comments in source files

---

## Files Reference

### Backend
- `models/foodLogModel.js` - Database schema
- `controllers/foodLogController.js` - Business logic
- `routes/foodLogRoutes.js` - API routes
- `app.js` - Express app configuration

### Frontend
- `app/screens/record/Food.tsx` - Main UI component
- `app/services/geminiService.ts` - AI integration
- `app/api/foodLogApi.ts` - API client
- `app/context/UserContext.tsx` - User state management

### Documentation
- `FOOD_TRACKER_ENHANCEMENTS.md` - Complete changes summary
- `backend/FOOD_LOG_API.md` - API documentation
- This file - Quick start guide
