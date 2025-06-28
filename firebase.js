const admin = require("firebase-admin");
const serviceAccount = require("./firebase-key.json");

// Initialize Firebase Admin SDK with better error handling
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Add your databaseURL if needed
    // databaseURL: "your-database-url"
  });
  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
  process.exit(1); // Exit if initialization fails
}

async function sendPushNotification(token, messageText, senderName = "Someone") {
  if (!token) {
    console.error("❌ No FCM token provided");
    return false;
  }

  const payload = {
    notification: {
      title: `New message from ${senderName}`,
      body: messageText,
      // For iOS sound
      sound: 'default'
    },
    data: {
      // Custom data payload
      message: messageText,
      sender: senderName,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    token: token,
    // Platform-specific configurations
    android: {
      priority: 'high',
      notification: {
        channel_id: 'high_importance_channel', // Required for Android 8.0+
        sound: 'default',
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("✅ Successfully sent notification:", response);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    
    // Handle specific error cases
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log("⚠️ The registration token is invalid or unregistered");
      // You might want to remove this token from your database
    }
    
    return false;
  }
}

// Improved module export
module.exports = { 
  sendPushNotification,
  admin // Export admin instance if needed elsewhere
};