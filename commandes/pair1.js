const { zokou } = require("../framework/zokou");
const axios = require("axios");

// Enhanced phone number validation
function validatePhoneNumber(number) {
  const phoneRegex = /^(?:\+?255|0)?\d{9}$/; // Better Tanzanian number support
  return phoneRegex.test(number.replace(/\s+/g, ""));
}

// Enhanced rate limiting with request counting
const userRequests = new Map();
const RATE_LIMIT_TIME = 30000; // 30 seconds
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(userId) {
  const now = Date.now();
  const userData = userRequests.get(userId) || { count: 0, firstRequest: now };
  
  // Reset counter if window expired
  if (now - userData.firstRequest > RATE_LIMIT_TIME) {
    userData.count = 0;
    userData.firstRequest = now;
  }
  
  userData.count++;
  userRequests.set(userId, userData);
  
  return userData.count > MAX_REQUESTS_PER_WINDOW;
}

// Store button data with expiration
const buttonCodeMap = new Map();
const BUTTON_EXPIRY = 25000; // 25 seconds

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buttonCodeMap.entries()) {
    if (now - value.timestamp > BUTTON_EXPIRY) {
      buttonCodeMap.delete(key);
    }
  }
}, 60000); // Clean every minute

zokou(
  {
    nomCom: "pair1",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "🔔",
    categorie: "General",
  },
  async (dest, zk, msg) => {
    const { repondre, arg, auteur } = msg;
    const userId = auteur || dest;

    try {
      if (isRateLimited(userId)) {
        return repondre("⏳ Please wait 30 seconds before making another request. (Max 3 requests per 30 seconds)");
      }

      if (!arg || arg.length === 0) {
        const usage = `
📋 *USAGE GUIDE*
• *Command:* .pair [number]
• *Example:* .pair 255787654321
• *Format:* Tanzanian numbers (255XXXXXXXXX)
        `;
        return repondre(usage);
      }

      const number = arg.join(" ").replace(/\s+/g, "");

      if (!validatePhoneNumber(number)) {
        const example = `
❌ *INVALID NUMBER*
• Use Tanzanian format: 255787654321
• 9 digits after country code
• Example: 255712345678
        `;
        return repondre(example);
      }

      await repondre("🕓 Please wait... generating Pair Code...");

      const apiUrl = `https://dml-new-session-efk0.onrender.com/code?number=${encodeURIComponent(number)}`;

      const response = await axios.get(apiUrl, { 
        timeout: 30000,
        validateStatus: (status) => status < 500 
      });
      
      const data = response.data;

      if (!data?.code) {
        console.error('API response:', data);
        return repondre("❌ No code received from API. The service might be temporarily unavailable.");
      }

      const pairCode = data.code.trim();

      // Create unique button ID and store with timestamp
      const uniqueButtonId = `pairCode_${userId}_${Date.now()}`;
      buttonCodeMap.set(uniqueButtonId, {
        code: pairCode,
        timestamp: Date.now(),
        number: number // Store for debugging
      });

      const messageText = `
🎯 *PAIR CODE READY!*

📱 Number: ${number}
⏰ Code expires in 25 seconds

Click the button below to receive the Pair Code.
      `;

      await zk.sendMessage(dest, {
        text: messageText,
        buttons: [
          {
            buttonId: uniqueButtonId,
            buttonText: { displayText: "📋 REVEAL CODE" },
            type: 1,
          },
        ],
        headerType: 1,
      });

    } catch (error) {
      console.error("Pair code error:", error);

      if (error.code === "ECONNABORTED") {
        return repondre("❌ Request timed out. Please try again.");
      } else if (error.response?.status === 429) {
        return repondre("❌ Too many requests to the service. Please wait a few minutes.");
      } else if (error.response?.status >= 500) {
        return repondre("❌ Service temporarily unavailable. Please try again later.");
      }

      return repondre("❌ Failed to generate Pair Code. Please try again.");
    }
  }
);

// Enhanced button handler
zokou(
  { on: "message" },
  async (dest, zk, msg) => {
    try {
      const btn = msg?.message?.buttonsResponseMessage;
      if (!btn) return;

      const buttonId = btn.selectedButtonId;
      if (!buttonId?.startsWith("pairCode_")) return;

      const buttonData = buttonCodeMap.get(buttonId);
      
      // Check if code exists and isn't expired
      if (!buttonData) {
        return zk.sendMessage(dest, {
          text: "❌ Code expired. Please generate a new one using .pair [number]",
        });
      }

      // Check expiry
      if (Date.now() - buttonData.timestamp > BUTTON_EXPIRY) {
        buttonCodeMap.delete(buttonId);
        return zk.sendMessage(dest, {
          text: "❌ Code has expired. Please generate a new one using .pair [number]",
        });
      }

      // Delete immediately after use
      buttonCodeMap.delete(buttonId);

      // Send code with copy-friendly formatting
      await zk.sendMessage(dest, {
        text: `📋 *YOUR PAIR CODE:*\n\n\`\`\`${buttonData.code}\`\`\`\n\nCopy this code and use it to pair your device.`,
      });

    } catch (err) {
      console.error("Button handler error:", err);
      // Don't send error message to user to avoid spam
    }
  }
);
