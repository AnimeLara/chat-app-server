const admin = require("firebase-admin");

// Environment variables validation
if (!process.env.FIREBASE_CONFIG) {
  console.error("❌ FIREBASE_CONFIG environment variable is missing");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
} catch (error) {
  console.error("❌ Failed to parse FIREBASE_CONFIG:", error);
  process.exit(1);
}

// Enhanced initialization
const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "your-database-url" // Uncomment if needed
});

console.log("✅ Firebase Admin SDK initialized for project:", serviceAccount.project_id);

/**
 * Enhanced push notification sender with retry logic
 * @param {string} token - FCM device token
 * @param {string} messageText - Notification body text
 * @param {string} [senderName="Someone"] - Sender's name
 * @param {object} [additionalData={}] - Additional data payload
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
async function sendPushNotification(
  token, 
  messageText, 
  senderName = "Someone",
  additionalData = {}
) {
  // Input validation
  if (!token || typeof token !== 'string') {
    console.error("❌ Invalid FCM token:", token);
    return false;
  }

  // Basic token format validation
  if (!token.startsWith('d') && !token.startsWith('f')) {
    console.error("❌ Malformed FCM token format");
    return false;
  }

  const payload = {
    notification: {
      title: `New message from ${senderName}`,
      body: messageText,
      sound: 'default'
    },
    data: {
      ...additionalData,
      sender: senderName,
      message: messageText,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      timestamp: new Date().toISOString()
    },
    token: token,
    android: {
      priority: 'high',
      notification: {
        channel_id: 'high_importance_channel',
        sound: 'default',
        icon: 'ic_notification',
        color: '#FF0000' // Your brand color
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          'mutable-content': 1 // For rich notifications
        }
      },
      fcm_options: {
        image: additionalData.imageUrl || '' // For iOS rich notifications
      }
    },
    webpush: {
      headers: {
        Urgency: 'high'
      }
    }
  };

  // Add retry logic for transient errors
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      attempt++;
      const response = await admin.messaging().send(payload);
      console.log(`✅ Notification sent (attempt ${attempt}):`, response);
      return true;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.log("⚠️ Removing invalid token from database");
        // Add your logic to remove invalid token here
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return false;
}

module.exports = {
  sendPushNotification,
  admin,
  firebaseApp
};
