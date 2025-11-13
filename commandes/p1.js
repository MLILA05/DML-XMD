const { zokou } = require("../framework/zokou");
const axios = require("axios");
const ytSearch = require("yt-search");

const apiKey = 'gifted_api_6kuv56877d';

const audioApis = [
  `https://api.giftedtech.web.id/api/download/ytdlv2?apikey=${apiKey}&url=`,
  `https://api.giftedtech.web.id/api/download/ytdl?apikey=${apiKey}&url=`,
  `https://apis.davidcyriltech.my.id/download/ytmp3?url=`,
  `https://apis.davidcyriltech.my.id/youtube/mp3?url=`
];

const videoApis = [
  `https://api.giftedtech.web.id/api/download/ytmp4?apikey=${apiKey}&url=`,
  `https://iamtkm.vercel.app/downloaders/ytmp4?url=`,
  `https://apis.davidcyriltech.my.id/download/ytmp4?url=`,
  `https://api.giftedtech.web.id/api/download/ytv?apikey=${apiKey}&url=`,
  `https://apis.davidcyriltech.my.id/youtube/mp4?url=`,
  `https://api.giftedtech.web.id/api/download/ytvideo?apikey=${apiKey}&url=`
];

const downloadSessions = new Map();

zokou({
  nomCom: "play0",
  aliases: ["song", "video", "music", "yt"],
  categorie: "Download",
  reaction: "🎵"
}, async (dest, zk, commandOptions) => {
  const { arg, ms, repondre } = commandOptions;

  if (!arg[0]) {
    return repondre("❗ Please provide a song or video name to search.");
  }

  const query = arg.join(" ");

  try {
    const searchResults = await ytSearch(query);
    if (!searchResults.videos.length) {
      return repondre("❌ No results found for your search.");
    }

    const video = searchResults.videos[0];
    const videoUrl = video.url;

    // Create WhatsApp Buttons
    const buttons = [
      { buttonId: `audio_${videoUrl}`, buttonText: { displayText: "🎵 Download Audio" }, type: 1 },
      { buttonId: `video_${videoUrl}`, buttonText: { displayText: "🎬 Download Video" }, type: 1 },
      { buttonId: `channel_join`, buttonText: { displayText: "📢 Join Channel" }, type: 1 }
    ];

    const buttonMessage = {
      image: { url: video.thumbnail },
      caption: `🎬 *${video.title}*\n\n🎤 *Channel:* ${video.author.name}\n⏱️ *Duration:* ${video.timestamp}\n👀 *Views:* ${video.views}\n\n📀 Choose an option below:`,
      footer: "DML-XMD YouTube Downloader",
      buttons,
      headerType: 2,
      contextInfo: {
        externalAdReply: {
          title: "DML-XMD YouTube Downloader",
          body: "Tap a button below to start download",
          thumbnailUrl: video.thumbnail,
          mediaType: 2,
          mediaUrl: video.url,
          sourceUrl: video.url
        }
      }
    };

    // Send Buttons
    const sentMessage = await zk.sendMessage(dest, buttonMessage, { quoted: ms });

    // Save session
    downloadSessions.set(sentMessage.key.id, {
      videoUrl,
      videoTitle: video.title,
      dest,
      createdAt: Date.now()
    });

    // Clean old sessions
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [id, session] of downloadSessions.entries()) {
      if (session.createdAt < oneHourAgo) downloadSessions.delete(id);
    }

  } catch (error) {
    console.error("Search error:", error);
    return repondre("⚠️ Error searching for the video. Please try again.");
  }
});

// ==========================================
// HANDLE BUTTON CLICKS
// ==========================================
zokou.ev?.on("messages.upsert", async (m) => {
  const msg = m.messages[0];
  if (!msg?.message) return;

  const buttonId = msg.message?.buttonsResponseMessage?.selectedButtonId;
  const sender = msg.key.remoteJid;
  if (!buttonId) return;

  try {
    if (buttonId.startsWith("audio_")) {
      const videoUrl = buttonId.split("audio_")[1];
      await zk.sendMessage(sender, { text: "🎧 *Downloading audio... please wait.*" });
      await handleDownload("audio", videoUrl, sender, zk, msg);
    }

    else if (buttonId.startsWith("video_")) {
      const videoUrl = buttonId.split("video_")[1];
      await zk.sendMessage(sender, { text: "🎬 *Downloading video... please wait.*" });
      await handleDownload("video", videoUrl, sender, zk, msg);
    }

    else if (buttonId === "channel_join") {
      await zk.sendMessage(sender, {
        text: `📢 *DML-XMD Official Channel*\n\nJoin our WhatsApp Channel:\n🔗 https://whatsapp.com/channel/0029VbBf4Y52kNFkFCx2pF1H\n\n🌐 *Website:* dml-tech.online\n\n💫 Stay connected with the DML-XMD Family!`
      }, { quoted: msg });
    }
  } catch (err) {
    console.error("Button handler error:", err);
    await zk.sendMessage(sender, { text: "❌ Error processing your request. Try again later." });
  }
});

// ==========================================
// DOWNLOAD FUNCTION
// ==========================================
async function handleDownload(type, videoUrl, dest, zk, originalMsg) {
  try {
    const apis = type === "audio" ? audioApis : videoApis;
    const encodedUrl = encodeURIComponent(videoUrl);
    let downloadUrl = null;

    for (const api of apis) {
      try {
        const response = await axios.get(`${api}${encodedUrl}`);
        if (
          response.data?.result?.download_url ||
          response.data?.url ||
          response.data?.audio_url ||
          response.data?.video_url
        ) {
          downloadUrl =
            response.data.result?.download_url ||
            response.data.url ||
            response.data.audio_url ||
            response.data.video_url;
          break;
        }
      } catch {
        console.log(`API ${api} failed, trying next...`);
      }
    }

    if (!downloadUrl) {
      return await zk.sendMessage(dest, {
        text: `❌ Failed to download ${type}. Please try again later.`
      }, { quoted: originalMsg });
    }

    if (type === "audio") {
      const audioResponse = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      const audioBuffer = Buffer.from(audioResponse.data, "binary");

      await zk.sendMessage(dest, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        contextInfo: {
          externalAdReply: {
            title: "🎧 Your Audio Download",
            body: "DML-XMD Downloader",
            mediaType: 2,
            thumbnailUrl: "https://files.catbox.moe/42upty.jpg",
            mediaUrl: downloadUrl,
            sourceUrl: downloadUrl
          }
        }
      }, { quoted: originalMsg });
    } else {
      const videoResponse = await axios.get(downloadUrl, { responseType: "arraybuffer" });
      const videoBuffer = Buffer.from(videoResponse.data, "binary");

      await zk.sendMessage(dest, {
        video: videoBuffer,
        mimetype: "video/mp4",
        caption: "🎬 *Here’s your video download!*",
        contextInfo: {
          externalAdReply: {
            title: "🎬 Your Video Download",
            body: "DML-XMD Downloader",
            mediaType: 2,
            thumbnailUrl: "https://files.catbox.moe/42upty.jpg",
            mediaUrl: downloadUrl,
            sourceUrl: downloadUrl
          }
        }
      }, { quoted: originalMsg });
    }

  } catch (error) {
    console.error("Download error:", error);
    await zk.sendMessage(dest, {
      text: `❌ Error during ${type} download. Please try again later.`
    }, { quoted: originalMsg });
  }
  }
