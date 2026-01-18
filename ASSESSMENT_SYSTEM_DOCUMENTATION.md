# Daily Assessment & Sentiment Analysis System - Implementation Summary

## Overview
Created a comprehensive daily assessment and sentiment analysis system that uses Gemini AI to generate personalized health questions, track user progress, and analyze sentiment trends.

---

## Backend Components

### 1. **Assessment Model** (`backend/models/assessmentModel.js`)
**Fields:**
- `userId` - Reference to User (indexed for performance)
- `question` - Assessment question text
- `choices` - Array of multiple choice answers with:
  - `id` - Choice identifier
  - `text` - Display text
  - `value` - Score value (0-10)
- `suggestion` - Personalized suggestion for the question
- `sentiment` - Sentiment category (very_sad, sad, neutral, happy, very_happy)
- `reminderTime` - Suggested time for question (format: HH:MM)
- `sentimentResult` - Stores user's response with:
  - `selectedChoice` - Choice they selected
  - `userResponse` - Additional text response
  - `timestamp` - When they responded
  - `analysisNotes` - AI analysis of response
  - `followUpSuggestion` - Personalized follow-up
- `category` - Question category (mental_health, physical_health, lifestyle, nutrition, exercise, sleep, stress, general_wellbeing)
- `difficulty` - Question difficulty (easy, medium, hard)
- `isActive` - Whether question is still available
- `userProgress` - Tracks:
  - `totalAttempts` - Number of times answered
  - `correctAnswers` - Number of correct responses
  - `score` - Latest score
  - `insights` - Progress insights

### 2. **Assessment Controller** (`backend/controllers/assessmentController.js`)
**Endpoints:**

1. **generateDailyQuestions()**
   - Generates 10 personalized assessment questions using Gemini
   - Uses user context (age, health profile, previous assessments)
   - Saves questions to database
   - Returns array of generated questions

2. **getActiveQuestions()**
   - Retrieves unanswered questions for the user
   - Supports filtering by category
   - Returns latest 10 active questions

3. **submitAssessmentResponse()**
   - Records user's answer to a question
   - Validates choice selection
   - Updates assessment with response and timestamp
   - Updates user progress metrics

4. **getUserProgress()**
   - Analyzes assessment progress over specified days
   - Calculates:
     - Completion rate
     - Average score
     - Category breakdown
   - Returns recent responses

5. **getAssessmentHistory()**
   - Paginated list of all assessments
   - Filterable by category
   - Returns with pagination metadata

6. **analyzeSentimentTrend()**
   - Analyzes sentiment patterns over time
   - Generates sentiment distribution statistics
   - Returns trend data with scores

7. **getRecommendations()**
   - Generates AI-powered recommendations based on recent assessments
   - Identifies low-scoring categories
   - Provides actionable suggestions
   - Prioritizes high-impact recommendations

### 3. **Gemini Integration** (`backend/utils/geminiJudge.js`)
**New Function: generateAssessmentQuestions()**
- Generates 10 unique, personalized assessment questions
- Input: User profile context including age, health status, previous assessments
- Output: Array of 10 questions with:
  - Natural language questions
  - 5 multiple choice options each
  - Score values for each choice
  - Category classification
  - Difficulty levels
  - Personalized suggestions
  - Recommended reminder times
- Fallback: Default 10 question set if Gemini API fails

### 4. **Routes** (`backend/routes/assessmentRoutes.js`)
- `POST /assessment/generate-daily-questions` - Generate 10 daily questions
- `GET /assessment/active-questions` - Get unanswered questions
- `POST /assessment/submit-response` - Submit answer
- `GET /assessment/progress` - Get progress stats
- `GET /assessment/history` - Get assessment history
- `GET /assessment/sentiment-trend` - Analyze sentiment trends
- `GET /assessment/recommendations` - Get recommendations

### 5. **App Registration** (`backend/app.js`)
- Imported assessmentRoutes
- Registered routes at `/api/assessment`
- Added logging for route registration

---

## Frontend Components

### 1. **Assessment Questions Component** (`frontend/mobile/app/screens/analysis_input/assessment_questions.tsx`)

**Features:**
- **Progressive Loading**
  - Displays loading state with spinner
  - Shows empty state if no questions available
  - Loads active questions from API

- **Question Display**
  - Shows category icon and difficulty badge
  - Displays question with category context
  - Progress bar showing completion status
  - Question counter (e.g., "Question 1 of 10")

- **Multiple Choice Interface**
  - 5 selectable answer options
  - Visual feedback on selection (gradient highlight)
  - Score value display for each choice (0-10)
  - Radio button-style selection

- **Suggestion Box**
  - Displays personalized suggestion for each question
  - Styled with left border accent
  - Includes lightbulb icon

- **Navigation**
  - Next button to progress through questions
  - Skip button to bypass questions
  - Auto-close on completion
  - Loading state during submission

- **Data Flow**
  - Fetches questions from `/api/assessment/active-questions`
  - Submits responses to `/api/assessment/submit-response`
  - Shows success/error toasts
  - Tracks selected choices

### 2. **Sentiment Analysis Component** (`frontend/mobile/app/screens/analysis_input/sentiment_analysis.tsx`)
*Already created in previous phase*
- Daily sentiment tracking
- Emotional state selection
- Optional daily notes
- Integration with user profile

### 3. **Analysis Dashboard Updates** (`frontend/mobile/app/(tabs)/Analysis.tsx`)

