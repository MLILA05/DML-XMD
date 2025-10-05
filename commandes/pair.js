const { zokou } = require("../framework/zokou");
const { default: axios } = require("axios");

zokou(
  {
    nomCom: "pair",
    aliases: ["session", "pair", "paircode", "qrcode"],
    reaction: "👍🏻",
    categorie: "General",
  },
  async (dest, origine, msg) => {
    const { repondre, arg, sender } = msg;

    try {
      // Validate number input
      if (!arg || arg.length === 0) {
        return repondre("*Please provide a number in the format: 25578........*");
      }

      await repondre("*Please wait DML-XMD... Generating pair code*");

      // Encode the number for API URL
      const encodedNumber = encodeURIComponent(arg.join(""));
      const apiUrl = `https://zokou-session.onrender.com/code?number=${encodedNumber}`;

      // Fetch pair code from API
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data?.code) {
        // Send code first
        await repondre(data.code, {
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363401025139680@newsletter',
              newsletterName: "DML-PAIR",
              serverMessageId: 143,
            },
          },
        });

        // Instruction message
        await repondre("*Copy the above code and use it to link your WhatsApp via linked devices*");
      } else {
        throw new Error("Invalid response from API - no code found");
      }

    } catch (error) {
      console.error("Error getting API response:", error.message);
      repondre("Error: Could not get response from the pairing service.");
    }
  }
);
