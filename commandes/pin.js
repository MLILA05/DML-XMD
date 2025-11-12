const { zokou } = require("../framework/zokou");

// Memory-based storage
const pinnedMessages = new Map();

zokou(
  {
    nomCom: "pin",
    categorie: "General",
    desc: "Pin or show pinned message",
    reaction: "📌"
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, ms, auteurMessage, arg } = commandeOptions;
    const chatId = dest;

    try {
      // Kama ana reply message na kuandika pin
      if (ms.message.extendedTextMessage && !arg[0]) {
        const replyMsg = ms.message.extendedTextMessage.contextInfo?.quotedMessage;
        const sender = ms.message.extendedTextMessage.contextInfo?.participant;

        if (!replyMsg) return repondre("⚠️ Reply to a message and type *pin* to pin it.");

        let pinnedText = "";
        if (replyMsg.conversation) pinnedText = replyMsg.conversation;
        else if (replyMsg.extendedTextMessage?.text) pinnedText = replyMsg.extendedTextMessage.text;
        else if (replyMsg.imageMessage) pinnedText = "(📸 Image pinned)";
        else pinnedText = "(Unsupported message type)";

        pinnedMessages.set(chatId, {
          text: pinnedText,
          sender: sender,
          time: new Date().toLocaleString()
        });

        await zk.sendMessage(chatId, {
          text: `📌 *Message Pinned!*\n\n> ${pinnedText}\n\n👤 From: @${sender.split("@")[0]}`,
          mentions: [sender]
        });
        return;
      }

      // Kama anaandika tu pin bila reply
      if (!arg[0] && !ms.message.extendedTextMessage) {
        const pinned = pinnedMessages.get(chatId);
        if (!pinned)
          return repondre("📭 Hakuna message yoyote iliyopinwa kwenye chat hii.");

        await zk.sendMessage(chatId, {
          text: `📍 *Pinned Message:*\n\n${pinned.text}\n\n👤 From: @${pinned.sender.split("@")[0]}\n🕒 ${pinned.time}`,
          mentions: [pinned.sender]
        });
        return;
      }

      // Kama anaandika "pin unpin"
      if (arg[0] && arg[0].toLowerCase() === "unpin") {
        if (pinnedMessages.has(chatId)) {
          pinnedMessages.delete(chatId);
          return repondre("❌ *Pinned message removed successfully!*");
        } else {
          return repondre("⚠️ Hakuna pinned message ya kufuta hapa.");
        }
      }

      // Help text
      return repondre(
        `📌 *Pin Commands:*\n` +
        `• Reply message and type *pin* - to pin it\n` +
        `• *!pin* - to view pinned message\n` +
        `• *!pin unpin* - to remove pinned message`
      );

    } catch (error) {
      console.error("Pin Command Error:", error);
      repondre("❌ An error occurred while processing the pin command.");
    }
  }
);
