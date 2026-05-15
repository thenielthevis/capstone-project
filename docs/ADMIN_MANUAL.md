# Lyniva Admin User Manual 🛡️

Welcome to the **Lyniva Admin Dashboard**. The admin tools are designed to help system administrators moderate the community, track overall user wellness, and evaluate telemetry from the predictive machine learning models. The primary interface for administrators is the Web Dashboard.

---

## 🔐 1. Accessing the Admin Dashboard

1. Navigate to the web application URL (e.g., `https://lyniva-web.vercel.app` or `http://localhost:5173` locally).
2. Log in using your designated Administrator credentials. 
3. Standard users will be blocked from accessing the admin panels via Role-Based Access Control (RBAC).

---

## 📊 2. Main Dashboard & Analytics

Upon logging in, you will see the **Overview Dashboard**.
- **System Health:** Quick metrics on active daily users, new signups, and total activities logged today.
- **Recent ML Predictions:** A high-level view of the latest outputs from the machine learning pipeline (e.g., predicted churn risk or general wellness trends).

---

## 👥 3. User Management

Navigate to the **Users** tab on the sidebar.
- **Search & Filter:** Find specific users by email, username, or ID.
- **View Profiles:** Click on a user to view their detailed metrics, including activity logs, meal logs, and the state of their virtual companion.
- **Moderation Actions:** 
  - **Suspend/Ban:** Temporarily or permanently disable accounts violating community guidelines.
  - **Reset Progress:** Help users who report bugged stats by resetting specific metrics.

---

## 🧠 4. Sentiment & Wellness Dashboard

A core feature of Lyniva is the **Sentiment Analysis** tools (accessible via the Sentiment Dashboard tab), which aggregate the community's mood check-ins.
- **Community Wellness Score:** See an aggregated mood score based on recent user inputs.
- **Flagged Inputs:** The system automatically flags text check-ins that display severe stress or extreme negative sentiment.
- **Interventions:** Admins can review flagged items and potentially trigger automated supportive messages or health checkups for vulnerable users.

---

## 📱 5. Social Feed Moderation

Under the **Content / Feed** tab:
- Review user posts, images, and comments that have been reported by the community.
- Approve or remove flagged content to maintain a positive and supportive social environment.
- Moderate the Leaderboards to ensure there is no data spoofing (e.g., GPS tampering to get impossible running times).

---

## ⚙️ 6. System Configuration

- **Manage Health Checkups:** Schedule periodic global platform events or health assessments.
- **System Logs:** Review recent backend logs, server errors, and triggered fallback scripts (e.g., `backfillLastPrediction`).

---

## ❓ 7. Troubleshooting

* **Dashboard not updating:** Ensure that your role hasn't expired (JWT timeout) and that the backend server is reachable.
* **Sentiment scores not showing:** The ML backend may be offline. Check with your backend engineering team or run the `print:predictions` maintenance script.
