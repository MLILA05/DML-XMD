const { cmd } = require('../zokou/command');
const config = require("../config");

cmd({ on: "body" }, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins, reply }) => {
  try {

    // Create warning storage if not exists
    if (!global.warnings) global.warnings = {};

    // Only check anti-link in groups
    if (!isGroup) return;

    // Ignore admins
    if (isAdmins) return;

    // Bot must be admin to delete/remove
    if (!isBotAdmins) return;

    // Link detection patterns (cleaner & faster)
    const linkPatterns = [
      /https?:\/\/chat\.whatsapp\.com\/\S+/gi,
      /wa\.me\/\S+/gi,
      /https?:\/\/t\.me\/\S+/gi,
      /https?:\/\/telegram\.me\/\S+/gi,
      /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
      /https?:\/\/(?:www\.)?youtu\.be\/\S+/gi,
      /https?:\/\/(?:www\.)?[a-z0-9-]+\.(com|net|org|me|info)\/\S*/gi // generic safe link detection
    ];

    const containsLink = linkPatterns.some(pattern => pattern.test(body));

    // Anti-link must be enabled
    if (containsLink && config.ANTI_LINK === 'true') {

      console.log(`Detected Link from ${sender}: ${body}`);

      // Try to delete the message
      try {
        await conn.sendMessage(from, { delete: m.key });
        console.log(`Deleted message from: ${sender}`);
      } catch (e) {
        console.log("Delete Error:", e);
      }

      // Count warnings
      global.warnings[sender] = (global.warnings[sender] || 0) + 1;

      const count = global.warnings[sender];

      if (count < 3) {

        await conn.sendMessage(from, {
          text:
`⚠️ *LINK NOT ALLOWED!* ⚠️

*USER:* @${sender.split('@')[0]}
*WARNING:* ${count}/3
*REASON:* Sending links

*Next time you may be removed!*`,
          mentions: [sender],
        });

      } else {

        await conn.sendMessage(from, {
          text: `🚫 @${sender.split('@')[0]} has been *removed* for sending links repeatedly!`,
          mentions: [sender]
        });

        await conn.groupParticipantsUpdate(from, [sender], "remove");

        delete global.warnings[sender];
      }
    }

  } catch (err) {
    console.error("ANTI-LINK ERROR:", err);
    reply("⚠️ Error while checking links.");
  }
});
