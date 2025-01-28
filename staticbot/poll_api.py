import os
import requests
import asyncio
import aiohttp
import json
import csv
import pandas as pd
from firebase_admin import auth, credentials, firestore, initialize_app

# Initialize Firebase Admin SDK
service_account_path = "./app/serviceAccountKey.json"
cred = credentials.Certificate(service_account_path)
initialize_app(cred)

# Base URL of the backend API
BASE_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')

def get_token():
    """
    Generate an ID token using Firebase Authentication
    """
    # Generate custom token
    uid = "6uPQJBL00TPM42iUOJ3ZRWNvzhy1"
    custom_token = auth.create_custom_token(uid).decode()

    # Exchange custom token for ID token
    api_key = "AIzaSyC12S5Bc0H3QLg7JHN8mmClAbrb0x1hNPM"
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"

    response = requests.post(url, json={"token": custom_token, "returnSecureToken": True})
    id_token = response.json().get("idToken")
    return id_token

def get_headers(token):
    """
    Generate headers with the ID token for API requests
    """
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def fetch_stocks():
    """
    Fetch stock list
    """
    token = get_token()
    headers = get_headers(token)
    print("Fetching stocks...")

    try:
        response = requests.get(f'{BASE_URL}/stocks', headers=headers)
        response.raise_for_status()
        stock_list = response.json().get('stocks', [])
        print("Stock list retrieved")
        return stock_list
    except requests.exceptions.RequestException as e:
        print(f"Error fetching stocks: {e}")
        return []

async def fetch_indexed_data():
    """
    Asynchronously fetch analysis data from multiple endpoints
    """
    token = get_token()
    headers = get_headers(token)

    async with aiohttp.ClientSession(headers=headers) as session:
        try:
            # Make parallel requests to all endpoints
            endpoints = [
                '/stock_analysis',
                '/american_bull_info',
                '/barchart_opinion_info',
                '/market_beat_info'
            ]
            tasks = [session.get(f'{BASE_URL}{endpoint}') for endpoint in endpoints]
            responses = await asyncio.gather(*tasks)

            # Parse the JSON responses
            analysis_data = await responses[0].json()
            american_bull_data = await responses[1].json()
            barchart_opinion_data = await responses[2].json()
            market_beat_data = await responses[3].json()

            print("Indexed data retrieved")
            return {
                "analysis_data": analysis_data,
                "american_bull_data": american_bull_data,
                "barchart_opinion_data": barchart_opinion_data,
                "market_beat_data": market_beat_data
            }
        except aiohttp.ClientError as e:
            print(f"Error fetching analysis data: {e}")
            return {}

def execute_analysis():
    """
    Execute analysis and retrieve the results
    """
    token = get_token()
    headers = get_headers(token)

    try:
        response = requests.post(f'{BASE_URL}/execute_analysis', headers=headers)
        response.raise_for_status()
        response_data = response.json()

        # Extract status message and analysis results
        status_message = response_data.get('status', 'No status provided.')
        results = response_data.get('results', [])

        print("Analysis data retrieved")
        return {
            "status": status_message,
            "results": results
        }
    except requests.exceptions.RequestException as e:
        print(f"Error executing analysis: {e}")
        return {
            "status": "Failed to execute analysis.",
            "results": []
        }

# Main function to run the stock bot
async def main():
    print("Fetching stocks...")
    stock_list = fetch_stocks()
    with open('./staticbot/cache/stock_list.json', 'w') as f:
        json.dump(stock_list, f)

    print("\nFetching analysis data...")
    indexed_data = await fetch_indexed_data()
    # Convert the indexed_data dictionary to a flat CSV
    with open('./staticbot/cache/indexed_data.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["category", "last_updated", "details"])  # Customize columns as needed

        for key, value in indexed_data.items():
            if isinstance(value, list):
                for item in value:
                    writer.writerow([key, item.get("Last Updated", ""), json.dumps(item)])
            else:
                writer.writerow([key, value.get("Last Updated", ""), json.dumps(value)])

    print("\nExecuting analysis...")
    analysis_data = execute_analysis()
    with open('./staticbot/cache/analysis_data.json', 'w') as f:
        json.dump(analysis_data, f)

# Run the main function
if __name__ == '__main__':
    asyncio.run(main())