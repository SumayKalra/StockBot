from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright 
from playwright.async_api import Playwright, async_playwright
from playwright_stealth import stealth_async
import asyncio
from dateutil import parser
from datetime import datetime
import json
import random
import os

def get_random_user_agent(file_path="user-agents.json"):
    """Loads user agents from a JSON file and returns a random user agent"""
    with open(file_path, "r") as file:
        user_agents = json.load(file)
    return random.choice(user_agents)

def calculate_delta_days(dayFiled, dayTraded):
    """Calculate the difference in days between two dates"""
    try:
        if not dayFiled or not dayTraded:
            raise ValueError(f"Missing date(s): dayFiled={dayFiled}, dayTraded={dayTraded}")
        
        # Normalize the date format
        filed_date = datetime.strptime(dayFiled.split(" ")[0], "%Y-%m-%d")  # Extract only the date part
        traded_date = datetime.strptime(dayTraded, "%Y-%m-%d")
        delta = (filed_date - traded_date).days
        return delta
    except Exception as e:
        print(f"Error calculating deltaDays: {e}")
        return None  # Return None if dates are invalid or calculation fails

def scrape_barchart_opinion(ticker : str) -> dict:
    '''fetches stock info from barchart based on the ticker entered by user'''
    #mark current data
    date = datetime.now().strftime("%B %d, %Y")

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
    #vary the browser context so that the user agent is randomized or rotated
    chosen_user_agent = get_random_user_agent()

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
            print(f"ERROR visiting {url} for {ticker} due to {str(e)}")
            allData.append({"ERROR": f"Could not fetch data for {ticker} due to {str(e)}"})
            continue

        #parse the html for target data
        soup = BeautifulSoup(html, "html.parser")
        main_div = soup.select_one("div.content-item.item-overview.item-gov.content-item-active")
        if main_div:
            rows = main_div.select("table tbody tr")
        else:
            rows = []

        #holds trade data for one stock
        trades = []

        #loop through all rows and extract data
        for row in rows:
            #check if this is a valid trade row by looking for the flex-column class
            if row.select_one("a.flex-column"):
                cells = row.find_all("td")
                if len(cells) >= 3:
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

        if trades:
            allData.append(trades)
        else:
            allData.append({"ERROR": f"No data found for {ticker}."})

    #save the session state for future use
    await context.storage_state(path="browser-session.json")

    #clean up browser and playwright instances
    await browser.close()
    await playwright.stop()
    return allData

async def scrape_market_beat(stocks: list) -> list:
    """Fetches stock data from the specified website based on the ticker entered by user"""
    # Get a random user agent
    chosen_user_agent = get_random_user_agent()

    playwright: Playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)

    if os.path.exists("browser-session.json"):
        context = await browser.new_context(
            user_agent=chosen_user_agent,
            storage_state="browser-session.json",
            viewport={"width": random.randint(800, 1920), "height": random.randint(400, 1080)}
        )
    else:
        context = await browser.new_context(
            user_agent=chosen_user_agent,
            viewport={"width": random.randint(800, 1920), "height": random.randint(400, 1080)}
        )
    
    page = await context.new_page()
    all_data = []

    for ticker in stocks:
        url = f"https://www.marketbeat.com/stocks/NASDAQ/{ticker}/"
        try:
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(random.uniform(2, 6))
            html = await page.content()
        except Exception as e:
            all_data.append({"ERROR": f"Could not fetch data for {ticker} due to {str(e)}"})
            continue

        soup = BeautifulSoup(html, "html.parser")
        faq_div = soup.select_one("div#marketRankAccordion")

        if faq_div:
            extracted_data = {}
            items = faq_div.select("div.faq-item-wrapper")

            for item in items:
                section = item.select_one("span.mr-title").get_text(strip=True)
                score = item.select_one("span.mr-score").get_text(strip=True)
                label = item.select_one("span.mr-stat-label").get_text(strip=True)
                value = item.select_one("span.mr-stat").get_text(strip=True)

                if section in [
                    "Analyst's Opinion",
                    "Earnings and Valuation",
                    "Short Interest",
                    "Dividend",
                    "Sustainability and ESG",
                    "News and Social Media",
                    "Company Ownership",
                ]:
                    extracted_data[section] = {
                        "score": score,
                        "label": label,
                        "value": value,
                    }

            all_data.append({ticker: extracted_data})
        else:
            all_data.append({ticker: "No data found"})

    await context.storage_state(path="browser-session.json")
    await browser.close()
    await playwright.stop()
    return all_data

