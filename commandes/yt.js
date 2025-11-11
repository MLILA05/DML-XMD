const { zokou } = require("../framework/zokou")
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const acrcloud = require("acrcloud");
const yts = require("yt-search");

// Utility to convert stream to buffer
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

// Enhanced audio processing for better identification
async function processAudioForIdentification(buffer, mediaType, duration) {
    try {
        // For voice notes and recorded audio, we need better processing
        if (mediaType === 'audio' || mediaType === 'voice') {
            // Take multiple samples from different parts of the audio for better identification
            const sampleSize = Math.min(buffer.length, 512 * 1024); // 512KB samples
            const samples = [];
            
            if (duration && duration > 30) {
                // For longer audio, take samples from different positions
                const positions = [0.1, 0.3, 0.5, 0.7, 0.9]; // 10%, 30%, 50%, 70%, 90%
                
                positions.forEach(pos => {
                    const startByte = Math.floor(buffer.length * pos);
                    const endByte = Math.min(startByte + sampleSize, buffer.length);
                    if (endByte > startByte) {
                        samples.push(buffer.slice(startByte, endByte));
                    }
                });
            } else {
                // For shorter audio, take from beginning and middle
                samples.push(buffer.slice(0, Math.min(sampleSize, buffer.length)));
                if (buffer.length > sampleSize) {
                    const midPoint = Math.floor(buffer.length / 2);
                    samples.push(buffer.slice(midPoint, Math.min(midPoint + sampleSize, buffer.length)));
                }
            }
            
            return samples;
        } else {
            // For video, extract audio portion more effectively
            const maxSize = 1024 * 1024; // 1MB
            return [buffer.slice(0, Math.min(maxSize, buffer.length))];
        }
    } catch (error) {
        console.log("Audio processing error:", error);
        return [buffer.slice(0, Math.min(512 * 1024, buffer.length))];
    }
}

