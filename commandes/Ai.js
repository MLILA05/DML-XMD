const { zokou } = require("../framework/zokou");
const axios = require("axios");
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const config = require(__dirname + "/../config");

// Utility functions
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

async function downloadAndSaveImage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const tempPath = path.join(__dirname, `temp_${Date.now()}.jpg`);
        await fs.writeFile(tempPath, response.data);
        return tempPath;
    } catch (error) {
        throw new Error(`Failed to download image: ${error.message}`);
    }
}

// Enhanced API response handler
async function fetchAIResponse(url, query) {
    try {
        const response = await axios.get(url + encodeURIComponent(query), {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'DML-XMD-Bot'
            }
        });
        
        // Handle BK9 API response format
        if (response.data && response.data.BK9) {
            return response.data.BK9;
        }
        
        // Handle other response formats
        const responseData = response.data;
        if (!responseData) return "No response from the API";
        
        if (typeof responseData === 'string') {
            return responseData.trim();
        }
        
        if (typeof responseData === 'object') {
            // Check all possible response fields
            const possibleFields = ['BK9', 'response', 'message', 'answer', 'text', 'content', 'url', 'image'];
            for (const field of possibleFields) {
                if (responseData[field]) {
                    if (typeof responseData[field] === 'string') {
                        return responseData[field].trim();
                    }
                    if (field === 'image' || field === 'url') {
                        return { image: responseData[field] };
                    }
                }
            }
            
            // Fallback to stringify if no known fields found
            const jsonResponse = JSON.stringify(responseData);
            return jsonResponse.length > 500 ? jsonResponse.slice(0, 500) + "..." : jsonResponse;
        }
        
        return "Unexpected API response format";
    } catch (error) {
        console.error("API Error:", error.message);
        throw new Error(`API request failed: ${error.response?.status || error.message}`);
    }
}

// All AI Commands
const aiCommands = [
    // Text AI Commands
    {
        nomCom: "gpt",
        aliases: ["geminiai"],
        url: "https://api.bk9.dev/ai/gemini?q=",
        categorie: "AI",
        reaction: "🔷",
        description: "Google Gemini AI"
    },
    {
        nomCom: "gpt4",
        aliases: ["llamaai"],
        url: "https://api.bk9.dev/ai/llama?q=",
        categorie: "AI",
        reaction: "🦙",
        description: "Meta's Llama AI"
    },
    {
        nomCom: "zoroai",
        aliases: ["zoroai"],
        url: "https://api.bk9.dev/ai/BK93?BK9=you%20are%20zoro%20from%20one%20piece&q=",
        categorie: "AI",
        reaction: "⚔️",
        description: "Zoro-themed AI"
    },
    {
        nomCom: "jeeves",
        aliases: ["askjeeves"],
        url: "https://api.bk9.dev/ai/jeeves-chat?q=",
        categorie: "AI",
        reaction: "🎩",
        description: "Jeeves AI Assistant",
        version: 1
    },
    {
        nomCom: "jeeves2",
        aliases: ["jeevesv2"],
        url: "https://api.bk9.dev/ai/jeeves-chat2?q=",
        categorie: "AI",
        reaction: "🎩✨",
        description: "Jeeves AI v2"
    },
    {
        nomCom: "perplexity",
        aliases: ["perplexai"],
        url: "https://api.bk9.dev/ai/Perplexity?q=",
        categorie: "AI",
        reaction: "❓",
        description: "Perplexity AI"
    },
    {
        nomCom: "xdash",
        aliases: ["xdashai"],
        url: "https://api.bk9.dev/ai/xdash?q=",
        categorie: "AI",
        reaction: "✖️",
        description: "XDash AI"
    },
    {
        nomCom: "aoyo",
        aliases: ["narutoai"],
        url: "https://api.bk9.dev/ai/Aoyo?q=",
        categorie: "AI",
        reaction: "🌀",
        description: "Naruto-themed AI"
    },
    {
        nomCom: "math",
        aliases: ["calculate"],
        url: "https://api.bk9.dev/ai/mathssolve?q=",
        categorie: "AI",
        reaction: "🧮",
        description: "Math problem solver"
    }
    
];

