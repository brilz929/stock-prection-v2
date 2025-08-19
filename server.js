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

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Import dates
const { dates }  = require('./utils/dates.js'); 
const { startDate, endDate } = dates;

// Polygon API endpoint
app.get('/api/stock/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const response = await axios.get(
        `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}`,
      {
        params: { apiKey: process.env.POLYGON_API_KEY }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Polygon API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Anthropic API endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { ticker, stockData, startDate, endDate } = req.body;
    
    // Prepare stock data summary for Claude
    let priceInfo = '';
    if (stockData.results && stockData.results.length > 0) {
      const firstPrice = stockData.results[0].c;
      const lastPrice = stockData.results[stockData.results.length - 1].c;
      const highPrice = Math.max(...stockData.results.map(d => d.h));
      const lowPrice = Math.min(...stockData.results.map(d => d.l));
      const avgVolume = stockData.results.reduce((sum, d) => sum + d.v, 0) / stockData.results.length;
      
      priceInfo = `
        Period: ${startDate} to ${endDate}
        Opening Price: $${firstPrice}
        Closing Price: $${lastPrice}
        Period High: $${highPrice}
        Period Low: $${lowPrice}
        Average Volume: ${avgVolume.toLocaleString()}
        Price Change: ${((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}%
      `;
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        temperature: 0.8,
        system: `You are a professional stock market analyst providing concise, actionable insights.
                 Format your response with exactly three sections:
                 SUMMARY: One sentence about the stock's recent trends, performance and dividend information.
                 
                 TECHNICAL: One sentence about key technical indicators or patterns.
                 
                 RECOMMENDATION: One sentence with BUY/HOLD/SELL and brief reasoning.
                 Be specific and data-driven. No disclaimers needed.`,

        messages: [{
          role: 'user',
          content: `Analyze the stock ${ticker} with the following data:\n${priceInfo}`
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
     // Parse Claude's response
     const aiResponse = response.data.content[0].text;
    
     // Extract sections using regex or split
     const summaryMatch = aiResponse.match(/SUMMARY:\s*(.*?)(?=TECHNICAL:|$)/s);
     const technicalMatch = aiResponse.match(/TECHNICAL:\s*(.*?)(?=RECOMMENDATION:|$)/s);
     const recommendationMatch = aiResponse.match(/RECOMMENDATION:\s*(.*?)$/s);
     
     res.json({
       summary: summaryMatch ? summaryMatch[1].trim() : 'Analysis completed.',
       technical: technicalMatch ? technicalMatch[1].trim() : 'Technical indicators analyzed.',
       recommendation: recommendationMatch ? recommendationMatch[1].trim() : 'Please review the data.',
       fullResponse: aiResponse
     });
    
    } catch (error) {
        console.error('Anthropic API error:', error.response?.data || error.message);
        res.json({
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