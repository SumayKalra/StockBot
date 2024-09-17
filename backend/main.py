# main.py

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import openpyxl
from openpyxl import Workbook
from datetime import datetime
import pandas as pd
import numpy as np
import yfinance as yf
from typing import List
import uvicorn

# Import functions from stock_data.py
from stock_data import (
    initialize_excel,
    calculate_stochastic,
    determine_zone,
    decide_action,
    log_stock_analysis,
    log_trade,
    get_todays_date,
    trade_exists,
    log_american_bull_info
)

app = FastAPI()

# Allow CORS for all origins (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory "database" for example purposes
user_stocks = []
rh_credentials = {"username": "", "password": ""}

# Endpoint to add stocks to the list with validation
@app.post("/add_stock")
def add_stock(stock_symbol: str):
    stock_symbol = stock_symbol.upper()

    # Validate the stock symbol using yfinance
    ticker = yf.Ticker(stock_symbol)
    try:
        # Try fetching historical data
        data = ticker.history(period='1d')
        if data.empty:
            raise ValueError("Invalid stock symbol")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid stock symbol: {stock_symbol}")

    if stock_symbol not in user_stocks:
        user_stocks.append(stock_symbol)
        return {"message": f"Stock {stock_symbol} added to your list."}
    else:
        return {"message": f"Stock {stock_symbol} is already in your list."}

# Endpoint to remove a stock from the list and delete its data from the Excel sheets
@app.post("/remove_stock")
def remove_stock(stock_symbol: str):
    stock_symbol = stock_symbol.upper()

    if stock_symbol in user_stocks:
        user_stocks.remove(stock_symbol)

        # Remove stock data from Excel sheets
        file_name = "trade_log.xlsx"
        if os.path.exists(file_name):
            wb = openpyxl.load_workbook(file_name)

            # Remove from "Stock Analysis" sheet
            if "Stock Analysis" in wb.sheetnames:
                ws_analysis = wb["Stock Analysis"]
                rows_to_delete = []
                for row in ws_analysis.iter_rows(min_row=2):
                    if row[0].value == stock_symbol:
                        rows_to_delete.append(row[0].row)
                for row_num in sorted(rows_to_delete, reverse=True):
                    ws_analysis.delete_rows(row_num)

            # Remove from "American Bull Info" sheet
            if "American Bull Info" in wb.sheetnames:
                ws_bull = wb["American Bull Info"]
                rows_to_delete = []
                for row in ws_bull.iter_rows(min_row=2):
                    if row[0].value == stock_symbol:
                        rows_to_delete.append(row[0].row)
                for row_num in sorted(rows_to_delete, reverse=True):
                    ws_bull.delete_rows(row_num)

            wb.save(file_name)

        return {"message": f"Stock {stock_symbol} removed from your list and associated data deleted."}
    else:
        return {"message": f"Stock {stock_symbol} is not in your list."}

# Endpoint to remove stock data from the tables without removing from stock list
@app.post("/remove_stock_data")
def remove_stock_data(stock_symbol: str):
    stock_symbol = stock_symbol.upper()

    file_name = "trade_log.xlsx"
    if not os.path.exists(file_name):
        return {"error": "Data file not found."}

    wb = openpyxl.load_workbook(file_name)

    # Remove from "Stock Analysis" sheet
    if "Stock Analysis" in wb.sheetnames:
        ws_analysis = wb["Stock Analysis"]
        rows_to_delete = []
        for row in ws_analysis.iter_rows(min_row=2):
            if row[0].value == stock_symbol:
                rows_to_delete.append(row[0].row)
        for row_num in sorted(rows_to_delete, reverse=True):
            ws_analysis.delete_rows(row_num)

    # Remove from "American Bull Info" sheet
    if "American Bull Info" in wb.sheetnames:
        ws_bull = wb["American Bull Info"]
        rows_to_delete = []
        for row in ws_bull.iter_rows(min_row=2):
            if row[0].value == stock_symbol:
                rows_to_delete.append(row[0].row)
        for row_num in sorted(rows_to_delete, reverse=True):
            ws_bull.delete_rows(row_num)

    wb.save(file_name)

    return {"message": f"Data for stock {stock_symbol} has been removed from the tables."}

# Endpoint to get the stock list
@app.get("/stocks")
def get_stocks():
    return {"stocks": user_stocks}

# Simulate American Bull data (using simulated data)
def get_simulated_american_bull_data(stock_code):
    # Simulate signals for demonstration purposes
    simulated_signal = "BUY" if np.random.rand() > 0.5 else "SELL"
    bull_date = get_todays_date()  # Use today's date
    return {"Date": bull_date, "Signal": simulated_signal}

# Endpoint to execute analysis (simulated trading)
@app.post("/execute_analysis")
def execute_analysis():
    # Initialize Excel file
    initialize_excel()

    stock_list = user_stocks

    results = []

    for stock in stock_list:
        stock = stock.upper()

        # Get today's date
        today_date = get_todays_date()

        # Simulate American Bull info
        bull_data = get_simulated_american_bull_data(stock)
        bull_date = bull_data["Date"]
        bull_signal = bull_data["Signal"]

        # Log American Bull info
        log_american_bull_info(stock, bull_signal, bull_date)

        # Calculate stochastic oscillator
        latest_k, latest_d = calculate_stochastic(stock)
        if latest_k is None or latest_d is None:
            message = f"Could not calculate stochastic oscillator for {stock}"
            print(message)
            results.append({"stock": stock, "message": message})
            continue

        # Determine the zone
        zone = determine_zone(latest_k, latest_d)

        # Decide action based on the zone
        decision = decide_action(zone)

        # Get latest price
        try:
            ticker = yf.Ticker(stock)
            latest_price = ticker.history(period='1d')['Close'].iloc[-1]
        except Exception as e:
            message = f"Error getting price for {stock}: {e}"
            print(message)
            results.append({"stock": stock, "message": message})
            continue

        # Log stock analysis
        log_stock_analysis(stock, latest_price, latest_k, latest_d, zone, decision)

        # Simulate trade action based on American Bull info and zone
        if bull_date == today_date:
            if "BUY" in bull_signal and "Green Zone" in zone:
                action = "Buy"
                shares = round(250 / latest_price, 6)  # Simulate buying $250 worth
                executed = True
                log_trade(action, stock, latest_price, shares, executed, zone, latest_k)
                message = f"Simulated buying {shares} shares of {stock} at {latest_price}"
                print(message)
                results.append({"stock": stock, "action": action, "message": message})
            elif "SELL" in bull_signal and "Red Zone" in zone:
                action = "Sell"
                shares_owned = 10  # Simulate number of shares owned
                executed = True
                log_trade(action, stock, latest_price, shares_owned, executed, zone, latest_k)
                message = f"Simulated selling {shares_owned} shares of {stock} at {latest_price}"
                print(message)
                results.append({"stock": stock, "action": action, "message": message})
            else:
                message = f"Signal and zone do not match for {stock}"
                print(message)
                results.append({"stock": stock, "message": message})
        else:
            message = f"American Bull date {bull_date} does not match today's date for {stock}"
            print(message)
            results.append({"stock": stock, "message": message})

    return {"status": "Analysis executed", "results": results}

# Endpoint to fetch data from Excel sheets
@app.get("/data/{sheet_name}")
def get_data(sheet_name: str):
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

# Endpoint to save Robinhood credentials (if needed)
@app.post("/save_robinhood_credentials")
def save_robinhood_credentials(rh_username: str, rh_password: str):
    rh_credentials["username"] = rh_username
    rh_credentials["password"] = rh_password
    return {"message": "Robinhood credentials saved successfully."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
