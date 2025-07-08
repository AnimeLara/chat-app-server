const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG); 

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
  // messageData should contain: { text, from, to, id }
  if (!token) {
    console.error("❌ No FCM token provided");
    return false;
  }

  const payload = {
    notification: {
      title: `New message from ${messageData.from}`,
      body: messageData.text,
      sound: 'default'
    },
    data: {
      // Required for Flutter to handle the notification
      type: 'chat',
      text: messageData.text,
      from: messageData.from,
      id: messageData.id,
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    token: token,
    android: {
      priority: 'high',
      notification: {
        channel_id: 'high_importance_channel',
        sound: 'default',
        icon: '@mipmap/ic_launcher', // Make sure this matches your Flutter app
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
    },
    webpush: {
      headers: {
        Urgency: 'high'
      }
    }
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log("✅ Successfully sent notification:", response);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    
    // Handle invalid tokens
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log("⚠️ Removing invalid token from database");
      // Add logic here to remove the invalid token from your database
    }
    
    return false;
  }
}

// Improved module export
module.exports = { 
  sendPushNotification,
  admin
};
