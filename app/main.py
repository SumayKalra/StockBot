# main.py
import os
from fastapi import FastAPI, HTTPException, Query, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
from datetime import datetime
from typing import Optional, List, Dict
import logging
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore
import requests
from bs4 import BeautifulSoup
import robin_stocks.robinhood as r
from pydantic import BaseModel
import time
import pyotp
from fastapi.background import BackgroundTasks


class Credentials(BaseModel):
    username: str
    password: str
    totp_secret: str 

class UsernameModel(BaseModel):
    username: str

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# --- Firebase Initialization ---
service_account_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not os.path.exists(service_account_path):
    raise RuntimeError(f"{service_account_path} not found. Ensure the file is included in the deployment.")

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)
db = firestore.client()


# --- FastAPI App ---
app = FastAPI()

# CORS for local dev and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/validate_and_fetch_trades")
async def validate_and_fetch_trades(creds: Credentials):
    """
    Validate Robinhood credentials and fetch trades. If valid, store credentials in Firestore.
    """
    try:
        totp_code = pyotp.TOTP(creds.totp_secret).now()
        response = r.login(creds.username, creds.password, mfa_code=totp_code, store_session=False)
        if not response.get("access_token"):
            return {"isValid": False, "error": "Invalid credentials. Please try again."}

        # Save credentials
        users_ref = db.collection("users").document(creds.username)
        users_ref.set({
            "username": creds.username,
            "password": creds.password,
            "totp_secret": creds.totp_secret,
            "last_login": datetime.utcnow().isoformat(),
        }, merge=True)

        # Fetch trades
        account_profile = r.profiles.load_account_profile()
        portfolio_cash = float(account_profile.get("portfolio_cash", 0))
        buying_power = float(account_profile.get("buying_power", 0))
        cash_available = float(account_profile.get("cash", 0))

        orders = r.orders.get_all_stock_orders()
        trades = []
        for order in orders:
            if order.get("state") == "filled":
                instr = requests.get(order["instrument"]).json()
                trades.append({
                    "symbol": instr.get("symbol"),
                    "side": order["side"],
                    "quantity": float(order.get("quantity", 0)),
                    "price": float(order.get("average_price", 0)),
                    "date": order.get("last_transaction_at"),
                })

        trades = sorted(trades, key=lambda x: x["date"], reverse=True)

        # Recommendations (placeholder)
        recommended_trades = [
            {"symbol": "AAPL", "reason": "Strong quarterly earnings growth."},
            {"symbol": "GOOGL", "reason": "Positive technical indicators."},
            {"symbol": "TSLA", "reason": "Increasing demand in EV market."},
        ]

        return {
            "isValid": True,
            "message": "Login successful. Trades fetched.",
            "trades": trades,
            "balance": portfolio_cash,
            "buying_power": buying_power,
            "cash": cash_available,
            "recommendations": recommended_trades,
        }

    except Exception as e:
        logger.error(f"Error during login and fetch: {e}")
        return {"isValid": False, "error": str(e)}

@app.get("/get_credentials")
def get_credentials(username: str = Query(...)):
    """
    Retrieve stored credentials for the given username, if any.
    """
    doc_ref = db.collection("users").document(username).get()
    if not doc_ref.exists:
        return {"error": "No credentials found for this user."}

    data = doc_ref.to_dict()
    if "username" not in data or "password" not in data or "totp_secret" not in data:
        return {"error": "Incomplete credentials stored."}

    return {
        "username": data["username"],
        "password": data["password"],
        "totp_secret": data["totp_secret"]
    }

# --- Middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# --- Helpers ---
def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header provided.")
    token_parts = authorization.split(" ")
    if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format.")
    id_token = token_parts[1]
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token: email not found.")
        user_ref = db.collection("users").document(email)
        if not user_ref.get().exists:
            user_ref.set({
                "stocks": [],
                "stock_analysis": {},
                "american_bull_info": {}
            })
        return email
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

