const { zokou } = require("../framework/zokou");
const axios = require("axios");
const ytSearch = require("yt-search");

// Shared API configurations
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

// Active sessions keyed by chat ID - NEVER EXPIRE
const downloadSessions = new Map();

zokou(
  {
    nomCom: "play",
    aliases: ["song", "video", "music", "yt"],
    categorie: "Download",
    reaction: "🎵"
  },
  async (dest, zk, { arg, ms, repondre }) => {

    if (!arg[0]) return repondre("Please provide a song or video name.");
    
    const query = arg.join(" ");
    
    try {
      const searchResults = await ytSearch(query);
      if (!searchResults.videos.length) return repondre("No results found.");
      
      const video = searchResults.videos[0];
      const videoUrl = video.url;
      
      const firstButtons = [
        { buttonId: "audio", buttonText: { displayText: "🎵 AUDIO" }, type: 1 },
        { buttonId: "video", buttonText: { displayText: "🎥 VIDEO" }, type: 1 },
        { buttonId: "channel", buttonText: { displayText: "📢 CHANNEL" }, type: 1 },
      ];

      // Send first menu
      await zk.sendMessage(
        dest,
        {
          image: { url: video.thumbnail },
          caption: `*${video.title}*\n\n` +
            `🎬 *Channel:* ${video.author.name}\n` +
            `⏱️ *Duration:* ${video.timestamp}\n` +
            `👀 *Views:* ${video.views}\n\n` +
            `Choose an option below 👇`,
          buttons: firstButtons,
          headerType: 4,
        },
        { quoted: ms }
      );

      // Save session - NO EXPIRATION
      downloadSessions.set(dest, {
        videoUrl,
        videoTitle: video.title,
        dest,
        thumbnail: video.thumbnail,
        createdAt: Date.now()
      });

      // Initialize button handler if not already set
      if (!zk._ytButtonHandler) {
        zk._ytButtonHandler = true;
        
        zk.ev.on("messages.upsert", async (update) => {
          const message = update.messages[0];
          
          // Ignore if it's not a button response
          if (!message?.message?.buttonsResponseMessage) return;
          
          const btn = message.message.buttonsResponseMessage;
          const buttonId = btn.selectedButtonId;
          const chatId = message.key.remoteJid;
          
          // Get session for this chat - NO EXPIRATION CHECK
          const session = downloadSessions.get(chatId);
          
          // Only ignore if no session exists
          if (!session) {
            await zk.sendMessage(chatId, { 
              text: "❌ No active session. Please use the song/video command again." 
            });
            return;
          }

          const menuButtons = [
            { buttonId: "audio", buttonText: { displayText: "🎵 AUDIO" }, type: 1 },
            { buttonId: "video", buttonText: { displayText: "🎥 VIDEO" }, type: 1 },
            { buttonId: "channel", buttonText: { displayText: "📢 CHANNEL" }, type: 1 },
          ];

          // FIRST MENU ACTIONS
          if (["audio", "video", "channel"].includes(buttonId)) {
            if (buttonId === "audio") {
              await zk.sendMessage(session.dest, { text: "🎧 Downloading audio..." });
              await handleDownload("audio", session.videoUrl, session.dest, zk, message);
            }
            
            if (buttonId === "video") {
              await zk.sendMessage(session.dest, { text: "🎬 Downloading video..." });
              await handleDownload("video", session.videoUrl, session.dest, zk, message);
            }
            
            if (buttonId === "channel") {
              await zk.sendMessage(
                session.dest,
                {
                  text: "📢 *Official Channel*\n\n" +
                    "https://whatsapp.com/channel/0029VbBf4Y52kNFkFCx2pF1H\n\n" +
                    "🌐 *Dml Website*: dml-tech.online",
                },
                { quoted: message }
              );
            }

            const againButtons = [
              { buttonId: "yes_again", buttonText: { displayText: "🔁 YES" }, type: 1 },
              { buttonId: "no_again", buttonText: { displayText: "❌ NO" }, type: 1 },
            ];

            await zk.sendMessage(
              session.dest,
              {
                text: "Do you want another option?",
                buttons: againButtons,
                headerType: 1
              },
              { quoted: message }
            );
            return;
          }

          // YES AGAIN → restart full menu
          if (buttonId === "yes_again") {
            await zk.sendMessage(
              session.dest,
              {
                image: { url: session.thumbnail },
                caption: `*${session.videoTitle}*\n\nChoose an option below 👇`,
                buttons: menuButtons,
                headerType: 4
              },
              { quoted: message }
            );
            return;
          }

          // NO AGAIN → close menu (optional: keep session or remove it)
          if (buttonId === "no_again") {
            await zk.sendMessage(
              session.dest,
              { text: "✅ Okay! If you need anything else, send another command." }
            );
            // Optional: Remove session when user explicitly says no
            // downloadSessions.delete(chatId);
          }
        });
      }
      
    } catch (err) {
      console.error(err);
      return repondre("Error finding the video.");
    }
  }
);

// DOWNLOAD HANDLER
async function handleDownload(type, videoUrl, dest, zk, originalMsg) {
  try {
    const apis = type === "audio" ? audioApis : videoApis;
    const encodedUrl = encodeURIComponent(videoUrl);

    let downloadUrl = null;
    
    for (const api of apis) {
      try {
        const response = await axios.get(`${api}${encodedUrl}`, { timeout: 10000 });
        const data = response.data;
        
        if (data?.result?.download_url) {
          downloadUrl = data.result.download_url;
        } else if (data?.url) {
          downloadUrl = data.url;
        } else if (data?.audio_url) {
          downloadUrl = data.audio_url;
        } else if (data?.video_url) {
          downloadUrl = data.video_url;
        } else if (data?.downloadUrl) {
          downloadUrl = data.downloadUrl;
        }
        
        if (downloadUrl) break;
      } catch (error) {
        console.log(`API ${api} failed:`, error.message);
        continue;
      }
    }

    if (!downloadUrl) {
      return zk.sendMessage(
        dest,
        { text: `❌ Failed to download ${type}. All APIs are unavailable.` },
        { quoted: originalMsg }
      );
    }

    const fileResponse = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 100 * 1024 * 1024 // 100MB limit
    });

    if (type === "audio") {
      await zk.sendMessage(
        dest,
        { audio: fileResponse.data, mimetype: "audio/mpeg" },
        { quoted: originalMsg }
      );
    } else {
      await zk.sendMessage(
        dest,
        { 
          video: fileResponse.data, 
          mimetype: "video/mp4", 
          caption: "🎥 Your Video" 
        },
        { quoted: originalMsg }
      );
    }

  } catch (error) {
    console.error("Download error:", error);
    await zk.sendMessage(
      dest,
      { text: `❌ Error downloading ${type}: ${error.message}` },
      { quoted: originalMsg }
    );
  }
}

// Optional: Add a command to clear all sessions if needed
zokou(
  {
    nomCom: "clearsessions",
    categorie: "Owner",
    reaction: "🧹"
  },
  async (dest, zk, { ms, repondre }) => {
    // Only allow bot owner to clear sessions
    const botOwner = "1234567890@s.whatsapp.net"; // Replace with your number
    if (dest !== botOwner) return;
    
    const sessionCount = downloadSessions.size;
    downloadSessions.clear();
    await repondre(`🧹 Cleared ${sessionCount} active sessions.`);
  }
);
