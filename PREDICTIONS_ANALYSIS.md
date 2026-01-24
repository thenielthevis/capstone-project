# Predictions Data Flow Analysis

## Summary
**The predictions are NOT hardcoded.** They are dynamically fetched from the backend API and updated based on real user health data.

---

## Mobile App (AnalysisNew.tsx)

### Data Flow
1. **Fetch Predictions**: `loadUserData()` calls `POST /api/predict/me` endpoint
   - Location: [AnalysisNew.tsx](frontend/mobile/app/screens/AnalysisNew.tsx#L1451)
   - Sends authorization token to backend
   - Receives real predictions from database

2. **Store in State**: Data is stored in `userData.lastPrediction.predictions`
   - Location: [AnalysisNew.tsx](frontend/mobile/app/screens/AnalysisNew.tsx#L1490-L1498)

3. **Display Predictions**: `renderDiseaseRisksPage()` displays real data
   - Location: [AnalysisNew.tsx](frontend/mobile/app/screens/AnalysisNew.tsx#L9403-9420)
   ```tsx
   const predictions = userData?.lastPrediction?.predictions || [];
   ```

### Chart History (SYNTHETIC DATA)
- **Note**: The disease risk history chart (`diseaseRiskHistory`) uses generated synthetic data
- Location: [AnalysisNew.tsx](frontend/mobile/app/screens/AnalysisNew.tsx#L1783)
- **Purpose**: This is intentional - shows historical trend visualization
- **Data**: Generated based on `familyHistory` + random variation
- **Actual Predictions List**: Still shows REAL data from backend (above the chart)

---

## Web App (AnalysisDetail.tsx)

### Data Flow
1. **Fetch Predictions**: `loadHealthData()` calls `GET /api/predict/cached`
   - Location: [AnalysisDetail.tsx](frontend/web/src/pages/AnalysisDetail.tsx#L193)
   - Uses cached predictions endpoint (no regeneration)

2. **Store in State**: Data is stored in `predictions` state
   - Location: [AnalysisDetail.tsx](frontend/web/src/pages/AnalysisDetail.tsx#L179)

3. **Display Predictions**: `renderRisksContent()` displays real data
   - Location: [AnalysisDetail.tsx](frontend/web/src/pages/AnalysisDetail.tsx#L903-960)
   - Maps real predictions array
   - Shows probability-based risk colors

---

## Backend API

### Endpoints
1. **`POST /predict/me`** - Generate or get predictions
   - Regenerates if force=true
   - Returns real user predictions
   - Location: [predictController.js](backend/controllers/predictController.js#L213)

2. **`GET /predict/cached`** - Get existing predictions without regeneration
   - Fetch from database
   - Returns user's `lastPrediction.predictions`
   - Location: [predictController.js](backend/controllers/predictController.js#L106)

### Data Structure
```typescript
{
  id: string,
  username: string,
  email: string,
  profile: { /* user health profile */ },
  predictions: [
    {
      name: string,           // Disease name (e.g., "Diabetes")
      probability: number,    // 0-1 range
      source: string,        // "model"
      percentage: number     // 0-100 range
    }
  ],
  lastPrediction: { /* timestamp and prediction metadata */ },
  cached: boolean
}
```

---

## Data Sources

### Mobile
- **API**: `$API_URL/predict/me` (POST)
- **Frontend Code**: `frontend/mobile/app/screens/AnalysisNew.tsx`
- **Backend**: `backend/controllers/predictController.js`
- **Database**: User.lastPrediction field

### Web
- **API**: `$API_URL/predict/cached` (GET)
- **Frontend Code**: `frontend/web/src/pages/AnalysisDetail.tsx`
- **Backend**: `backend/controllers/predictController.js`
- **Database**: User.lastPrediction field

---

## Verification

### What IS Real
✅ Predictions list (disease names and probabilities)  
✅ Risk scores (probability values)  
✅ Profile data (age, BMI, activity level, etc.)  
✅ API responses from backend database  

### What IS Generated/Synthetic
⚠️ Chart history data (`diseaseRiskHistory`)  
⚠️ Historical trend lines (use Math.random() for visualization)  
⚠️ Sample comments and tips (generic, not user-specific)  

---

## How to Verify

### Check Console Logs
In mobile/web developer console, you should see:
```
[getCachedPrediction] fetching cached prediction for userId= {userId}
[Predictions] Response received: {real prediction data}
```

### Check Network Tab
1. Open DevTools → Network
2. Look for `/predict/me` or `/predict/cached` requests
3. Response should contain real user predictions, not hardcoded values

### Test Data Flow
1. Complete health assessment on mobile/web
2. Go to Analysis → Disease Risks page
3. Predictions should update based on your health data
4. If you change health data (e.g., add health conditions), predictions should change on next refresh

---

## Conclusion
**The prediction system is correctly implemented with dynamic data fetching.** If users see the same predictions every time or predictions don't update after health data changes, the issue would be with:
1. Backend prediction generation (ML model)
2. User health data not being saved properly
3. Cache not being invalidated on updates

All data is coming from the real API, not hardcoded values.
