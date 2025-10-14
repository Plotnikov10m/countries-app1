const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const userRoutes = require('./routes/users');
const wishlistRoutes = require('./routes/wishlist');

const app = express();
const PORT = process.env.PORT || 3002; 

// Middleware
app.use(cors());
app.use(bodyParser.json());

// FIXED: Правильный путь к frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
console.log('Frontend path:', frontendPath);
app.use(express.static(frontendPath));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Countries API
app.get('/api/countries', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get('https://restcountries.com/v3.1/all');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch countries' });
    }
});

app.get('/api/countries/search/:name', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get(`https://restcountries.com/v3.1/name/${req.params.name}`);
        res.json(response.data);
    } catch (error) {
        res.status(404).json({ error: 'Country not found' });
    }
});

app.get('/api/countries/region/:region', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get(`https://restcountries.com/v3.1/region/${req.params.region}`);
        res.json(response.data);
    } catch (error) {
        res.status(404).json({ error: 'Region not found' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
});