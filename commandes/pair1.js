const { zokou } = require("../framework/zokou");
const axios = require("axios");

// Validate phone number
function validatePhoneNumber(number) {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(number.replace(/\s+/g, ""));
}

// Rate limit
const userRequests = new Map();
const RATE_LIMIT_TIME = 30000;

function isRateLimited(userId) {
  const now = Date.now();
  const lastRequest = userRequests.get(userId);
  if (lastRequest && now - lastRequest < RATE_LIMIT_TIME) return true;
  userRequests.set(userId, now);
  return false;
}

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
        return repondre("⏳ Please wait 30 seconds before another request.");
      }

      if (!arg || arg.length === 0) {
        return repondre("⚠️ Provide number: 25578xxxxxxx");
      }

      const number = arg.join(" ").replace(/\s+/g, "");

      if (!validatePhoneNumber(number)) {
        return repondre("❌ Invalid number. Use 25578xxxxxxx");
      }

      await repondre("🕓 Generating Pair Code…");

      // API URL
      const apiUrl = `https://dml-new-session-efk0.onrender.com/code?number=${encodeURIComponent(
        number
      )}`;

      const response = await axios.get(apiUrl, { timeout: 30000 });

      if (!response.data?.code) {
        return repondre("❌ No code received from API.");
      }

      const pairCode = response.data.code; // EXACT CODE HERE

      // -------- SEND MESSAGE WITH COPY BUTTON --------
      await zk.sendMessage(
        dest,
        {
          interactiveMessage: {
            header: {
              title: "PAIR CODE GENERATED ⚡"
            },
            body: {
              text: `Number: ${number}\n\nClick the button below to copy your Pair Code:`
            },
            footer: {
              text: "DML TECH"
            },

            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    id: `copy_${Date.now()}`,
                    display_text: "📋 COPY PAIR CODE",
                    copy_code: pairCode   // <-- EXACT CODE COPIED
                  })
                }
              ]
            }
          }
        },
        { quoted: msg }
      );

    } catch (err) {
      console.error("PAIR ERROR:", err);

      if (err.code === "ECONNABORTED") {
        return repondre("❌ Timeout. Try again.");
      }
      return repondre("❌ Failed to generate Pair Code.");
    }
  }
);
