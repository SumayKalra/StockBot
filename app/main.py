import os
import json
import base64
from fastapi import FastAPI, HTTPException, Query, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import openpyxl
from datetime import datetime
from typing import Optional
import logging

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

# Logger setup for production
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Firebase Initialization
firebase_credentials = os.getenv("SERVICE_ACCOUNT_KEY")  # Environment variable with Base64-encoded Firebase key
if not firebase_credentials:
    raise RuntimeError("Firebase SERVICE_ACCOUNT_KEY not set in environment variables.")

# Decode Firebase credentials
firebase_key_json = json.loads(base64.b64decode(firebase_credentials).decode("utf-8"))
cred = credentials.Certificate(firebase_key_json)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize FastAPI app
app = FastAPI()

# CORS middleware for production and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stocks-d4bba.web.app/",  # Production frontend
        "http://localhost:3000",  # Local development frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to log incoming requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response


# Helper: Get Current User
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
        # Ensure user document exists in Firestore
        user_ref = db.collection("users").document(email)
        if not user_ref.get().exists:
            user_ref.set({"stocks": []})
        return email
    except Exception as e:
        logger.error(f"Error verifying Firebase token: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


# Helper: Initialize Excel Workbook
def initialize_excel(file_name="trade_log.xlsx"):
    if not os.path.exists(file_name):
        wb = openpyxl.Workbook()
        wb.active.title = "Trade Log"
        wb["Trade Log"].append(["Date", "Action", "Stock Name", "Price", "Shares", "Zone", "Percent", "Executed"])
        wb.create_sheet(title="Stock Analysis").append(["Stock Name", "Price", "%K", "%D", "Zone", "Decision"])
        wb.create_sheet(title="American Bull Info").append(["Stock Name", "Signal", "Date"])
        wb.save(file_name)


# Helper: Log Data into Excel Sheets
def log_data(sheet_name: str, data: list, file_name="trade_log.xlsx"):
    wb = openpyxl.load_workbook(file_name)
    if sheet_name not in wb.sheetnames:
        wb.create_sheet(sheet_name)
    ws = wb[sheet_name]
    ws.append(data)
    wb.save(file_name)


# Endpoint: Add Stock
@app.post("/add_stock")
def add_stock(stock_symbol: str = Query(...), user_email: str = Depends(get_current_user)):
    stock_symbol = stock_symbol.upper()
    try:
        ticker = yf.Ticker(stock_symbol)
        data = ticker.history(period='1d')
        if data.empty:
            raise ValueError("Invalid stock symbol")
    except Exception as e:
        logger.error(f"Error fetching stock data for {stock_symbol}: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid stock symbol: {stock_symbol}")

    # Add stock to Firestore
    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    stocks = user_data.get("stocks", [])
    if stock_symbol in stocks:
        return {"message": f"Stock {stock_symbol} is already in your list."}
    stocks.append(stock_symbol)
    user_ref.update({"stocks": stocks})
    return {"message": f"Stock {stock_symbol} added to your list."}


# Endpoint: Remove Stock
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
    return {"message": f"Stock {stock_symbol} removed from your list."}


# Endpoint: Get User Stocks
@app.get("/stocks")
def get_stocks(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    return {"stocks": user_data.get("stocks", [])}


# Endpoint: Execute Stock Analysis
@app.post("/execute_analysis")
def execute_analysis(user_email: str = Depends(get_current_user)):
    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    user_stocks = user_data.get("stocks", [])
    if not user_stocks:
        return {"status": "No stocks to analyze", "results": []}

    initialize_excel()
    results = []
    today_date = datetime.today().strftime('%m/%d')

    for stock in user_stocks:
        stock = stock.upper()
        try:
            ticker = yf.Ticker(stock)
            latest_price = ticker.history(period='1d')['Close'].iloc[-1]
            results.append({"stock": stock, "price": latest_price, "analysis": "Buy/Hold/Sell"})
        except Exception as e:
            logger.error(f"Error analyzing stock {stock}: {e}")
            results.append({"stock": stock, "error": str(e)})

    return {"status": "Analysis executed", "results": results}


# Endpoint: Get Data from Excel
@app.get("/data/{sheet_name}")
def get_data(sheet_name: str, user_email: str = Depends(get_current_user)):
    file_name = "trade_log.xlsx"
    if not os.path.exists(file_name):
        return {"error": "Data file not found."}
    wb = openpyxl.load_workbook(file_name, data_only=True)
    if sheet_name not in wb.sheetnames:
        return {"error": f"Sheet {sheet_name} not found."}
    ws = wb[sheet_name]
    data = []
    headers = [cell.value for cell in ws[1]]
    for row in ws.iter_rows(min_row=2, values_only=True):
        record = dict(zip(headers, row))
        data.append(record)
    return {"data": data}


# Endpoint: Root
@app.get("/")
def root():
    return {"message": "API is running in production!"}
