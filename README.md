
---

# Stonks Trading Dashboard

## Overview

The **Stonks Trading Dashboard** is a web-based application that allows users to analyze their stock portfolio with features such as stock analysis zones (overbought, neutral, etc.), integration with Robinhood credentials, and American Bull stock signals. This tool is built to help traders make informed decisions about buying, holding, or selling their stocks.

### Features:
- **Stock Management**: Add or remove stocks from your portfolio.
- **Robinhood Integration**: Save and manage Robinhood credentials to access stock data.
- **Stock Analysis**: Displays technical indicators (%K and %D), price, and recommendation zones (Neutral, Overbought, etc.) for better trading decisions.
- **American Bull Signals**: Displays BUY/SELL signals for listed stocks with the signal date.

## Project Structure

The project is divided into two primary components:

1. **Frontend (stonks)**: This is the React-based frontend that serves the user interface of the dashboard.
2. **Backend (backend)**: This is the backend server built using Python and Uvicorn to handle requests and provide data to the frontend.

---

## How to Set Up and Run the Project

### Prerequisites

Make sure you have the following installed:
- **Node.js**: For running the frontend.
- **Python 3.9+**: For running the backend.
- **Uvicorn**: As the ASGI server to run the backend.

### Frontend (stonks)

1. Navigate to the `stonks` folder:
   ```bash
   cd stonks
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

4. The frontend should now be accessible on `http://localhost:3000`.

### Backend (backend)

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install the required Python dependencies (use a virtual environment if desired):
   ```bash
   pip install -r requirements.txt
   ```

3. Run the backend server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

4. The backend should now be running on `http://localhost:8000`.

### Connecting the Frontend and Backend

Ensure both the frontend and backend are running. The frontend will communicate with the backend using API requests for stock data and analysis.

---

## Key Functionalities

### 1. Stock Management
- Add new stocks by entering the stock symbol.
- Remove stocks from your portfolio.

### 2. Stock Analysis
- Stock data includes:
  - **Price**: The current stock price.
  - **%K and %D values**: Used for stochastic oscillators, helping you analyze market conditions.
  - **Zone**: Displays the stock’s status (e.g., "Neutral Zone: Hold Phase" or "Red Zone: Overbought - Potential Sell Opportunity").
  
### 3. American Bull Signals
- Receive stock BUY/SELL signals from American Bull and act accordingly.
- Displays the date for each signal.

---

## Tech Stack

- **Frontend**: React (JavaScript)
- **Backend**: Python (FastAPI), Uvicorn
- **Libraries/Frameworks**: 
  - React for building the frontend.
  - FastAPI for handling backend logic.
  - Uvicorn as the ASGI server.

---

## Future Enhancements

Some future enhancements for this project could include:
- Integration with more stock trading platforms.
- Detailed charting and graphing for stock performance.
- User authentication for saving multiple portfolios.

---

Feel free to modify this README file as your project evolves!

--- 

This should help users understand the project structure, installation, and how to get the system running.
