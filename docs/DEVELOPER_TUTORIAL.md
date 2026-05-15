# Developer Setup Tutorial 🚀

Welcome to the future development of **Lyniva**! This guide will help you set up the project locally for development and prepare it for production. 

The project has three main components:
1. **Backend**: Express + Node.js (with an ML component via Python script hooks).
2. **Mobile App**: React Native (with Expo).
3. **Web Dashboard**: React (with Vite).

---

## 🏗️ 1. Prerequisite Tooling

Make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [Python](https://www.python.org/downloads/) (v3.9 or higher for ML models)
- [MongoDB URI](https://www.mongodb.com/) (either a local instance or MongoDB Atlas)
- [Git](https://git-scm.com/)
- [Expo CLI](https://expo.dev/tools) (Optional, can be used via `npx expo`)

---

## 🖥️ 2. Backend Setup

The backend handles the server, database connectivity, and runs localized machine learning pipeline scripts.

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Install Python dependencies for the ML system:
   ```bash
   pip install -r requirements.txt # Make sure you have the required libs in ml_models
   ```

### Environment Variables
Create a `.env` file in the `/backend` folder. You will need roughly the following configurations:
```env
PORT=5000
MONGO_URI=<Your_MongoDB_Connection_String>
JWT_SECRET=<Your_JWT_Secret>
CLOUDINARY_URL=<Your_Cloudinary_URL> # For handling images
FIREBASE_CREDENTIALS=<Path_to_Firebase_Service_Account_JSON>
GEMINI_API_KEY=<Your_Google_Generative_AI_Key>
```

### Running the Server
Run in development mode using Nodemon:
```bash
npm run dev
```
Run in production mode:
```bash
npm start
```

---

## 📱 3. Mobile Frontend Setup (React Native / Expo)

The Mobile App serves as the primary way users interact with the Lyniva service. 

### Installation
1. Navigate to the mobile directory:
   ```bash
   cd frontend/mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the `frontend/mobile` directory:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api # URL of the local backend
```

### Running the Mobile App
Start the Expo development server:
```bash
npx expo start
```
You can press `a` to run it on an Android emulator, `i` for iOS Simulator (requires Mac), or scan the QR code using the Expo Go app on your physical device.

---

## 🌐 4. Web Frontend Setup (React / Vite)

The web dashboard is designed for administrative/sentiment dashboard views or user web interactions.

### Installation
1. Navigate to the web directory:
   ```bash
   cd frontend/web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file based on `.env.sample`.
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Running the Web Dashboard
Start the Vite development server:
```bash
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🧠 5. Machine Learning Pipeline (Python)

The ML models exist inside `backend/ml_models/`. They are triggered by the backend when predictions are needed. To modify them or retrain:
1. Navigate to `backend/ml_models/`.
2. Run data retraining or pipeline tests using:
   ```bash
   python test_ml_pipeline.py
   python retrain_extended_model.py
   ```

---

## 🚢 6. Deployment Notes

- **Backend**: Can be hosted on platforms like Render, Heroku, or AWS EC2. Update the environment variables accordingly. Utilize `render-build.sh` for Render hook.
- **Web**: Easiest deployed to Vercel or Netlify. The `vercel.json` is partially already configured.
- **Mobile App**: Uses EAS (Expo Application Services). Configure using `eas.json` and deploy using:
  ```bash
  eas build --platform ios
  eas build --platform android
  ```
