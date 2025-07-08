const admin = require("firebase-admin");
// const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG); 
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

async function sendPushNotification(token, messageData) {
  if (!token) {
    console.error("❌ No FCM token provided");
    return false;
  }

  // Convert all data values to strings
  const stringData = {
    type: 'chat',
    text: String(messageData.text),
    from: String(messageData.from),
    id: String(messageData.id),
    click_action: 'FLUTTER_NOTIFICATION_CLICK'
  };

  const payload = {
    notification: {
      title: `New message from ${messageData.from}`,
      body: String(messageData.text), // Ensure body is string
      sound: 'default'
    },
    data: stringData, // Use the string-converted data
    token: token,
    android: {
      priority: 'high',
      notification: {
        channel_id: 'high_importance_channel',
        sound: 'default',
        icon: '@mipmap/ic_launcher',
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          'mutable-content': 1
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
    
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log("⚠️ Removing invalid token from database");
      // Add token removal logic here
    }
    
    return false;
  }
}

// Improved module export
module.exports = { 
  sendPushNotification,
  admin
};
