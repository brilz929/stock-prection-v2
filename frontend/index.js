import { dates } from '../utils/dates.js';

// Use environment variable if available, otherwise use the deployed backend
const API_BASE_URL = 'https://stock-prection-v2.onrender.com';
console.log('Using backend URL:', API_BASE_URL);
        
// Stock app functionality
let tickers = [];

const tickerInput = document.getElementById('tickerInput');
const addBtn = document.getElementById('addBtn');
const tickerList = document.getElementById('tickerList');
const emptyState = document.getElementById('emptyState');
const generateBtn = document.getElementById('generateBtn');
const aiReportModal = document.getElementById('aiReportModal');
const reportContent = document.getElementById('reportContent');

// Sample AI reports for demo
const sampleReports = {
    'AAPL': {
        summary: 'Apple shows strong momentum with consistent revenue growth from services and wearables.',
        technical: 'Technical indicators suggest consolidation around current levels with potential breakout above $195.',
        recommendation: 'HOLD - Wait for clearer directional signals before adding positions.'
    },
    'TSLA': {
        summary: 'Tesla maintains volatility amid EV market competition and margin pressures.',
        technical: 'Watch for support at $240 and resistance at $265 levels.',
        recommendation: 'NEUTRAL - High volatility presents both opportunities and risks.'
    },
    'NVDA': {
        summary: 'NVIDIA continues to dominate AI chip market with exceptional datacenter growth.',
        technical: 'Recent consolidation healthy after massive run-up, with strong institutional accumulation.',
        recommendation: 'BUY - Long-term AI tailwinds remain intact despite short-term volatility.'
    }
};

function addTicker() {
    const value = tickerInput.value.trim().toUpperCase();
    if (value && tickers.length < 3 && !tickers.includes(value)) {
        tickers.push(value);
        updateTickerDisplay();
        tickerInput.value = '';
        updateGenerateButton();
        updateDemoButtons();
    }
}

function removeTicker(ticker) {
    tickers = tickers.filter(t => t !== ticker);
    updateTickerDisplay();
    updateGenerateButton();
    updateDemoButtons();
}

function updateDemoButtons() {
    const demoButtons = document.querySelectorAll('.demo-btn');
    const hasTickers = tickers.length > 0;
    
    demoButtons.forEach(btn => {
        if (hasTickers) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    });
}

function updateTickerDisplay() {
    if (tickers.length === 0) {
        tickerList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        tickerList.style.display = 'flex';
        emptyState.style.display = 'none';
        tickerList.innerHTML = tickers.map(ticker => `
            <div class="ticker-chip">
                ${ticker}
                <span class="remove" data-ticker="${ticker}">×</span>
            </div>
        `).join('');
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.ticker-chip .remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticker = e.target.dataset.ticker;
                removeTicker(ticker);
            });
        });
    }
}

function updateGenerateButton() {
    generateBtn.disabled = tickers.length === 0;
}

