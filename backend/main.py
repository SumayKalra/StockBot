import os
from fastapi import FastAPI, HTTPException, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import openpyxl
from typing import Optional

from ScrapingDetails import specific_stock
from stock_data import (
    initialize_excel,
    calculate_stochastic,
    determine_zone,
    decide_action,
    log_stock_analysis,
    log_trade,
    get_todays_date,
    log_american_bull_info,
)

# Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

# Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://stocks-d4bba.web.app/"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid token type")
    id_token = parts[1]
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token: no email")
        # Ensure user document exists in Firestore
        user_ref = db.collection("users").document(email)
        if not user_ref.get().exists:
            user_ref.set({"stocks": []})
        return email
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_simulated_american_bull_data(stock_code):
    stock_data = specific_stock(stock_code)
    if not stock_data:
        return {"Date": "N/A", "Signal": "N/A"}
    latest_entry = stock_data[0]
    return {"Date": latest_entry.get("Date", "N/A"), "Signal": latest_entry.get("Signal", "N/A")}

@app.post("/add_stock")
def add_stock(stock_symbol: str = Query(...), user_email: str = Depends(get_current_user)):
    stock_symbol = stock_symbol.upper()
    ticker = yf.Ticker(stock_symbol)
    try:
        data = ticker.history(period='1d')
        if data.empty:
            raise ValueError("Invalid stock symbol")
    except:
        raise HTTPException(status_code=400, detail=f"Invalid stock symbol: {stock_symbol}")

    user_ref = db.collection("users").document(user_email)
    user_data = user_ref.get().to_dict()
    stocks = user_data.get("stocks", [])
    if stock_symbol in stocks:
        return {"message": f"Stock {stock_symbol} is already in your list."}
    # Add the new stock
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

    # Remove the stock
    stocks = [s for s in stocks if s != stock_symbol]
    user_ref.update({"stocks": stocks})

    # Remove stock data from Excel sheets
    file_name = "trade_log.xlsx"
    if os.path.exists(file_name):
        wb = openpyxl.load_workbook(file_name)
        for sheet_name in ["Stock Analysis", "American Bull Info"]:
            if sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                rows_to_delete = [
                    row[0].row for row in ws.iter_rows(min_row=2)
                    if row[0].value == stock_symbol
                ]
                for row_num in sorted(rows_to_delete, reverse=True):
                    ws.delete_rows(row_num)
        wb.save(file_name)

    return {"message": f"Stock {stock_symbol} removed and data deleted."}

@app.post("/remove_stock_data")
def remove_stock_data(stock_symbol: str = Query(...), user_email: str = Depends(get_current_user)):
    stock_symbol = stock_symbol.upper()
    file_name = "trade_log.xlsx"
    if not os.path.exists(file_name):
        return {"error": "Data file not found."}

    wb = openpyxl.load_workbook(file_name)
    for sheet_name in ["Stock Analysis", "American Bull Info"]:
        if sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            rows_to_delete = [
                row[0].row for row in ws.iter_rows(min_row=2)
                if row[0].value == stock_symbol
            ]
            for row_num in sorted(rows_to_delete, reverse=True):
                ws.delete_rows(row_num)
    wb.save(file_name)
    return {"message": f"Data for stock {stock_symbol} has been removed."}

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

    initialize_excel()
    results = []
    today_date = get_todays_date()

    for stock in user_stocks:
        stock = stock.upper()
        bull_data = get_simulated_american_bull_data(stock)
        bull_date, bull_signal = bull_data["Date"], bull_data["Signal"]

        log_american_bull_info(stock, bull_signal, bull_date)

        latest_k, latest_d = calculate_stochastic(stock)
        if latest_k is None or latest_d is None:
            message = f"Could not calculate stochastic oscillator for {stock}"
            results.append({"stock": stock, "message": message})
            continue

        zone = determine_zone(latest_k, latest_d)
        decision = decide_action(zone)

        try:
            ticker = yf.Ticker(stock)
            latest_price = ticker.history(period='1d')['Close'].iloc[-1]
        except Exception as e:
            message = f"Error getting price for {stock}: {e}"
            results.append({"stock": stock, "message": message})
            continue

        log_stock_analysis(stock, latest_price, latest_k, latest_d, zone, decision)

        if bull_date == today_date:
            if "BUY" in bull_signal and "Green Zone" in zone:
                action = "Buy"
                shares = round(250 / latest_price, 6)
                executed = True
                log_trade(action, stock, latest_price, shares, executed, zone, latest_k)
                message = f"Simulated buying {shares} shares of {stock} at {latest_price}"
                results.append({"stock": stock, "action": action, "message": message})
            elif "SELL" in bull_signal and "Red Zone" in zone:
                action = "Sell"
                shares_owned = 10  # Simulate some shares
                executed = True
                log_trade(action, stock, latest_price, shares_owned, executed, zone, latest_k)
                message = f"Simulated selling {shares_owned} shares of {stock} at {latest_price}"
                results.append({"stock": stock, "action": action, "message": message})
            else:
                message = f"No action for {stock}: Signal and zone do not match."
                results.append({"stock": stock, "message": message})
        else:
            message = f"No action for {stock}: Signal date does not match today."
            results.append({"stock": stock, "message": message})

    return {"status": "Analysis executed", "results": results}

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
