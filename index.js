const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// WhatsApp client banao with session saving
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-auth' })
});

// Gemini API details
const GEMINI_API_KEY = 'AIzaSyCyEHMkIDKEb9VgAm6aN0qD3UAiPPOTljo'; // Apni API key yahan daal
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Rate limiting ke liye delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Gemini se reply lo with rate limiting
async function getGeminiReply(message) {
    if (!message || message.trim() === '') {
        return 'Yaar, kuch toh bol na—khali message ka kya karu!';
    }
    try {
        // Rate limit ke liye 1 second delay
        await delay(1000);
        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: `Act like a typical college boy, friendly and chill. Reply respectfully without using "sir" or "ma’am"—use a neutral tone that works for anyone. If the message is in English, reply in English; if it’s in Hinglish, reply in Hinglish. Keep it casual like a college dude. Here’s the message: "${message}"` }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.candidates[0].content.parts[0].text || 'Kuch samajh nahi aaya yaar!';
    } catch (error) {
        console.error('Gemini error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 429) {
            return 'Yaar, thodi der ruk ja—API limit hit ho gayi. Ek minute mein try karta hu!';
        }
        return getBasicReply(message);
    }
}

// Basic AI fallback
function getBasicReply(message) {
    if (message.toLowerCase().includes('hi') || message.toLowerCase().includes('hello')) {
        return 'Hey yaar, kya chal raha hai?';
    } else if (message.toLowerCase().includes('bye')) {
        return 'Chal, fir milte hai yaar!';
    } else if (message.toLowerCase().includes('tu chutiya hai')) {
        return 'Arre yaar, yeh kya bol diya? Thodi masti thik hai lekin itna bhi nahi!';
    }
    return 'Yaar, yeh kya keh raha hai? Thoda clear kar na!';
}

// QR code event
client.on('qr', (qr) => {
    console.log('QR Code aa gaya, scan karo:');
    qrcode.generate(qr, { small: true });
});

// WhatsApp ready hone pe
client.on('ready', () => {
    console.log('WhatsApp ready hai bhai!');
});

// Message aane pe
client.on('message', async (msg) => {
    if (msg.from === 'status@broadcast') {
        console.log('Status broadcast ignored:', msg.body);
        return;
    }

    console.log(`Message aaya: ${msg.body} from ${msg.from}`);
    const reply = await getGeminiReply(msg.body);
    console.log(`Reply bhej raha hoon: ${reply}`);

    // msg.reply ki jagah client.sendMessage use karo
    await client.sendMessage(msg.from, reply);
});

// Shuru karo
client.initialize();