async def scrape_insider_trades(stocks: list) -> list:
    """Fetches stock data from the specified website based on the ticker entered by user"""
    # Get a random user agent
    chosen_user_agent = get_random_user_agent()

    # Start Playwright
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)

    if os.path.exists("browser-session.json"):
        context = await browser.new_context(
            user_agent=chosen_user_agent,
            storage_state="browser-session.json",
            viewport={"width": random.randint(800, 1920), "height": random.randint(400, 1080)},
            bypass_csp=True  # Bypass Content Security Policy
        )
    else:
        context = await browser.new_context(
            user_agent=chosen_user_agent,
            viewport={"width": random.randint(800, 1920), "height": random.randint(400, 1080)},
            bypass_csp=True
        )
    
    # Apply stealth to the browser context
    page = await context.new_page()
    await stealth_async(page)

    all_data = []

    for ticker in stocks:
        url = f"http://openinsider.com/screener?s={ticker}&o=&pl=&ph=&ll=&lh=&fd=730&fdr=&td=0&tdr=&fdlyl=&fdlyh=&daysago=&xp=1&xs=1&vl=&vh=&ocl=&och=&sic1=-1&sicl=100&sich=9999&grp=0&nfl=&nfh=&nil=&nih=&nol=&noh=&v2l=&v2h=&oc2l=&oc2h=&sortcol=0&cnt=200&page=1"
        try:
            await page.goto(url)
            await page.wait_for_load_state('networkidle')

            html = await page.content()
        except Exception as e:
            all_data.append({"ERROR": f"Could not fetch data for {ticker} due to {str(e)}"})
            continue

        soup = BeautifulSoup(html, "html.parser")
        rows = soup.select("table tbody tr")

        trades = []
        for row in rows:
            cells = row.select("td")

            # Check if the row has enough columns to match the desired data
            if len(cells) < 12:  # Adjust this number based on the minimum columns you expect
                continue

            dayFiled = cells[1].select_one("a").get_text(strip=True) if cells[1].select_one("a") else None
            dayTraded = cells[2].get_text(strip=True) if cells[2] else None
            insiderName = cells[4].select_one("a").get_text(strip=True) if cells[4].select_one("a") else None
            title = cells[5].get_text(strip=True) if cells[5] else None
            action = cells[6].get_text(strip=True) if cells[6] else None
            price = cells[7].get_text(strip=True) if cells[7] else None
            quantity = cells[8].get_text(strip=True) if cells[8] else None
            sharesOwned = cells[9].get_text(strip=True) if cells[9] else None
            deltaOwn = cells[10].get_text(strip=True) if cells[10] else None
            value = cells[11].get_text(strip=True) if cells[11] else None
            deltaDays = calculate_delta_days(dayFiled, dayTraded)

            # Store the extracted data in a dictionary
            extracted_data = {
                "dayFiled": dayFiled,
                "dayTraded": dayTraded,
                "insiderName": insiderName,
                "title": title,
                "action": action,
                "price": price,
                "quantity": quantity,
                "sharesOwned": sharesOwned,
                "deltaOwn": deltaOwn,
                "value": value,
                "deltaDays" : deltaDays
            }

            if extracted_data["dayFiled"] is not None:
                trades.append(extracted_data)

        all_data.append({ticker: trades})

    await context.storage_state(path="browser-session.json")
    await browser.close()
    await playwright.stop()
    return all_data

if __name__ == "__main__":
    stocks = ["AAPL", "TSLA", "AMZN", "GOOG"]
    results = asyncio.run(scrape_insider_trades(stocks))
    
    # Save the results to a JSON file
    with open("insider_trades_results.json", "w") as file:
        json.dump(results, file, indent=4)
    
    print("Results have been saved to 'insider_trades_results.json'")