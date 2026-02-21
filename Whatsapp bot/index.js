/**
 * index.js — SafarLink WhatsApp Bot (Agentic Booking Flow)
 *
 * Stateful per-user booking flow:
 * 1. User sends travel query → Bot shows numbered fare options
 * 2. User replies 1/2/3 → Bot confirms route + prompts PAY
 * 3. User replies PAY → Mock payment → PDF ticket sent
 */

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { formatRoutes } = require('./formatter');
const { generateTicketPdf } = require('./ticketPdf');

// ── Suppress whatsapp-web.js internal sendSeen crash (known WA Web API change) ──
process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || String(reason);
    if (msg.includes('getLastMsgKeyForAction') || msg.includes('sendSeen')) return; // ignore known WA bug
    console.error('Unhandled rejection:', msg);
});

const CHATBOT_URL = process.env.CHATBOT_URL || 'http://localhost:8000';

// ── Per-user session ──────────────────────────────────────────────────────────
// phase: 'idle' | 'route_selection' | 'booking_confirm'
const userSessions = {};

// ── Constants ─────────────────────────────────────────────────────────────────
const GREETINGS = ['hi', 'hello', 'hey', 'hii', 'helo', 'start', 'namaste'];

const WELCOME_MSG = `👋 *Welcome to SafarLink!* 🗺️

I'm your personal route planner & ticket booking assistant.

Just tell me where you want to go!

*Examples:*
• _From Shivajinagar to Hinjewadi_
• _Koregaon Park to Wakad_

After I show routes, reply the option number (*1*, *2*, *3*) to select and book a ticket 🎟️`;

const HELP_MSG = `🤖 *SafarLink Bot Commands*

• Send any travel query to get route options
• Reply *1*, *2*, or *3* to select a route
• Reply *PAY* to confirm booking & get ticket
• Reply *back* to go back to route selection
• Reply *pdf* to download last itinerary PDF
• Reply *hi* to see this message again`;

// ── Find system Chrome / Edge on Windows ─────────────────────────────────────
function findChrome() {
    const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        (process.env.LOCALAPPDATA || '') + '\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of candidates) {
        try { if (fs.existsSync(p)) return p; } catch (_) { }
    }
    return undefined;
}

// ── WhatsApp client ───────────────────────────────────────────────────────────
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'safarlink-bot' }),
    puppeteer: {
        headless: true,
        executablePath: findChrome(),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp (Linked Devices):\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ SafarLink WhatsApp Bot is ready!');
    console.log(`🔗 Connected to chatbot at ${CHATBOT_URL}`);
});

