const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
require('dotenv').config();

// Firebase init
const serviceAccount = require('./firebase-service-account.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Gemini
const { analyzeDeviceImage, geminiChat } = require('./services/gemini');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test route
app.get('/', (req, res) => {
    res.send('ReCircle backend is running!');
});

// GET all listings
app.get('/api/listings', async (req, res) => {
    try {
        const snapshot = await db.collection('listings').get();
        const listings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST new listing
app.post('/api/listings', async (req, res) => {
    try {
        const data = req.body;
        const docRef = await db.collection('listings').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload + Gemini Vision analysis
app.post('/api/upload', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: "No image provided" });

        const analysis = await analyzeDeviceImage(image);

        await db.collection('devices').add({
            ...analysis,
            timestamp: FieldValue.serverTimestamp()
        });

        res.json(analysis);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
            deviceName: "Unknown Device",
            condition: "C",
            route: "recycler"
        });
    }
});

// POST chat with Gemini assistant
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        const reply = await geminiChat(message);
        res.json({ reply });

    } catch (error) {
        console.error("Chat Route Error:", error);
        res.status(500).json({ reply: "Sorry, I'm having trouble right now. Please try again!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));