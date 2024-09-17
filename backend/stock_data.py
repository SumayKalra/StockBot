# stock_data.py

import os
import openpyxl
from openpyxl import Workbook
from datetime import datetime
import pandas as pd
import numpy as np
import yfinance as yf

# Initialize Excel File
def initialize_excel(file_name="trade_log.xlsx"):
    if not os.path.exists(file_name):
        # Create a new workbook and add headers if the file doesn't exist
        wb = Workbook()
        ws = wb.active
        ws.title = "Trade Log"
        ws.append(["Date", "Action", "Stock Name", "Price", "Shares", "Zone", "Percent", "Executed"])

        # Create the Stock Analysis sheet
        ws_analysis = wb.create_sheet(title="Stock Analysis")
        ws_analysis.append(["Stock Name", "Price", "%K", "%D", "Zone", "Decision"])

        # Create the American Bull Info sheet
        ws_bull = wb.create_sheet(title="American Bull Info")
        ws_bull.append(["Stock Name", "Signal", "Date"])

        wb.save(file_name)
    else:
        # Open the existing workbook
        wb = openpyxl.load_workbook(file_name)
        # Check if the "Stock Analysis" sheet exists
        if "Stock Analysis" not in wb.sheetnames:
            ws_analysis = wb.create_sheet(title="Stock Analysis")
            ws_analysis.append(["Stock Name", "Price", "%K", "%D", "Zone", "Decision"])
        # Check if the "American Bull Info" sheet exists
        if "American Bull Info" not in wb.sheetnames:
            ws_bull = wb.create_sheet(title="American Bull Info")
            ws_bull.append(["Stock Name", "Signal", "Date"])
        wb.save(file_name)
    return wb

# Function to calculate the stochastic oscillator
def calculate_stochastic(stock_symbol, period=14):
    try:
        # Get historical data using yfinance
        data = yf.download(stock_symbol, period='1mo', interval='1d')
        if data.empty:
            print(f"No data for {stock_symbol}")
            return None, None

        df = data.copy()
        df['Lowest Low'] = df['Low'].rolling(window=period).min()
        df['Highest High'] = df['High'].rolling(window=period).max()
        df['%K'] = ((df['Close'] - df['Lowest Low']) / (df['Highest High'] - df['Lowest Low'])) * 100
        df['%D'] = df['%K'].rolling(window=3).mean()

        latest_k = df['%K'].iloc[-1]
        latest_d = df['%D'].iloc[-1]

        return latest_k, latest_d
    except Exception as e:
        print(f"Error calculating stochastic for {stock_symbol}: {e}")
        return None, None

# Function to determine the zone
def determine_zone(latest_k, latest_d):
    if latest_k is None or latest_d is None:
        return "Unknown"
    elif latest_k > 80 or latest_d > 80:
        return "Red Zone: Overbought - Potential Sell Opportunity"
    elif 20 <= latest_k <= 80 or 20 <= latest_d <= 80:
        return "Neutral Zone: Hold Phase"
    elif latest_k < 20 or latest_d < 20:
        return "Green Zone: Oversold - Potential Buy Opportunity"

# Function to decide action based on zone
def decide_action(zone):
    if "Overbought" in zone:
        return "Consider Selling"
    elif "Oversold" in zone:
        return "Consider Buying"
    else:
        return "Hold"

# Updated function to log stock analysis
def log_stock_analysis(stock_name, price, latest_k, latest_d, zone, decision, file_name="trade_log.xlsx"):
    wb = openpyxl.load_workbook(file_name)
    ws = wb["Stock Analysis"]

    # Check if the stock already exists in the sheet
    stock_found = False
    for row in ws.iter_rows(min_row=2):
        if row[0].value == stock_name:
            # Update existing row
            row[1].value = price
            row[2].value = latest_k
            row[3].value = latest_d
            row[4].value = zone
            row[5].value = decision
            stock_found = True
            break

    if not stock_found:
        # Append new row
        ws.append([stock_name, price, latest_k, latest_d, zone, decision])

    wb.save(file_name)

# Updated function to log American Bull information
def log_american_bull_info(stock_name, signal, date, file_name="trade_log.xlsx"):
    wb = openpyxl.load_workbook(file_name)
    ws = wb["American Bull Info"]

    # Check if the stock already exists in the sheet
    stock_found = False
    for row in ws.iter_rows(min_row=2):
        if row[0].value == stock_name:
            # Update existing row
            row[1].value = signal
            row[2].value = date
            stock_found = True
            break

    if not stock_found:
        # Append new row
        ws.append([stock_name, signal, date])

    wb.save(file_name)

# Function to check if a trade already exists
def trade_exists(date, stock_name, action, file_name="trade_log.xlsx"):
    wb = openpyxl.load_workbook(file_name)
    ws = wb["Trade Log"]
    for row in ws.iter_rows(min_row=2, values_only=True):
        row_date, row_action, row_stock_name = row[0], row[1], row[2]
        if row_date == date and row_action == action and row_stock_name == stock_name:
            return True
    return False

# Function to log the buy or sell action
def log_trade(action, stock_name, price, shares, executed, zone, percent_value, file_name="trade_log.xlsx"):
    # Open the workbook and the worksheet
    wb = openpyxl.load_workbook(file_name)
    ws = wb["Trade Log"]

    # Get today's date
    today_date = get_todays_date()

    # Append new row with the trade data
    executed_status = "Yes" if executed else "No"
    ws.append([today_date, action, stock_name, price, shares, zone, percent_value, executed_status])

    # Save the workbook
    wb.save(file_name)

# Function to get today's date in mm/dd format
def get_todays_date():
    return datetime.today().strftime('%m/%d')