client.on('auth_failure', () => {
    console.error('❌ Authentication failed. Delete the .wwebjs_auth folder and try again.');
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format fare options as a numbered list for WhatsApp.
 * Returns { text, options: [{label, fareData}] }
 */
function formatFareOptions(fareData) {
    const { origin, destination, fares } = fareData;
    const modeEmoji = { 'Bus': '🚌', 'Metro / Subway': '🚇', 'Auto / Cab': '🛺' };

    const options = [
        { label: 'fastest', fare: fares.fastest },
        { label: 'cheapest', fare: fares.cheapest },
        { label: 'best_value', fare: fares.best_value },
    ];

    // Deduplicate by mode+route_number so same route isn't listed twice
    const seen = new Set();
    const unique = [];
    for (const opt of options) {
        const key = `${opt.fare.mode}-${opt.fare.route_number}`;
        if (!seen.has(key)) { seen.add(key); unique.push(opt); }
    }

    const lines = [
        `📍 *${origin}* → *${destination}*`,
        '',
        '*Choose your route:*',
    ];

    unique.forEach((opt, idx) => {
        const f = opt.fare;
        const emoji = modeEmoji[f.mode] || '🚦';
        const labelMap = { fastest: '⚡ Fastest', cheapest: '💰 Cheapest', best_value: '🛡️ Best Value' };
        lines.push(`\n*${idx + 1}. ${labelMap[opt.label]}* — ${emoji} ${f.mode}`);
        lines.push(`   🕐 ${f.duration_minutes} min  📏 ${f.distance_km} km  💰 ₹${f.estimated_fare_inr}`);
    });

    lines.push('');
    lines.push('Reply *1*, *2*, or *3* to select a route and book a ticket.');

    return { text: lines.join('\n'), options: unique };
}

/**
 * Build a BookingRequest from a selected fare option.
 */
function buildBookingRequest(fareOption, phone) {
    return {
        origin: fareOption.origin,
        destination: fareOption.destination,
        route_type: fareOption.mode.toLowerCase().replace(' / ', '_').replace(' ', '_'),
        transit_segments: [{
            mode: fareOption.mode,
            line_name: fareOption.mode,
            from_stop: fareOption.origin,
            to_stop: fareOption.destination,
            num_stops: 1,
            fare_inr: fareOption.estimated_fare_inr,
        }],
        passenger_name: 'WhatsApp User',
        phone: phone,
        estimated_fare_inr: fareOption.estimated_fare_inr,
    };
}

// ── Main message handler ──────────────────────────────────────────────────────
client.on('message', async (msg) => {
    if (msg.from === 'status@broadcast') return;

    const text = msg.body.trim();
    const lower = text.toLowerCase();
    const userId = msg.from;

    const session = userSessions[userId] || { phase: 'idle' };

    // ── Greeting ──────────────────────────────────────────────────────────────
    if (GREETINGS.includes(lower)) {
        userSessions[userId] = { phase: 'idle' };
        await msg.reply(WELCOME_MSG);
        return;
    }

    // ── Help ──────────────────────────────────────────────────────────────────
    if (lower === 'help') {
        await msg.reply(HELP_MSG);
        return;
    }

    // ── Back — return to route selection ──────────────────────────────────────
    if (lower === 'back' && session.phase === 'booking_confirm') {
        userSessions[userId] = { ...session, phase: 'route_selection' };
        if (session.fareOptions) {
            await msg.reply(session.fareOptions.text + '\n\nReply *1*, *2*, or *3* to choose again.');
        }
        return;
    }

    // ── Route number selection (1/2/3) ────────────────────────────────────────
    if (['1', '2', '3'].includes(text) && session.phase === 'route_selection') {
        const idx = parseInt(text) - 1;
        const opts = session.fareOptions?.options || [];
        if (idx >= opts.length) {
            await msg.reply(`⚠️ Please reply with *1*, *2*, or *3*.`);
            return;
        }
        const chosen = opts[idx];
        const f = chosen.fare;
        const labelMap = { fastest: '⚡ Fastest', cheapest: '💰 Cheapest', best_value: '🛡️ Best Value' };
        const modeEmoji = { 'Bus': '🚌', 'Metro / Subway': '🚇', 'Auto / Cab': '🛺' };

        userSessions[userId] = { ...session, phase: 'booking_confirm', selectedOption: chosen };

        await msg.reply(
            `✅ *You selected: ${labelMap[chosen.label]}*\n\n` +
            `${modeEmoji[f.mode] || '🚦'} *${f.mode}*\n` +
            `📍 ${f.origin} → ${f.destination}\n` +
            `🕐 ${f.duration_minutes} min  📏 ${f.distance_km} km\n` +
            `💰 *₹${f.estimated_fare_inr}*\n\n` +
            `Reply *PAY* to confirm booking & receive your e-ticket.\n` +
            `Reply *back* to choose a different route.`
        );
        return;
    }

    // ── PAY — process booking ─────────────────────────────────────────────────
    if (lower === 'pay' && session.phase === 'booking_confirm') {
        const selected = session.selectedOption;
        if (!selected) {
            await msg.reply('⚠️ Please select a route first by replying *1*, *2*, or *3*.');
            return;
        }

        await msg.reply('💳 Processing your payment, please wait a moment...');

        try {
            const bookingReq = buildBookingRequest(selected.fare, userId.replace('@c.us', ''));
            const { data: result } = await axios.post(`${CHATBOT_URL}/book`, bookingReq, { timeout: 15000 });

            // Payment success message
            await msg.reply(
                `✅ *Payment of ₹${result.total_fare_inr} Successful!*\n\n` +
                `🎟️ *PNR:* \`${result.pnr}\`\n` +
                `💳 *Payment ID:* ${result.payment_id}\n` +
                `📅 *Booked:* ${result.booking_time}\n\n` +
                `Generating your ticket PDF... 📄`
            );

            // Generate PDF
            const pdfBuffer = await generateTicketPdf(result);
            const tmpPath = path.join(__dirname, `ticket_${result.pnr}.pdf`);
            fs.writeFileSync(tmpPath, pdfBuffer);

            const media = MessageMedia.fromFilePath(tmpPath);
            await client.sendMessage(userId, media, {
                caption: `🎟️ *SafarLink E-Ticket*\nPNR: ${result.pnr} | ${result.origin} → ${result.destination}\nHave a safe journey! 🙏`
            });

            fs.unlinkSync(tmpPath); // cleanup

            // Reset session
            userSessions[userId] = { phase: 'idle', lastQuery: session.lastQuery };
        } catch (err) {
            console.error('Booking error:', err.message);
            await msg.reply('❌ Booking failed. Please make sure the SafarLink server is running and try again.\n\nReply *back* to try again.');
        }
        return;
    }

    // ── PDF legacy export ─────────────────────────────────────────────────────
    if (lower === 'pdf') {
        if (!session.lastQuery) {
            await msg.reply('⚠️ Please send a travel query first.');
            return;
        }
        await msg.reply('⏳ Generating your PDF itinerary, please wait...');
        try {
            const response = await axios.post(
                `${CHATBOT_URL}/route/export`,
                { query: session.lastQuery },
                { responseType: 'arraybuffer', timeout: 60000 }
            );
            const pdfBuffer = Buffer.from(response.data);
            const tmpPath = path.join(__dirname, 'tmp_itinerary.pdf');
            fs.writeFileSync(tmpPath, pdfBuffer);
            const media = MessageMedia.fromFilePath(tmpPath);
            await client.sendMessage(userId, media, { caption: '📄 Your SafarLink itinerary PDF' });
            fs.unlinkSync(tmpPath);
        } catch (err) {
            console.error('PDF export error:', err.message);
            await msg.reply('❌ Could not generate the PDF. Make sure the chatbot server is running at ' + CHATBOT_URL);
        }
        return;
    }

    // ── Route query (default) ─────────────────────────────────────────────────
    if (!text) {
        await msg.reply('🤔 Please type a travel query, e.g. _"From Shivajinagar to Hinjewadi"_');
        return;
    }

    await msg.reply('🔍 Finding the best routes for you, please wait...');

    try {
        // Fetch fare comparison (uses /agent endpoint which returns full data including fares)
        const { data } = await axios.post(`${CHATBOT_URL}/agent`, { query: text }, { timeout: 60000 });

        userSessions[userId] = {
            phase: 'route_selection',
            lastQuery: text,
            routeData: data,
            fareOptions: formatFareOptions(data),
        };

        const fareText = formatFareOptions(data).text;
        try { await msg.reply(fareText); } catch (e) { await client.sendMessage(userId, fareText); }
    } catch (err) {
        console.error('Route query error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            await msg.reply('❌ Cannot reach the SafarLink server. Make sure the chatbot is running.');
        } else {
            await msg.reply('❌ Something went wrong while fetching routes. Please try again.');
        }
        userSessions[userId] = { phase: 'idle' };
    }
});

// ── Express Server for Outbound Notifications ─────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

app.post('/notify', async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone and message are required' });
        }

        // Ensure phone has country code and @c.us suffix
        let waId = phone.replace(/[^0-9]/g, '');
        if (!waId.startsWith('91')) waId = '91' + waId;
        waId = waId + '@c.us';

        await client.sendMessage(waId, message);
        console.log(`✅ Pre-booked notification sent to ${phone}`);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Failed to send notification:', err.message);
        res.status(500).json({ error: err.message });
    }
});

const API_PORT = process.env.PORT || 3001;
app.listen(API_PORT, () => {
    console.log(`🚀 WhatsApp Notification API listening on port ${API_PORT}`);
});

// ── Start ─────────────────────────────────────────────────────────────────────
client.initialize();
