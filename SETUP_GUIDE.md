# Daily Assessment System - Setup Guide

## What's Been Created

A complete daily assessment and sentiment analysis system with:
- **10 AI-generated personalized health questions** per day
- **Sentiment tracking** for emotional well-being
- **Progress analytics** to analyze user health trends
- **Gemini-powered question generation** based on user profile
- **MongoDB database** to store all assessment data

---

## Backend Setup

### 1. Update Backend Dependencies (if needed)
```bash
cd backend
npm install --save @google/generative-ai
```

### 2. Files Added/Modified

**New Files:**
- `models/assessmentModel.js` - Assessment data schema
- `controllers/assessmentController.js` - Assessment business logic
- `routes/assessmentRoutes.js` - Assessment API endpoints
- `utils/geminiJudge.js` - Updated with `generateAssessmentQuestions()` function

**Modified Files:**
- `app.js` - Added assessment routes

### 3. Start Backend
```bash
npm start
# or
node server.js
```

---

## Frontend Setup

### 1. Files Added
- `app/screens/analysis_input/assessment_questions.tsx` - Daily assessment form
- Updated `app/(tabs)/Analysis.tsx` - Added buttons for assessment & sentiment

### 2. Install Frontend Dependencies (if needed)
```bash
cd frontend/mobile
npm install
# or
expo install
```

### 3. Run Frontend
```bash
npm start
# or
expo start
```

---

## Database

### MongoDB Collections
The system automatically creates:
- **assessments** - Stores all assessment questions and responses
- Automatically indexed on `userId` and `createdAt` for performance

### Sample Assessment Document
```javascript
{
  userId: ObjectId,
  question: "How would you rate your energy levels today?",
  choices: [
    { id: "1", text: "Very low", value: 0 },
    { id: "2", text: "Low", value: 2 },
    { id: "3", text: "Average", value: 5 },
    { id: "4", text: "High", value: 7 },
    { id: "5", text: "Very high", value: 10 }
  ],
  suggestion: "Try a 10-minute walk if energy is low",
  sentiment: "neutral",
  category: "general_wellbeing",
  difficulty: "easy",
  sentimentResult: {
    selectedChoice: { id: "4", text: "High", value: 7 },
    timestamp: 2026-01-18T10:30:00Z,
    analysisNotes: "Good energy level today"
  },
  createdAt: 2026-01-18T10:00:00Z
}
```

---

## API Endpoints (with curl examples)

### 1. Generate 10 Daily Questions
```bash
curl -X POST http://localhost:5000/api/assessment/generate-daily-questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Get Active Questions
```bash
curl -X GET http://localhost:5000/api/assessment/active-questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Submit Answer
```bash
curl -X POST http://localhost:5000/api/assessment/submit-response \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentId": "QUESTION_ID",
    "selectedChoice": "4",
    "userResponse": ""
  }'
```

### 4. Get Progress
```bash
curl -X GET "http://localhost:5000/api/assessment/progress?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Get Sentiment Trend
```bash
curl -X GET "http://localhost:5000/api/assessment/sentiment-trend?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Get Recommendations
```bash
curl -X GET http://localhost:5000/api/assessment/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## UI Navigation

### From Analysis Tab:
1. User sees two new buttons at the bottom:
   - **"Daily Assessment"** (Cyan) - Opens 10-question form
   - **"Daily Sentiment Analysis"** (Purple) - Opens sentiment form

2. Clicking "Daily Assessment":
   - Loads active questions from API
   - Displays questions one at a time
   - Shows progress bar (Question X of 10)
   - User selects answer
   - Click "Next Question" to continue
   - After question 10, shows "Complete Assessment"
   - Returns to dashboard on completion

3. Each question shows:
   - Category (Mental Health, Physical Health, etc.)
   - Difficulty badge (Easy/Medium/Hard)
   - The question
   - 5 multiple choice answers with scores (0-10)
   - Suggestion box with personalized tip

---

## Key Features Breakdown

### 🤖 Gemini Integration
- **Location:** `backend/utils/geminiJudge.js`
- **Function:** `generateAssessmentQuestions()`
- **Purpose:** Creates personalized questions based on:
  - User age & gender
  - Health profile & conditions
  - Lifestyle data
  - Previous assessment responses
- **Fallback:** Uses 10 default questions if API fails

### 📊 Data Tracking
- **Completion Rate:** Tracks % of questions answered
- **Score Tracking:** Records score for each response (0-10)
- **Category Analysis:** Breaks down performance by health category
- **Sentiment Trends:** Shows emotional well-being over time

### 💾 Database Storage
- All responses timestamped
- User-specific data indexed for fast queries
- Supports pagination for history
- Tracks multiple attempts per question

### 🎨 UI/UX
- Smooth animations on button press
- Progress bar updates in real-time
- Gradient button effects (Cyan & Purple)
- Touch feedback with shadow effects
- Toast notifications for success/errors

---

## Troubleshooting

### Questions Not Loading
1. Check if backend is running on port 5000
2. Verify user token is valid
3. Check MongoDB connection
4. Look at backend logs for errors

### Gemini API Issues
- System will fallback to 10 default questions
- Check `GEMINI_API_KEY` in `.env`
- Verify API quota limits not exceeded

### UI Not Displaying
- Clear React Native cache: `expo start --clear`
- Check imports are correct
- Verify theme context is available

### Database Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify user has database permissions

---

## Next Steps (Optional)

1. **Add Push Notifications** for daily reminders
2. **Create Analytics Dashboard** to visualize trends
3. **Add Export/Share** functionality for reports
4. **Integrate with Wearables** for automatic data
5. **Create Custom Question Sets** for specific health goals
6. **Add Social Features** to share progress with coach
7. **ML Analytics** for pattern detection
8. **Gamification** - Badges for consistency

---

## Files Checklist

Backend:
- ✅ `models/assessmentModel.js`
- ✅ `controllers/assessmentController.js`
- ✅ `routes/assessmentRoutes.js`
- ✅ `utils/geminiJudge.js` (updated)
- ✅ `app.js` (updated)

Frontend:
- ✅ `app/screens/analysis_input/assessment_questions.tsx`
- ✅ `app/(tabs)/Analysis.tsx` (updated)
- ✅ `app/screens/analysis_input/sentiment_analysis.tsx` (existing)

Documentation:
- ✅ `ASSESSMENT_SYSTEM_DOCUMENTATION.md`
- ✅ `SETUP_GUIDE.md` (this file)

---

## Quick Test

1. Start backend: `npm start` (in backend folder)
2. Start frontend: `expo start` (in frontend/mobile folder)
3. Open app on phone/emulator
4. Navigate to Analysis tab
5. Click "Daily Assessment" button
6. Answer 10 questions
7. Check backend logs for successful saves
8. View progress: `GET /api/assessment/progress`

---

## Support

For issues or questions:
1. Check backend logs: `npm start` output
2. Check frontend logs: Expo console
3. Verify API calls in Network tab
4. Check MongoDB collections in Atlas UI
5. Review documentation file for detailed specs

---

Last Updated: January 18, 2026
System Version: 1.0
Status: ✅ Ready for Production