def recommend_data() -> List[Dict]:
    """Scrape recommended stock data from American Bulls website."""
    url = "https://www.americanbulls.com/Default.aspx?lang=en"

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "lxml")

        # Find the table that contains the stock data
        table = soup.find("table", class_="table-hover")
        if not table:
            logger.error("No table found on the American Bulls page.")
            return []

        # Extract all rows (tr elements) with class "gridRows"
        rows = table.find_all("tr", class_="gridRows")
        stock_data = []

        # Helper function to clean text
        def clean_text(text):
            return ' '.join(text.split()).replace("\n", "").replace("\r", "").strip()

        for row in rows:
            date_div = row.find("div", id=lambda x: x and "Tarih" in x)
            stock_a = row.find("a", class_="dxbs-hyperlink")
            signal_div = row.find("div", id=lambda x: x and "gridlevel" in x)
            buy_level_div = row.find("div", id=lambda x: x and "gridprice" in x)
            close_price_div = row.find("div", id=lambda x: x and "gridclose" in x)

            date = clean_text(date_div.text) if date_div else "N/A"
            stock_name = clean_text(stock_a.text) if stock_a else "N/A"
            signal = clean_text(signal_div.text) if signal_div else "N/A"
            buy_level = clean_text(buy_level_div.text) if buy_level_div else "N/A"
            close_price = clean_text(close_price_div.text) if close_price_div else "N/A"

            stock_data.append({
                "Date": date,
                "Stock Name": stock_name,
                "Signal": signal,
                "Buy Level": buy_level,
                "Close Price": close_price,
            })

        return stock_data

    except Exception as e:
        logger.error(f"Error scraping American Bulls data: {e}")
        return []

def specific_stock(stock_code: str) -> List[Dict]:
    """Scrape specific stock data from American Bulls website."""
    url = f"https://www.americanbulls.com/SignalPage.aspx?lang=en&Ticker={stock_code}"

    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "lxml")

        # Find the table by its id
        table = soup.find("table", id="Content_SignalHistory_SignalShortHistoryGrid_DXMainTable")
        if not table:
            logger.error(f"Table not found for stock: {stock_code}")
            return []

        table_data = []
        # Loop through each row in the table body (tr elements)
        for row in table.find("tbody").find_all("tr"):
            cells = row.find_all("td")
            if len(cells) >= 5:
                date = cells[0].text.strip()
                price = cells[1].text.strip()
                signal = cells[2].text.strip()
                change = cells[3].text.strip()
                value = cells[4].text.strip()

                table_data.append({
                    "Date": date,
                    "Price": price,
                    "Signal": signal,
                    "Change%": change,
                    "Value": value,
                })

        return table_data

    except Exception as e:
        logger.error(f"Error scraping specific stock data for {stock_code}: {e}")
        return []

def calculate_stochastic(stock_symbol: str, period: int = 14):
    """Calculate the stochastic oscillator for a given stock."""
    try:
        data = yf.download(stock_symbol, period='1mo', interval='1d')
        if data.empty:
            logger.error(f"No data found for stock: {stock_symbol}")
            return None, None

        high_max = data['High'].rolling(window=period).max()
        low_min = data['Low'].rolling(window=period).min()
        data['%K'] = 100 * ((data['Close'] - low_min) / (high_max - low_min))
        data['%D'] = data['%K'].rolling(window=3).mean()

        latest_k = data['%K'].iloc[-1]
        latest_d = data['%D'].iloc[-1]
        return latest_k, latest_d
    except Exception as e:
        logger.error(f"Error calculating stochastic for {stock_symbol}: {e}")
        return None, None

def determine_zone(latest_k: float, latest_d: float) -> str:
    """Determine the zone based on %K and %D values."""
    if latest_k is None or latest_d is None:
        return "Unknown"
    elif latest_k > 80 or latest_d > 80:
        return "Red Zone: Overbought - Potential Sell Opportunity"
    elif 20 <= latest_k <= 80 or 20 <= latest_d <= 80:
        return "Neutral Zone: Hold Phase"
    elif latest_k < 20 or latest_d < 20:
        return "Green Zone: Oversold - Potential Buy Opportunity"
    else:
        return "Neutral Zone: Hold Phase"

def decide_action(zone: str) -> str:
    """Decide action based on the zone."""
    if "Overbought" in zone:
        return "Consider Selling"
    elif "Oversold" in zone:
        return "Consider Buying"
    else:
        return "Hold"

# --- Endpoints ---
@app.options("/{full_path:path}")
async def preflight(full_path: str):
    return {"message": "Preflight request"}

@app.post("/add_stock")
def add_stock(stock_symbol: str = Query(None), user_email: str = Depends(get_current_user)):
    if not stock_symbol:
        raise HTTPException(status_code=400, detail="Stock symbol is required.")
    stock_symbol = stock_symbol.upper()
    try:
        ticker = yf.Ticker(stock_symbol)
        data = ticker.history(period='1d')
        if data.empty:
            raise ValueError("Invalid stock symbol")
    except Exception as e:
        logger.error(f"Error fetching stock data for {stock_symbol}: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid stock symbol: {stock_symbol}")

    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    stocks = user_data.get("stocks", [])
    if stock_symbol in stocks:
        return {"message": f"Stock {stock_symbol} is already in your list."}
    stocks.append(stock_symbol)
    user_ref.update({"stocks": stocks})
    return {"message": f"Stock {stock_symbol} added to your list."}

