const express = require('express');
const cors = require('cors');
const { db } = require('./services/firebase');

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

app.listen(3000, () => console.log("Server running on port 3000"));