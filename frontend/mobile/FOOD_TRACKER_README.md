# Food Calorie Tracker - Mobile Implementation

## Overview
Full-featured food calorie tracking functionality integrated into the mobile app's Food.tsx screen. Uses Google Gemini AI for advanced food recognition and nutritional analysis.

## Features

### 🎯 Core Functionality
- **Image Upload**: Take photos or select from gallery to analyze food
- **Manual Entry**: Input ingredients manually for accurate tracking
- **AI-Powered Analysis**: Google Gemini Vision API for food recognition
- **Nutritional Information**: Complete macro and micronutrient breakdown
- **Allergy Detection**: Warns about common allergens in food
- **Branded Product Recognition**: Identifies branded products with purchase links
- **Recipe Suggestions**: Links to recipes for identified dishes
- **Healthy Alternatives**: AI-suggested healthier food options

### 📊 Nutritional Data Includes
- Calories
- Protein, Carbs, Fat, Fiber, Sugar
- Saturated Fat, Trans Fat
- Sodium, Cholesterol, Potassium
- Vitamins (A, C, D)
- Minerals (Calcium, Iron)
- Serving size information

### 🛡️ Allergy Management
- Pre-defined common allergens (Peanuts, Tree Nuts, Milk, Eggs, Wheat, Soy, Fish, Shellfish, Sesame, Gluten)
- Custom allergy input
- Real-time allergen detection
- "May contain" warnings

## Setup Instructions

### 1. Install Dependencies
```bash
cd frontend/mobile
npm install
```

The following package is required:
- `@google/generative-ai` - Google Gemini AI SDK

### 2. Environment Configuration

Add your Gemini API key to your `.env` file:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key
5. Paste it in your `.env` file

### 3. Update app.config.js

The configuration has already been updated to include:
```javascript
extra: {
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY
}
```

### 4. Permissions Required

The following permissions are needed (already configured):
- Camera access
- Photo library access
- Internet access

## Usage

### Image Mode
1. Tap "Upload Image" tab
2. Enter dish name (optional)
3. Select any allergies (optional)
4. Take a photo or choose from gallery
5. Tap "Analyze Image"
6. View comprehensive nutritional breakdown

### Manual Mode
1. Tap "Manual Input" tab
2. Enter dish name (optional)
3. Select any allergies (optional)
4. Enter ingredients with quantities
   - Example:
     ```
     2 eggs
     1 cup rice
     100g chicken breast
     1 tablespoon olive oil
     1/2 avocado
     ```
5. Tap "Analyze Ingredients"
6. View comprehensive nutritional breakdown

## Technical Implementation

### File Structure
```
frontend/mobile/
├── app/
│   ├── screens/
│   │   └── record/
│   │       └── Food.tsx           # Main component
│   └── services/
│       └── geminiService.ts       # Gemini AI integration
├── app.config.js                  # Updated with Gemini config
└── .env                          # Environment variables
```

### Key Components

**Food.tsx**
- Main food tracking interface
- Image upload/capture functionality
- Manual ingredient input
- Results display with comprehensive UI
- Navigation between modes

**geminiService.ts**
- `analyzeFood()` - Analyzes food images
- `analyzeIngredients()` - Analyzes manual ingredient lists
- Type definitions for all data structures
- Error handling and fallback responses

### Data Flow
1. User inputs food (image or manual)
2. Service converts data to Gemini-compatible format
3. AI analyzes and returns structured JSON
4. Results parsed and displayed in native UI
5. Links to external resources (recipes, stores)

## Features Breakdown

### Visual Components
- **Calorie Circle**: Large visual display of total calories
- **Nutrient Bars**: Progress bars for macronutrients
- **Nutrition Facts Table**: Detailed FDA-style nutrition label
- **Allergy Warnings**: Prominent alerts for detected allergens
- **Branded Badge**: Special display for branded products

### Interactive Elements
- **Purchase Links**: Direct links to Lazada, Shopee, Puregold
- **Recipe Links**: Google search links for recipe ideas
- **Nutrition Sources**: Clickable links to data sources
- **Healthy Alternatives**: Suggested better options with calorie savings

### Smart Features
- **Context-aware**: Uses dish name for better identification
- **Multi-source verification**: Cross-references nutrition databases
- **Confidence scoring**: Shows reliability of analysis
- **Additional notes**: AI-generated insights about the food

## Error Handling

The implementation includes comprehensive error handling:
- Invalid/missing API key detection
- API quota exceeded handling
- Image processing errors
- Parse error fallbacks
- User-friendly error messages

## Performance Considerations

- Images optimized to 80% quality
- Base64 encoding for cross-platform compatibility
- Efficient state management
- Lazy loading of results
- Minimal re-renders

## Limitations

- Requires internet connection
- Gemini API rate limits apply
- Image quality affects accuracy
- Manual entry accuracy depends on user input
- Some uncommon foods may have lower confidence scores

## Future Enhancements

Potential improvements:
- Offline support with cached data
- History tracking
- Daily calorie goal tracking
- Meal planning integration
- Barcode scanning
- Nutrition database fallback
- Multi-language support
- Voice input for ingredients

## Troubleshooting

### Common Issues

**"Gemini API key is not configured"**
- Ensure `.env` file has `EXPO_PUBLIC_GEMINI_API_KEY`
- Restart the development server after adding the key

**"Failed to analyze image"**
- Check internet connection
- Verify API key is valid
- Ensure image is not corrupted
- Try with a clearer image

**"API quota exceeded"**
- Wait for quota reset (usually daily)
- Consider upgrading API plan
- Implement request throttling

**No results showing**
- Check console for errors
- Verify Gemini API is accessible
- Try with different image/ingredients

## API Costs

Google Gemini AI pricing (as of 2024):
- Free tier: 60 requests per minute
- Paid plans available for higher volume
- Monitor usage in Google Cloud Console

## Support

For issues or questions:
1. Check the console for detailed error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Review the Gemini API documentation

## Credits

- **AI**: Google Gemini 1.5 Flash
- **Image Picker**: expo-image-picker
- **UI Framework**: React Native + NativeWind (Tailwind)
- **Based on**: Food Calorie Tracker web application

## License

Part of the Lifora health tracking application.
