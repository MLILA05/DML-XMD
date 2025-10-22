const { cmd } = require("../command");
const conf = require("../set");

cmd({
  pattern: "profile",
  alias: ["ppinfo", "getprofile"],
  use: "profile [reply/user]",
  desc: "Fetch a user's profile picture and status (works in group or DM).",
  category: "tools",
  react: "👤",
  filename: __filename
},
async (conn, mek, m, { from, sender, reply, isGroup }) => {
  try {
    const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
    const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    let targetJid, displayName;

    if (isGroup) {
      if (quotedParticipant && quotedMessage) {
        targetJid = quotedParticipant;
        displayName = `@${quotedParticipant.split('@')[0]}`;
      } else {
        targetJid = sender;
        displayName = "You";
      }
    } else {
      targetJid = from.endsWith("@s.whatsapp.net") ? from : sender;
      displayName = "You";
    }

    // Fetch profile picture
    let profilePic;
    try {
      profilePic = await conn.profilePictureUrl(targetJid, "image");
    } catch {
      profilePic = conf.IMAGE_MENU || "https://files.catbox.moe/z2rr5a.jpg";
    }

    // Fetch status
    let statusText;
    try {
      const status = await conn.fetchStatus(targetJid);
      statusText = status?.status || "No status found.";
    } catch {
      statusText = "Failed to fetch status.";
    }

    // Fake vCard for nice quote look
    const fakeVCard = {
      key: {
        fromMe: false,
        participant: '0@s.whatsapp.net',
        remoteJid: "status@broadcast"
      },
      message: {
        contactMessage: {
          displayName: "DML TECH ✅",
          vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:DML TECH ✅\nORG:DML TEAM;\nTEL;type=CELL;type=VOICE;waid=255700000000:+255 700 000000\nEND:VCARD",
          jpegThumbnail: Buffer.from([])
        }
      }
    };

    // Send message
    await conn.sendMessage(from, {
      image: { url: profilePic },
      caption: `👤 *Name:* ${displayName}\n💬 *Status:*\n${statusText}`,
      contextInfo: {
        mentionedJid: [targetJid],
        forwardingScore: 10,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "DML-TEAM",
          newsletterJid: "120363387497418815@newsletter"
        }
      }
    }, { quoted: fakeVCard });

  } catch (err) {
    console.error("Error in profile command:", err);
    reply("❌ Failed to fetch profile information. Please try again later.");
  }
});
