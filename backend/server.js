require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://ai-stock-prediction-scrimba.netlify.app',
    'https://ai-stock-prediction-scrimba.netlify.app/'
  ],
  credentials: true
}));

app.use(express.json());

// Import dates
const { dates } = require('./utils/dates.js');
const { startDate, endDate } = dates;

// Polygon API endpoint
app.get('/api/stock/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const response = await axios.get(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}`,
      {
        params: {
          apiKey: process.env.POLYGON_API_KEY,
          adjusted: true,
          sort: 'asc'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// AI Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    if (!req.body.ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    // Here you would typically call your AI service
    // For now, we'll return a mock response
    res.json({
      summary: `Analysis for ${req.body.ticker}`,
      technical: 'Technical analysis would go here',
      recommendation: 'Buy/Hold/Sell recommendation'
    });
  } catch (error) {
    console.error('Error in analysis:', error);
    res.status(500).json({
      summary: `Unable to generate real-time analysis for ${req.body.ticker}.`,
      technical: 'API connection error. Please try again later.',
      recommendation: 'Analysis unavailable.',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
