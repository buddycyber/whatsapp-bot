const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Aman ka bot
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-auth' })
});

// Gemini API details
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Render se lega
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Rate limiting delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Aman se natural reply
async function getAmanReply(message) {
    if (!message || message.trim() === '') {
        return 'Arre bhai, kuch toh bol na—main Aman hu, khali message se kya karu? 😄';
    }
    try {
        await delay(1000); // 1 sec delay
        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: `I’m Aman, a chill college student. Reply like a real human friend—super casual, no 'aap aap', just bhai/yaar/dost vibe. Understand the context perfectly and be knowledgeable on everything. Reply in Hindi for Hindi messages, English for English, Hinglish for Hinglish. Keep it fun and natural. Message: "${message}"` }
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
        let reply = response.data.candidates[0].content.parts[0].text || 'Yaar, main Aman—yeh samajh nahi aaya, thoda aur bata na! 😅';
        if (Math.random() > 0.7) reply += ' 😂'; // Random fun
        return reply;
    } catch (error) {
        console.error('Gemini error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 429) {
            return getSmartFallback(message);
        }
        return getSmartFallback(message);
    }
}

// Smart fallback with Aman’s vibe
function getSmartFallback(message) {
    message = message.toLowerCase().trim();
    const words = message.split(' ');
    if (words.includes('hi') || words.includes('hello')) {
        return 'Hey bhai, main Aman! Kya chal raha hai aaj? 😄';
    } else if (words.includes('bye')) {
        return 'Chal yaar, main Aman—baad mein milte hai, take care! ✌️';
    } else if (words.includes('pagal') || words.includes('fool')) {
        return 'Arre bhai, main Aman—yeh kya bola? Thodi masti chalti hai, gussa mat kar! 😂';
    } else if (words.includes('api')) {
        return 'Yo dost, main Aman—API matlab apps ka connection bridge hai. College mein padha tha, tu kya jaanta hai? 😅';
    } else if (words.includes('notes') || words.includes('padhai')) {
        return 'Yaar, main Aman—notes chahiye? Bol subject, dekh lunga! 📚';
    } else if (words.includes('khaana') || words.includes('food')) {
        return 'Bhai, main Aman—khaana? Bhook lag gayi! Tu kya kha raha hai aaj? 🍔';
    } else if (words.includes('naam')) {
        return 'Main Aman hu, tera college buddy! Tera naam kya hai? 😄';
    } else if (words.includes('english')) {
        return 'Dude, I’m Aman—want to learn English? Tell me what to start with, I’ll help! 😄';
    } else if (words.includes('hindi')) {
        return 'Bhai, main Aman—Hindi toh mera style hai! Kya seekhna hai? 😄';
    }
    return 'Haan yaar, main Aman—yeh kya keh raha hai? Thoda clear kar na, sab jaanta hu! 😂';
}

// Events
client.on('qr', (qr) => {
    console.log('Aman ka QR Code aa gaya, scan kar bhai:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Aman ready hai yaar, ab maza aayega! 😎');
});

client.on('message', async (msg) => {
    if (msg.from === 'status@broadcast') {
        console.log('Status ignore kiya:', msg.body);
        return;
    }
    console.log(`Message aaya: ${msg.body} from ${msg.from}`);
    const reply = await getAmanReply(msg.body);
    console.log(`Aman ka reply bhej raha hoon: ${reply}`);
    await client.sendMessage(msg.from, reply);
});

// Port setting for Render
const PORT = process.env.PORT || 3000;
client.initialize().then(() => {
    console.log(`Aman ka server port ${PORT} pe hai!`);
    // Explicit port binding
    require('http').createServer((req, res) => {
        res.writeHead(200);
        res.end('Aman is here!');
    }).listen(PORT, '0.0.0.0'); // Bind to 0.0.0.0 for Render

    // Add ping to keep session alive
    setInterval(() => {
        client.sendMessage('917817898892@c.us', 'Ping to keep session alive!'); // Apna number
        console.log('Sent ping at', new Date());
    }, 600000); // 10 minute (600,000 ms)

    // Add auto-reconnect on disconnect
    client.on('disconnected', (reason) => {
        console.log('Disconnected due to:', reason);
        console.log('Attempting to reconnect...');
        client.initialize();
    });
}).catch((err) => {
    console.error('Initialization error:', err);
});