@app.post("/remove_stock")
def remove_stock(stock_symbol: str = Query(...), user_email: str = Depends(get_current_user)):
    stock_symbol = stock_symbol.upper()
    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    stocks = user_data.get("stocks", [])
    if stock_symbol not in stocks:
        return {"message": f"Stock {stock_symbol} is not in your list."}
    stocks = [s for s in stocks if s != stock_symbol]
    user_ref.update({"stocks": stocks})

    # Remove analysis data
    stock_analysis_ref = user_ref.collection("stock_analysis").document(stock_symbol)
    stock_analysis_ref.delete()

    american_bull_ref = user_ref.collection("american_bull_info").document(stock_symbol)
    american_bull_ref.delete()

    return {"message": f"Stock {stock_symbol} removed from your list."}

@app.get("/stocks")
def get_stocks(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    return {"stocks": user_data.get("stocks", [])}

@app.post("/execute_analysis")
def execute_analysis(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    user_stocks = user_data.get("stocks", [])
    if not user_stocks:
        return {"status": "No stocks to analyze", "results": []}

    results = []
    for stock in user_stocks:
        stock = stock.upper()
        try:
            # Fetch latest price
            ticker = yf.Ticker(stock)
            latest_price = ticker.history(period='1d')['Close'].iloc[-1]

            # Calculate stochastic oscillator
            latest_k, latest_d = calculate_stochastic(stock)
            zone = determine_zone(latest_k, latest_d)
            decision = decide_action(zone)

            # Log to Firestore
            stock_analysis_ref = user_ref.collection("stock_analysis").document(stock)
            stock_analysis_ref.set({
                "Stock Name": stock,
                "Price": latest_price,
                "%K": latest_k,
                "%D": latest_d,
                "Zone": zone,
                "Decision": decision,
                "Last Updated": datetime.utcnow()
            })

            # Scrape American Bull Info
            american_bull_data = specific_stock(stock)
            # Assuming american_bull_data is a list; take the latest entry
            if american_bull_data:
                latest_bull = american_bull_data[0]
                american_bull_ref = user_ref.collection("american_bull_info").document(stock)
                american_bull_ref.set({
                    "Stock Name": stock,
                    "Signal": latest_bull.get("Signal", "N/A"),
                    "Date": latest_bull.get("Date", "N/A"),
                    "Price": latest_bull.get("Price", "N/A"),
                    "Change%": latest_bull.get("Change%", "N/A"),
                    "Value": latest_bull.get("Value", "N/A"),
                    "Last Updated": datetime.utcnow()
                })
            else:
                american_bull_ref = user_ref.collection("american_bull_info").document(stock)
                american_bull_ref.set({
                    "Stock Name": stock,
                    "Signal": "N/A",
                    "Date": "N/A",
                    "Price": "N/A",
                    "Change%": "N/A",
                    "Value": "N/A",
                    "Last Updated": datetime.utcnow()
                })

            results.append({"stock": stock, "price": latest_price, "analysis": decision})
        except Exception as e:
            logger.error(f"Error analyzing stock {stock}: {e}")
            results.append({"stock": stock, "error": str(e)})

    return {"status": "Analysis executed", "results": results}

@app.get("/stock_analysis")
def get_stock_analysis(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    stock_analysis_ref = user_ref.collection("stock_analysis")
    docs = stock_analysis_ref.stream()
    analysis_data = []
    for doc in docs:
        data = doc.to_dict()
        analysis_data.append(data)
    return {"stock_analysis": analysis_data}


@app.get("/american_bull_info")
def get_american_bull_info(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    american_bull_ref = user_ref.collection("american_bull_info")
    docs = american_bull_ref.stream()
    bull_data = []
    for doc in docs:
        data = doc.to_dict()
        bull_data.append(data)
    return {"american_bull_info": bull_data}

@app.post("/delete_all_stocks")
def delete_all_stocks(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    
    # Get current stocks
    user_data = user_ref.get().to_dict()
    stocks = user_data.get("stocks", [])
    
    if not stocks:
        return {"message": "No stocks to delete."}
    
    # Update the stocks array to empty
    user_ref.update({"stocks": []})
    
    # Batch delete documents in stock_analysis and american_bull_info
    stock_analysis_ref = user_ref.collection("stock_analysis")
    american_bull_ref = user_ref.collection("american_bull_info")
    
    batch = db.batch()
    
    # Delete all documents in stock_analysis
    for doc in stock_analysis_ref.stream():
        batch.delete(doc.reference)
    
    # Delete all documents in american_bull_info
    for doc in american_bull_ref.stream():
        batch.delete(doc.reference)
    
    batch.commit()
    
    return {"message": "All stocks and associated data have been deleted."}

@app.get("/")
def root():
    return {"message": "API is running!"}
