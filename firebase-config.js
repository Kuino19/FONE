// Foursquare National Evangelists (FONE) Firebase Configuration
// Replace with your real Firebase Web App credentials.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Admin panel access password (change as needed)
const ADMIN_PASSWORD = "foneadmin2026";

// Simple check to alert users to configure Firebase
if (firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.apiKey) {
  console.warn("FONE website is running without active Firebase credentials. Please configure firebase-config.js to enable the Prayer Wall.");
}
