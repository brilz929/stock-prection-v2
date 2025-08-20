# AI Stock Prediction App

This web application provides AI-generated analysis for up to three stock tickers, offering users a summary, technical analysis, and a buy/hold/sell recommendation based on recent market data.

## Features

*   **Ticker Input**: Add up to 3 stock tickers for analysis.
*   **AI-Powered Reports**: Generate a detailed report with AI-driven insights using Anthropic. 
*   **Demo Mode**: Instantly view sample reports for major stocks like AAPL, TSLA, and NVDA.
*   **Dynamic UI**: The interface updates in real-time to reflect your selected tickers and button states.
*   **Responsive Design**: A clean and modern interface that works on both desktop and mobile devices.

## Tech Stack

*   **Frontend**: HTML, CSS, Vanilla JavaScript
*   **Backend**: Node.js, Express
*   **APIs**:
    *   **Polygon API**: For historical stock data.
    *   **Anthropic API**: For generating AI analysis.
*   **Deployment**:
    *   **Frontend**: [Netlify](httpshttps://www.netlify.com/)
    *   **Backend**: [Render](https://render.com/)

## How to Use

1.  Enter a stock ticker (e.g., `GOOGL`) into the input field and click the `+` button.
2.  Add up to two more tickers.
3.  Alternatively, click the `+ AAPL`, `+ TSLA`, or `+ NVDA` buttons to add sample tickers.
4.  Click the **GENERATE AI REPORT** button to view the analysis.

## Live Demo

You can try out the live application here: https://ai-stock-prediction-scrimba.netlify.app/