async function generateReport(isDemo = false) {
    if (tickers.length === 0) return;
    
    generateBtn.classList.add('loading');
    generateBtn.textContent = 'GENERATING...';
    
    try {
        let reportHTML = '<div class="report-section">';
        reportHTML += `<h3>Analysis Date: ${new Date().toLocaleDateString()}</h3>`;
        reportHTML += `<p>Date Range: ${dates.startDate} to ${dates.endDate}</p>`;
        reportHTML += '</div>';
        
        // Fetch stock data for each ticker
        for (const ticker of tickers) {
            try {
                // Fetch stock data from Polygon API via your backend
                const stockUrl = `${API_BASE_URL}/api/stock/${ticker}`;
                console.log('Fetching stock data from:', stockUrl);
                const stockResponse = await fetch(stockUrl, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!stockResponse.ok) {
                    const errorText = await stockResponse.text();
                    console.error(`Error response for ${ticker}:`, errorText);
                    throw new Error(`Failed to fetch data for ${ticker}: ${stockResponse.status} - ${errorText}`);
                }
                const stockData = await stockResponse.json();
                
                // Get AI analysis from Anthropic API via your backend
                const analysisResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        ticker, 
                        stockData,
                        startDate: dates.startDate,
                        endDate: dates.endDate
                    })
                });
                const analysis = await analysisResponse.json();
                
                // Calculate price change if stock data is available
                let priceChange = 'N/A';
                let changePercent = 'N/A';
                if (stockData.results && stockData.results.length > 0) {
                    const firstPrice = stockData.results[0].c; // closing price
                    const lastPrice = stockData.results[stockData.results.length - 1].c;
                    const change = lastPrice - firstPrice;
                    const percent = ((change / firstPrice) * 100).toFixed(2);
                    priceChange = change.toFixed(2);
                    changePercent = `${percent > 0 ? '+' : ''}${percent}%`;
                }
                
                reportHTML += `
                    <div class="report-section">
                        <h3>${ticker} Analysis</h3>
                        <p><strong>Price Change:</strong> ${priceChange} (${changePercent})</p>
                        <p><strong>Summary:</strong> ${analysis.summary || 'Analysis pending...'}</p>
                        <p><strong>Technical:</strong> ${analysis.technical || 'Technical analysis pending...'}</p>
                        <p><strong>Recommendation:</strong> ${analysis.recommendation || 'Recommendation pending...'}</p>
                    </div>
                `;
            } catch (error) {
                console.error(`Error fetching data for ${ticker}:`, error);
                
                // Fallback to sample data if API fails
                const fallbackReport = sampleReports[ticker] || {
                    summary: `Unable to fetch real-time data for ${ticker}.`,
                    technical: 'Please check your API connection and try again.',
                    recommendation: 'N/A'
                };
                
                reportHTML += `
                    <div class="report-section">
                        <h3>${ticker} Analysis</h3>
                        <p style="color: #f87171;">⚠️ Using cached data (API unavailable)</p>
                        <p><strong>Summary:</strong> ${fallbackReport.summary}</p>
                        <p><strong>Technical:</strong> ${fallbackReport.technical}</p>
                        <p><strong>Recommendation:</strong> ${fallbackReport.recommendation}</p>
                    </div>
                `;
            }
        }
        
        reportHTML += `
            <div class="report-section">
                <h3>Disclaimer</h3>
                <p style="color: #6b7280; font-size: 13px;">
                    This analysis is generated by AI and should not be considered as financial advice. 
                    Always conduct your own research and consult with financial professionals before making investment decisions.
                </p>
            </div>
        `;
        
        reportContent.innerHTML = reportHTML;
        aiReportModal.classList.add('active');
        
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error generating report. Please check your API configuration.');
    } finally {
        generateBtn.classList.remove('loading');
        generateBtn.textContent = 'GENERATE AI REPORT';
    }
}

function closeModal() {
    aiReportModal.classList.remove('active');
}

// Demo button event listeners are at the bottom of the file


function loadDemoStock(ticker) {
    if (tickers.length < 3 && !tickers.includes(ticker)) {
        tickers.push(ticker);
        updateTickerDisplay();
        updateGenerateButton();
    }
}

async function generateDemoReport() {
    try {
        // Add demo tickers if none selected
        if (tickers.length === 0) {
            ['AAPL', 'TSLA', 'NVDA'].forEach(ticker => {
                if (tickers.length < 3) {
                    tickers.push(ticker);
                }
            });
            updateTickerDisplay();
            updateGenerateButton();
        }
        
        // Use the main report generation but with demo flag
        const demoReport = await generateReport(true);
        return demoReport;
    } catch (error) {
        console.error('Error in demo report:', error);
        return {
            ticker: 'DEMO',
            summary: 'Demo analysis is currently unavailable.',
            technical: 'Please try again later or check your API key.',
            recommendation: 'ERROR - Could not generate demo report.'
        };
    }
}

// // Time pill functionality
// document.querySelectorAll('.time-pill').forEach(btn => {
//     btn.addEventListener('click', function() {
//         document.querySelectorAll('.time-pill').forEach(b => b.classList.remove('active'));
//         this.classList.add('active');
//         animateChart();
//     });
// });

// Event listeners
addBtn.addEventListener('click', addTicker);
tickerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTicker();
});
generateBtn.addEventListener('click', generateReport);

// Close modal when clicking outside
aiReportModal.addEventListener('click', (e) => {
    if (e.target === aiReportModal) {
        closeModal();
    }
});

// Close button in modal
document.querySelector('.close-modal').addEventListener('click', closeModal);

// Demo button event listeners
document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.disabled) return;
        const btnText = e.target.textContent;
        if (btnText.includes('AAPL')) loadDemoStock('AAPL');
        else if (btnText.includes('TSLA')) loadDemoStock('TSLA');
        else if (btnText.includes('NVDA')) loadDemoStock('NVDA');
        else if (btnText.includes('Demo Loading')) animateChart();
        else if (btnText.includes('Demo Report')) generateDemoReport();
    });
});


