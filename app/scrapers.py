from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright 
from playwright.async_api import Playwright, async_playwright
import asyncio
from dateutil import parser
from datetime import datetime
import datetime
import json
import random
import os

def scrape_barchart_opinion(ticker : str) -> dict:
    '''fetches stock info from barchart based on the ticker entered by user'''
    #mark current data
    date = datetime.datetime.now().strftime("%B %d, %Y")

    #construct url
    url = f"https://www.barchart.com/stocks/quotes/{ticker}/opinion"

    #set real browser User-Agent to evade attempts at blocking bots
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    with sync_playwright() as p:
        #start browser
        browser = p.chromium.launch(headless=True) 
        #create browser context with User-Agent and viewport to mimic real users
        context = browser.new_context(user_agent=USER_AGENT, viewport={"width": 1280, "height": 720})  
        #open a new page
        page = context.new_page()

        #get data of stock from barchart
        try:
            #navigate to the url with a timeout and wait until domcontentloaded
            page.goto(url, timeout=60000, wait_until="domcontentloaded")
            #wait 5 seconds for content to settle
            #page.wait_for_timeout(5000)          #works for now, uncomment if needed
            #get the full page content
            html = page.content()
        except Exception as e:
            #handle exceptions and print an error message
            print(f"Error fetching data: {e}")
            html = None
        finally:
            #close the browser
            browser.close()

    #if data could not be fetched, set flag accordingly
    if html == None:
        success = False #flag 

    #parse and find data target
    soup = BeautifulSoup(html, "html.parser") #parse html content
    target_data = soup.find("div", {"class": "note-button"}) #find the target div by class name

    #extract the data
    if target_data:
        #find the first <a> tag within the target div
        a_tag = target_data.find("a")
        if a_tag and a_tag.has_attr("data-symbol"):
            #parse the JSON-like string in data-symbol
            data_symbol = a_tag["data-symbol"]
            crude_data = json.loads(data_symbol) #convert JSON string to a Python dictionary

            #extract required fields into variables
            company = crude_data.get("symbolName")
            lastPrice = crude_data.get("lastPrice")
            percentChange = crude_data.get("percentChange")
            priceChange = crude_data.get("priceChange")
            opinion = crude_data.get("opinion")

            #store the extracted data in a dictionary
            clean_data = {
                "ticker" : ticker,
                "company": company,
                "lastPrice": lastPrice,
                "percentChange": percentChange,
                "priceChange": priceChange,
                "opinion": opinion,
                "date" : date}

            #set flag
            success = True
        else:
            #handle case where <a> tag or data-symbol attribute is missing
            print("No valid <a> tag or 'data-symbol' attribute found.")
            success = False
    else:
        #handle case where target div is not found
        print("Target not found.")
        success = False
    
    #if process fails, return empty dictionary
    if success:
        return clean_data
    else:
        return {}
    
async def scrape_congress_trades(stocks: list) -> list:
    '''Fetches congress trading data from quiverquant.com based on the ticker entered by user'''

    logfile = open("logs.txt", "w")

    #vary the browser context so that the user agent is randomized or rotated
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64; rv:110.0) Gecko/20100101 Firefox/110.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.88 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15",
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0",
        "Mozilla/5.0 (Linux; Android 13; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    ]
    chosen_user_agent = random.choice(USER_AGENTS)

    #initialize playwright
    playwright: Playwright = await async_playwright().start()  # Start Playwright explicitly
    browser = await playwright.chromium.launch(headless=True)  # Launch the browser

    #add in ways to retain and reuse session cookies so subsequent requests look more like a regular user session
    #use storage_state to store/reuse cookies and other session data.
    #if "browser-session.json" exists, use it. if not, a new session context is created.
    if os.path.exists("browser-session.json"):
        context = await browser.new_context(
            user_agent=chosen_user_agent,
            storage_state="browser-session.json",  #load existing session state
            viewport={"width": random.randint(800, 1920), "height": random.randint(400, 1080)}
        )
    else:
        context = await browser.new_context(
            user_agent=chosen_user_agent,
            viewport={"width": random.randint(800, 1920), "height": random.randint(400, 1080)}
        )

    page = await context.new_page()

    allData = []
    for ticker in stocks:
        #construct url
        url = f"https://www.quiverquant.com/stock/{ticker}/government/"

        #handle errors better
        try:
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(random.uniform(2, 6))  #adjust this if needed
            html = await page.content()
        except Exception as e:
            #log the error and continue to the next ticker
            logfile.write(f"ERROR visiting {url} for {ticker} due to {str(e)}\n")
            print(f"ERROR visiting {url} for {ticker} due to {str(e)}")
            allData.append({"ERROR": f"Could not fetch data for {ticker} due to {str(e)}"})
            continue

        if html:
            print(ticker, "HTML CHECK: OK")
        else:
            print(ticker, "HTML CHECK: FAILED")

        #parse the html for target data
        soup = BeautifulSoup(html, "html.parser")
        main_div = soup.select_one("div.content-item.item-overview.item-gov.content-item-active")
        if main_div:
            print(ticker, "ROWS CHECK: OK")
            rows = main_div.select("table tbody tr")
        else:
            print(ticker, "ROWS CHECK: FAILED")
            logfile.write(ticker)
            logfile.write("\n")
            logfile.write(soup.prettify())
            logfile.write("\n\n\n")
            rows = []

        #holds trade data for one stock
        trades = []

        loop = 0
        #loop through all rows and extract data
        for row in rows:
            loop += 1
            #check if this is a valid trade row by looking for the flex-column class
            if row.select_one("a.flex-column"):
                if loop == 1:
                    print(ticker, "FLEX COLUMN CHECK: OK")
                cells = row.find_all("td")
                if len(cells) >= 3:
                    if loop == 1:
                        print(ticker, "DATA CHECK: OK")
                    name = cells[0].find("span").get_text(strip=True) if cells[0].find("span") else "N/A"
                    action = cells[1].find("span", class_="positive") or cells[1].find("span", class_="sale")
                    action = action.get_text(strip=True) if action else "N/A"
                    amount_span = cells[1].find("span", class_="font-12")
                    amount = amount_span.get_text(strip=True) if amount_span else "N/A"
                    date = cells[2].get_text(strip=True)

                    trades.append({
                        "ticker": ticker,
                        "name": name,
                        "action": action,
                        "amount": amount,
                        "date": date
                    })
                else:
                    print(ticker, "DATA CHECK: FAILED")
            else:
                print(ticker, "FLEX COLUMN CHECK: FAILED")

        if trades:
            print(ticker, "FINAL CHECK: OK")
            allData.append(trades)
        else:
            print(ticker, "FINAL CHECK: FAILED")
            allData.append({"ERROR": f"No data found for {ticker}."})

    #save the session state for future use
    await context.storage_state(path="browser-session.json")

    #clean up browser and playwright instances
    await browser.close()
    await playwright.stop()

    logfile.close()
    return allData