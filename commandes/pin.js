const { zokou } = require("../framework/zokou");

const pinnedMemory = new Map();

zokou({
  nomCom: "pin",
  categorie: "General",
  reaction: "📌",
  desc: "Pin a message and jump back to it\nUse: *pin* while quoting a message to pin, or *pin* alone to view pinned message"
}, async (dest, zk, { repondre, ms, arg }) => {
  try {
    const quoted = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedMsgId = ms.message.extendedTextMessage?.contextInfo?.stanzaId;
    const sender = ms.message.extendedTextMessage?.contextInfo?.participant;

    // Check if user wants to clear pinned message
    if (arg && arg.toLowerCase() === 'clear') {
      if (pinnedMemory.has(dest)) {
        pinnedMemory.delete(dest);
        return repondre("🗑️ *Pinned message cleared!*");
      } else {
        return repondre("📭 No pinned message to clear.");
      }
    }

    if (quoted && quotedMsgId) {
      // User is quoting a message - check if it's the pinned message
      const pinned = pinnedMemory.get(dest);
      
      if (pinned && quotedMsgId === pinned.id) {
        // User is replying to the pinned message - repost it
        await repondre(`📍 *Pinned Message Reposted* 📍\n👤 From: @${pinned.sender.split("@")[0]}\n🕒 ${pinned.time}\n\n📌 *Brought to top by request*`);
        return;
      }

      // Save new pinned message
      pinnedMemory.set(dest, {
        id: quotedMsgId,
        sender: sender || ms.key.participant || ms.key.remoteJid,
        time: new Date().toLocaleString(),
        timestamp: Date.now()
      });

      const actualSender = sender || ms.key.participant || ms.key.remoteJid;
      await repondre(`📌 *Message Pinned!*\n👤 From: @${actualSender.split("@")[0]}\n🕒 ${new Date().toLocaleString()}\n\nUse *pin* alone to bring this message to the top.`);

    } else {
      // No quoted message - show the pinned message
      const pinned = pinnedMemory.get(dest);
      if (!pinned) {
        return repondre(`📭 No pinned message found.\n\n*How to use:*\n• Reply to a message with *pin* to pin it\n• Use *pin* alone to view pinned message\n• Use *pin clear* to remove pinned message`);
      }

      // Check if message is too old (optional: 24-hour limit)
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - pinned.timestamp > oneDay) {
        pinnedMemory.delete(dest);
        return repondre("⏰ The pinned message has expired (24 hours). Please pin a new message.");
      }

      // Repost the pinned message by quoting it
      await zk.sendMessage(dest, {
        text: `📍 *Pinned Message* 📍\n👤 From: @${pinned.sender.split("@")[0]}\n🕒 ${pinned.time}\n\n📌 *Brought to top by request*`,
        mentions: [pinned.sender],
        quoted: {
          key: {
            remoteJid: dest,
            id: pinned.id
          },
          message: {
            conversation: "📍 Pinned Message Reference"
          }
        }
      });
    }
  } catch (err) {
    console.error("Pin Error:", err);
    repondre("❌ Error while processing pin command. Please try again.");
  }
});

// Auto-cleanup for old pinned messages
setInterval(() => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  for (const [dest, pinned] of pinnedMemory.entries()) {
    if (now - pinned.timestamp > oneDay) {
      pinnedMemory.delete(dest);
    }
  }
}, 60 * 60 * 1000);