**New Buttons Added:**
1. **"Daily Sentiment Analysis" Button**
   - Purple gradient (#8B5CF6 to #7C3AED)
   - Opens sentiment form modal
   - Brain icon

2. **"Daily Assessment" Button** (NEW)
   - Cyan gradient (#06B6D4 to #0891B2)
   - Opens 10-question assessment form
   - Clipboard icon

**Features:**
- Both buttons positioned at bottom of Analysis tab
- Smooth animations and press states
- Full-screen overlay modals
- Easy close functionality
- Consistent styling with app theme

---

## Key Features

### 1. **AI-Powered Question Generation**
- Uses Google Gemini to generate contextual questions
- Considers user's health profile, age, and previous responses
- Fallback to 10 default questions if API fails

### 2. **Personalized Assessment**
- 10 questions per daily assessment
- Multiple categories (mental health, physical, lifestyle, etc.)
- Varying difficulty levels
- Personalized suggestions for each question

### 3. **Progress Tracking**
- Tracks completion rates
- Monitors average scores by category
- Analyzes sentiment trends over time
- Records timestamps for all responses

### 4. **Analytics & Insights**
- Sentiment distribution analysis
- Category-based performance metrics
- Trend visualization support
- Automatic recommendation generation

### 5. **User-Friendly UI**
- Progressive loading states
- Visual progress indicators
- Category-based color coding
- Difficulty level badges
- Smooth animations and transitions

---

## Data Flow

```
User Opens Analysis Tab
    ↓
Clicks "Daily Assessment" Button
    ↓
Assessment Modal Opens
    ↓
Loads Active Questions (API: /active-questions)
    ↓
User Selects Answer & Clicks Next
    ↓
Submits Response (API: /submit-response)
    ↓
Proceeds to Next Question
    ↓
Completes All 10 Questions
    ↓
Shows Success Toast
    ↓
Modal Closes & Returns to Dashboard
    ↓
Data Stored in MongoDB with timestamp
```

---

## Database Schema

### Assessment Collection
```
{
  userId: ObjectId,
  question: String,
  choices: [{
    id: String,
    text: String,
    value: Number
  }],
  suggestion: String,
  sentiment: String,
  reminderTime: String,
  sentimentResult: {
    selectedChoice: {...},
    userResponse: String,
    timestamp: Date,
    analysisNotes: String,
    followUpSuggestion: String
  },
  category: String,
  difficulty: String,
  isActive: Boolean,
  userProgress: {
    totalAttempts: Number,
    correctAnswers: Number,
    score: Number,
    insights: String
  },
  generatedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Generate Daily Questions
```
POST /api/assessment/generate-daily-questions
Headers: Authorization: Bearer {token}
Response: { questions: [...], totalQuestions: 10 }
```

### Get Active Questions
```
GET /api/assessment/active-questions?category={category}
Headers: Authorization: Bearer {token}
Response: { questions: [...], total: number }
```

### Submit Assessment Response
```
POST /api/assessment/submit-response
Headers: Authorization: Bearer {token}
Body: {
  assessmentId: String,
  selectedChoice: String,
  userResponse: String
}
Response: { assessment: {...}, message: "Success" }
```

### Get User Progress
```
GET /api/assessment/progress?days={7,30,90}
Headers: Authorization: Bearer {token}
Response: { progress: {...}, timeframe: String }
```

### Get Assessment History
```
GET /api/assessment/history?page={1}&limit={20}&category={category}
Headers: Authorization: Bearer {token}
Response: { assessments: [...], pagination: {...} }
```

### Analyze Sentiment Trend
```
GET /api/assessment/sentiment-trend?days={30}
Headers: Authorization: Bearer {token}
Response: { trend: [...], summary: {...}, timeframe: String }
```

### Get Recommendations
```
GET /api/assessment/recommendations
Headers: Authorization: Bearer {token}
Response: { recommendations: [...], message: String }
```

---

## 10 Default Questions

1. **Energy Levels** - General Wellbeing
2. **Sleep Quality** - Sleep
3. **Stress Level** - Stress Management
4. **Physical Activity** - Exercise
5. **Healthy Food Choices** - Nutrition
6. **Water Intake** - Nutrition
7. **Mental Health** - Mental Health
8. **Focus & Concentration** - General Wellbeing
9. **Health Goals Motivation** - Lifestyle
10. **Overall Health Satisfaction** - Physical Health

---

## Integration Points

### Frontend → Backend
- `GET /api/assessment/active-questions` - Load questions
- `POST /api/assessment/submit-response` - Submit answers
- Token authentication on all requests

### Backend → Gemini API
- Sends user context
- Receives 10 personalized questions
- Handles API failures gracefully

### Database
- MongoDB Atlas
- Indexes on userId and createdAt for performance
- Supports pagination and filtering

---

## Error Handling

- **Loading Errors**: Shows empty state with retry option
- **API Errors**: Toast notifications with error messages
- **Gemini Failures**: Falls back to default 10 questions
- **Token Expiration**: Redirects to login
- **Missing Data**: Validates all required fields before submission

---

## Future Enhancements

1. **Push Notifications** for daily reminders
2. **Charts & Analytics** for progress visualization
3. **Goal Setting** based on assessment results
4. **Comparative Analysis** across time periods
5. **Social Features** - share progress with health coach
6. **Integration** with wearable devices
7. **ML Insights** - pattern detection and predictions
8. **Custom Question Sets** - create assessments for users

---

## Testing Checklist

- [ ] Generate daily questions endpoint working
- [ ] Questions display correctly in UI
- [ ] Answer selection and submission working
- [ ] Progress tracking accurate
- [ ] Sentiment analysis calculating correctly
- [ ] Recommendations generating properly
- [ ] Error handling and fallbacks working
- [ ] UI animations smooth
- [ ] Mobile responsiveness verified
- [ ] Token authentication validated