// Register all commands
aiCommands.forEach(cmd => {
    adams(
        {
            nomCom: cmd.nomCom,
            aliases: cmd.aliases,
            categorie: cmd.categorie,
            reaction: cmd.reaction,
            description: cmd.description
        },
        async (dest, zk, commandOptions) => {
            const { arg, ms, repondre } = commandOptions;
            const prefix = config.PREFIX || "!";

            // Handle image analysis commands
            if (cmd.isImageAnalysis) {
                const quotedMsg = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (!quotedMsg?.imageMessage && !arg[0]?.match(/^https?:\/\//)) {
                    return repondre(`Reply to an image or provide image URL\nExample: *${prefix}${cmd.nomCom} [image] what is this?*`);
                }

                try {
                    let imageUrl = arg[0];
                    let question = arg.slice(1).join(" ") || "Describe this image";

                    if (quotedMsg?.imageMessage) {
                        const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
                        const buffer = await streamToBuffer(stream);
                        const tempPath = path.join(__dirname, `temp_img_${Date.now()}.jpg`);
                        await fs.writeFile(tempPath, buffer);
                        
                        // For production, upload to a hosting service here
                        // imageUrl = await uploadToHostingService(tempPath);
                        imageUrl = tempPath; // Temporary local path (replace with actual URL in production)
                    }

                    const response = await fetchAIResponse(`${cmd.url}${encodeURIComponent(imageUrl)}&q=`, question);
                    
                    // Clean up temporary file
                    if (imageUrl.startsWith(__dirname)) {
                        fs.unlinkSync(imageUrl);
                    }
                    
                    await repondre(response);
                } catch (error) {
                    console.error("Image analysis error:", error);
                    await repondre(`❌ Failed to analyze image. Please try again later.`);
                }
                return;
            }

            // Handle image generation commands
            if (cmd.isImageGenerator) {
                if (!arg[0]) {
                    return repondre(`Provide a prompt\nExample: *${prefix}${cmd.nomCom} cute cat with sunglasses*`);
                }

                try {
                    const prompt = arg.join(" ");
                    const response = await fetchAIResponse(cmd.url, prompt);
                    
                    if (typeof response === 'object' && response.image) {
                        // Download and send the generated image
                        try {
                            const imagePath = await downloadAndSaveImage(response.image);
                            await zk.sendMessage(
                                dest,
                                {
                                    image: fs.readFileSync(imagePath),
                                    caption: `🎨 ${cmd.description}\nPrompt: ${prompt}`,
                                    mimetype: "image/jpeg"
                                },
                                { quoted: ms }
                            );
                            fs.unlinkSync(imagePath);
                        } catch (downloadError) {
                            console.error("Image download failed:", downloadError);
                            await repondre(`🖼️ ${cmd.description}\n\nPrompt: ${prompt}\n\nImage URL: ${response.image}`);
                        }
                    } else {
                        await repondre(response);
                    }
                } catch (error) {
                    console.error("Image generation error:", error);
                    await repondre(`❌ Failed to generate image. Please try a different prompt.`);
                }
                return;
            }

            // Handle regular text commands
            if (!arg[0]) {
                return repondre(`Provide a query\nExample: *${prefix}${cmd.nomCom} ${cmd.nomCom === "math" ? "2+2" : "your question"}*`);
            }

            try {
                const query = arg.join(" ");
                const response = await fetchAIResponse(cmd.url, query);
                await repondre(response);
            } catch (error) {
                console.error("API error:", error);
                await repondre(`❌ Failed to get response. Please try again later.`);
            }
        }
    );
});

// Help command
zokou({
    nomCom: "aihelp",
    aliases: ["helpai", "aicmds"],
    categorie: "AI",
    reaction: "❓"
}, async (dest, zk, commandOptions) => {
    const { repondre } = commandOptions;
    const prefix = config.PREFIX || "!";

    let helpText = "🤖 *DML-XMD AI Commands*\n\n";
    
    // Text AI commands
    helpText += "*Text AI:*\n";
    aiCommands.filter(c => !c.isImageAnalysis && !c.isImageGenerator)
              .forEach(cmd => {
                  helpText += `• *${prefix}${cmd.nomCom}* - ${cmd.description} (${cmd.aliases.join(", ")})\n`;
              });
    
    helpText += `\n*Examples:*\n` +
                `${prefix}gemini explain quantum physics\n` +
                `${prefix}math 15% of 2000`;

    await repondre(helpText);
});