zokou({
    nomCom: "find",
    aliases: ["details", "Shazam", "shazam"],
    categorie: "Media",
    reaction: "🔍",
    nomFichier: __filename
}, async (dest, zk, commandeOptions) => {
    const { ms, repondre, msgRepondu } = commandeOptions;

    // Enhanced media type detection
    const audioMessage = msgRepondu?.audioMessage;
    const videoMessage = msgRepondu?.videoMessage;
    const voiceMessage = msgRepondu?.audioMessage?.ptt; // Voice note detection
    const documentMessage = msgRepondu?.documentMessage;

    if (!audioMessage && !videoMessage && !documentMessage) {
        return repondre("🔍 Please reply to an audio, video, voice note, or media document to identify and search for details.");
    }

    let tempPath;
    try {
        // Enhanced processing message
        const mediaTypeText = voiceMessage ? "voice note" : 
                             audioMessage ? "audio" : 
                             videoMessage ? "video" : "media file";
        
        await repondre(`🔍 *Analyzing ${mediaTypeText}...*\n\n🎵 Identifying music content...\n🔍 Searching multiple audio samples...\n📡 Connecting to YouTube...`);

        // Initialize ACRCloud for music identification
        const acr = new acrcloud({
            host: 'identify-us-west-2.acrcloud.com',
            access_key: '4ee38e62e85515a47158aeb3d26fb741',
            access_secret: 'KZd3cUQoOYSmZQn1n5ACW5XSbqGlKLhg6G8S8EvJ'
        });

        // Enhanced media download with type detection
        let mediaContent, mediaType, duration;
        
        if (documentMessage && (documentMessage.mimetype?.includes('audio') || documentMessage.mimetype?.includes('video'))) {
            // Handle document media
            const stream = await downloadContentFromMessage(documentMessage, 'document');
            mediaContent = await streamToBuffer(stream);
            mediaType = documentMessage.mimetype?.includes('video') ? 'video' : 'audio';
            duration = documentMessage.seconds;
        } else if (audioMessage) {
            // Handle audio/voice notes
            const stream = await downloadContentFromMessage(audioMessage, 'audio');
            mediaContent = await streamToBuffer(stream);
            mediaType = voiceMessage ? 'voice' : 'audio';
            duration = audioMessage.seconds;
        } else if (videoMessage) {
            // Handle video
            const stream = await downloadContentFromMessage(videoMessage, 'video');
            mediaContent = await streamToBuffer(stream);
            mediaType = 'video';
            duration = videoMessage.seconds;
        }

        const timestamp = Date.now();
        const fileExtension = mediaType === 'video' ? 'mp4' : 'mp3';
        tempPath = path.join(__dirname, `temp_${timestamp}.${fileExtension}`);
        await fs.writeFile(tempPath, mediaContent);

        // Enhanced audio processing for better identification
        const audioSamples = await processAudioForIdentification(mediaContent, mediaType, duration);

        // Try multiple identification attempts with different samples
        let musicInfo = null;
        let identificationAttempts = 0;
        
        for (const sample of audioSamples) {
            try {
                identificationAttempts++;
                console.log(`Identification attempt ${identificationAttempts} with ${sample.length} bytes`);
                
                const { status, metadata } = await acr.identify(sample);
                
                if (status.code === 0 && metadata?.music?.[0]) {
                    musicInfo = metadata.music[0];
                    console.log(`Music identified on attempt ${identificationAttempts}`);
                    break;
                }
                
                // Wait a bit between attempts to avoid rate limiting
                if (identificationAttempts < audioSamples.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.log(`Identification attempt ${identificationAttempts} failed:`, error.message);
                continue;
            }
        }

        // Prepare search query and results
        let searchQuery = "";
        let responseText = "🔍 *ENHANCED MEDIA ANALYSIS*\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
        
        // Enhanced media info section
        responseText += `📱 *MEDIA DETAILS*\n`;
        responseText += `*Type:* ${mediaTypeText.toUpperCase()}\n`;
        responseText += `*Size:* ${(mediaContent.length / 1024 / 1024).toFixed(2)} MB\n`;
        if (duration) responseText += `*Duration:* ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n`;
        
        if (videoMessage) {
            if (videoMessage.width && videoMessage.height) {
                responseText += `*Resolution:* ${videoMessage.width}x${videoMessage.height}\n`;
            }
        }
        
        responseText += `*Samples Analyzed:* ${audioSamples.length}\n`;
        responseText += `*Identification Attempts:* ${identificationAttempts}\n\n`;
        
        if (musicInfo) {
            // Enhanced music identification results
            const { title, artists, album, genres, label, release_date, external_metadata } = musicInfo;
            
            responseText += "🎵 *MUSIC IDENTIFIED*\n\n";
            responseText += `*Title:* ${title || 'Unknown'}\n`;
            if (artists?.length) {
                const artistNames = artists.map(v => v.name).join(', ');
                responseText += `*Artists:* ${artistNames}\n`;
                searchQuery = `${title} ${artistNames}`;
            } else {
                searchQuery = title || '';
            }
            if (album?.name) responseText += `*Album:* ${album.name}\n`;
            if (genres?.length) responseText += `*Genres:* ${genres.map(v => v.name).join(', ')}\n`;
            if (label) responseText += `*Label:* ${label}\n`;
            if (release_date) responseText += `*Release Date:* ${release_date}\n`;
            
            // Add external metadata if available (Spotify, iTunes, etc.)
            if (external_metadata) {
                if (external_metadata.spotify) responseText += `*Spotify:* Available\n`;
                if (external_metadata.itunes) responseText += `*iTunes:* Available\n`;
                if (external_metadata.deezer) responseText += `*Deezer:* Available\n`;
            }
        } else {
            responseText += "❌ *MUSIC NOT IDENTIFIED*\n\n";
            responseText += `Unfortunately, no music was recognized from the ${mediaTypeText}.\n`;
            responseText += `This could be due to:\n`;
            responseText += `• Background noise or low audio quality\n`;
            responseText += `• Non-music content (speech, nature sounds, etc.)\n`;
            responseText += `• Unreleased or very rare music\n`;
            responseText += `• Short duration or incomplete audio\n\n`;
            
            // Use generic search terms for non-identified content
            if (voiceMessage) {
                searchQuery = "voice recording audio";
            } else if (audioMessage) {
                searchQuery = "audio recording music";
            } else {
                searchQuery = "video content";
            }
        }

        // Enhanced YouTube search with better queries
        let youtubeResults = null;
        if (searchQuery.trim()) {
            try {
                // Try multiple search variations for better results
                const searchQueries = [searchQuery];
                
                if (musicInfo && musicInfo.artists?.length) {
                    // Add artist-only search
                    searchQueries.push(musicInfo.artists[0].name);
                    // Add title-only search
                    if (musicInfo.title) searchQueries.push(musicInfo.title);
                }
                
                for (const query of searchQueries) {
                    const search = await yts(query);
                    if (search.videos.length > 0) {
                        youtubeResults = search.videos.slice(0, 3);
                        break;
                    }
                }
            } catch (error) {
                console.log("YouTube search failed:", error.message);
            }
        }

        // Enhanced YouTube results display
        if (youtubeResults && youtubeResults.length > 0) {
            responseText += "🎬 *YOUTUBE SEARCH RESULTS*\n\n";
            
            const topVideo = youtubeResults[0];
            responseText += `*🏆 Top Match:*\n`;
            responseText += `📺 *${topVideo.title}*\n`;
            responseText += `🎬 *Channel:* ${topVideo.author.name}\n`;
            responseText += `⏱️ *Duration:* ${topVideo.timestamp}\n`;
            responseText += `👀 *Views:* ${topVideo.views.toLocaleString()}\n`;
            responseText += `📅 *Uploaded:* ${topVideo.ago}\n`;
            responseText += `🔗 *URL:* ${topVideo.url}\n`;

            if (youtubeResults.length > 1) {
                responseText += `\n*📋 Alternative Results:*\n`;
                for (let i = 1; i < youtubeResults.length; i++) {
                    const video = youtubeResults[i];
                    responseText += `${i + 1}. ${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}\n`;
                    responseText += `   👤 ${video.author.name} • ⏱️ ${video.timestamp}\n`;
                }
            }

            // Enhanced message with YouTube context
            await zk.sendMessage(dest, {
                image: { url: topVideo.thumbnail },
                caption: responseText + "\n━━━━━━━━━━━━━━━━━━━━━━\n> © DML-XMD Enhanced Media Finder",
                contextInfo: {
                    externalAdReply: {
                        title: topVideo.title,
                        body: `${topVideo.author.name} • ${topVideo.views.toLocaleString()} views • ${topVideo.ago}`,
                        mediaType: 2,
                        thumbnailUrl: topVideo.thumbnail,
                        mediaUrl: topVideo.url,
                        sourceUrl: topVideo.url,
                        showAdAttribution: true,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: ms });

        } else {
            // Enhanced response for no YouTube results
            responseText += "❌ *NO YOUTUBE RESULTS*\n\n";
            responseText += "No related content found on YouTube.\n";
            responseText += "Try with a clearer audio sample or different content.";
            responseText += "\n━━━━━━━━━━━━━━━━━━━━━━\n> © DML-XMD Enhanced Media Finder";
            
            await zk.sendMessage(dest, {
                text: responseText
            }, { quoted: ms });
        }

        // Clean up temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

    } catch (error) {
        console.error("Error in enhanced find command:", error);
        
        // Clean up temp file on error
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }

        let errorMessage = "❌ *ENHANCED ANALYSIS FAILED*\n\n";
        
        if (error.message.includes('empty media key')) {
            errorMessage += "📱 Media keys have expired. Please send a fresh audio/video message.";
        } else if (error.message.includes('too large')) {
            errorMessage += "📏 The media file is too large. Please try with a smaller file (max 10MB).";
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMessage += "🌐 Network error occurred. Please check your connection and try again.";
        } else if (error.message.includes('rate limit')) {
            errorMessage += "⏰ Too many requests. Please wait a moment and try again.";
        } else {
            errorMessage += `🔧 Technical Error: ${error.message}\n\nTip: Try with a clearer audio sample or different media.`;
        }
        
        await repondre(errorMessage);
    }
});
