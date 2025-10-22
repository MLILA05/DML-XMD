const { zokou } = require("../framework/zokou");
const axios = require("axios");

zokou(
  {
    nomCom: "tiny",
    alias: ["short", "shorturl"],
    categorie: "convert",
    use: "<url>",
  },
  async (dest, zk, commandeOptions) => {
    const { arg, repondre, auteurMessage } = commandeOptions;

    console.log("Command tiny triggered");

    if (!arg || !arg[0]) {
      console.log("No URL provided");
      return repondre("*♻  Please Provide a Link.*");
    }

    try {
      const link = arg[0];
      console.log("URL to shorten:", link);

      const response = await axios.get(`https://tinyurl.com/api-create.php?url=${link}`);
      const shortenedUrl = response.data;

      console.log("Shortened URL:", shortenedUrl);

      const text = `*✅YOUR SHORTENED URL*\n\n${shortenedUrl}`;

      // Send message with forwarded-like context
      await zk.sendMessage(dest, {
        text,
        contextInfo: {
          mentionedJid: [auteurMessage],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363387497418815@newsletter",
            newsletterName: "DML-TINY",
            serverMessageId: 143,
          },
        },
      });
    } catch (e) {
      console.error("Error shortening URL:", e);
      return repondre("An error occurred while shortening the URL. Please try again.");
    }
  }
);
