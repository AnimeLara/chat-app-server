const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sendPushNotification } = require('./firebase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userTokens = new Map();

app.use(cors());
app.use(express.json());

// नया रूट जोड़ा गया - मुख्य पेज के लिए
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chat Server</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f0f0f0;
        }
        .message {
          font-size: 3rem;
          font-weight: bold;
          color: #2c3e50;
          text-align: center;
          padding: 2rem;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .details {
          margin-top: 1rem;
          font-size: 1.2rem;
          color: #7f8c8d;
        }
      </style>
    </head>
    <body>
    
      <div class="message">
        🚀 SERVER STARTED
        <div class="details">
          Chat server is running on port ${PORT}
        </div>
      </div>
    </body>
    </html>
  `);
});

app.post('/save-token', (req, res) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ error: 'Missing userId or token' });
    }

    userTokens.set(userId, token);
    console.log(`🔑 Token saved for ${userId}`);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Token save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ ${socket.id} connected`);

  socket.on('message', async (data) => {
    try {
      if (!data?.text || !data?.to) {
        return console.warn('Invalid message format');
      }

      console.log(`📩 ${data.from} → ${data.to}: ${data.text}`);
      io.emit('message', data);

      const receiverToken = userTokens.get(data.to);
      if (receiverToken) {
        await sendPushNotification(
          receiverToken,
          data.text,
          data.from
        );
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.id} disconnected`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});