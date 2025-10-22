const { zokou } = require("../framework/zokou");
const conf = require("../set");
const { jidDecode } = require("@whiskeysockets/baileys");

zokou(
  {
    nomCom: "getpp",
    categorie: "Tools",
  },
  async (dest, zk, commandeOptions) => {
    const { ms, repondre, auteurMessage, nomAuteurMessage, msgRepondu, auteurMsgRepondu } = commandeOptions;

    try {
      let jid;
      let nom;

      // Determine target JID and name
      if (!msgRepondu) {
        jid = auteurMessage;
        nom = nomAuteurMessage;
      } else {
        jid = auteurMsgRepondu;
        nom = "@" + auteurMsgRepondu.split("@")[0];
      }

      // Try fetching the profile picture
      let ppUrl;
      try {
        ppUrl = await zk.profilePictureUrl(jid, "image");
      } catch {
        ppUrl = conf.IMAGE_MENU || "https://files.catbox.moe/z2rr5a.jpg";
      }

      // Build fake vCard sender info
      const fakeVCard = {
        key: {
          fromMe: false,
          participant: "0@s.whatsapp.net",
          remoteJid: "status@broadcast",
        },
        message: {
          contactMessage: {
            displayName: "DML TECH ✅",
            vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:DML TECH ✅\nORG:DML-MD;\nTEL;type=CELL;waid=255700000000:+255700000000\nEND:VCARD",
            jpegThumbnail: Buffer.from([]),
          },
        },
      };

      // Send message with image
      const mess = {
        image: { url: ppUrl },
        caption: `✅ *Profile Picture of* ${nom}`,
        mentions: msgRepondu ? [auteurMsgRepondu] : [],
        contextInfo: {
          mentionedJid: msgRepondu ? [auteurMsgRepondu] : [],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: "DML-TEAM",
            newsletterJid: "120363387497418815@newsletter",
          },
        },
      };

      await zk.sendMessage(dest, mess, { quoted: fakeVCard });
    } catch (err) {
      console.error("Error in getpp command:", err);
      repondre("❌ Failed to fetch profile picture.");
    }
  }
);
