from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright 
from dateutil import parser
from datetime import datetime
import datetime
import json

def scrape_nancy_stock()->dict:
    with sync_playwright() as p:
        #launch headless browser
        browser = p.chromium.launch(headless = True)
        page = browser.new_page()

        #navigate to webpage
        url = "https://www.quiverquant.com/congresstrading/politician/Nancy%20Pelosi-P000197"
        page.goto(url)
    
        #wait for table to load
        page.wait_for_selector("table#tradeTable tbody")

        #get page contents
        html = page.content()

        #parse html
        soup = BeautifulSoup(html, "html.parser")

        #find trade table
        tradeTable = soup.find("table", {"id" : "tradeTable"})
        tbody = tradeTable.find("tbody")
        rows = tbody.find_all("tr")
        trades = []  #holds trade data

       # iterate through each row
        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 6:  # table has 6 columns
                continue
            
            # work through first cell to isolate ticker and company name
            ticker_div = cells[0].find("div", class_="flex-column")
            if ticker_div:
                ticker_tag = ticker_div.find("a", href=True)
                company_span = ticker_div.find_all("span")
                ticker = ticker_tag.get_text(strip=True) if ticker_tag else "N/A"
                company = company_span[0].get_text(strip=True) if len(company_span) > 0 else "N/A"
            else:
                ticker = "N/A"
                company = "N/A"
            
            # second cell: transaction type and amount
            transaction_div = cells[1].find("a", class_="flex-column")
            if transaction_div:
                transaction_type_tag = transaction_div.find("strong")
                amount_span = transaction_div.find("span")
                transaction_type = transaction_type_tag.get_text(strip=True) if transaction_type_tag else "N/A"
                transaction_amount = amount_span.get_text(strip=True) if amount_span else "N/A"
            else:
                transaction_type = "N/A"
                transaction_amount = "N/A"

            # parse file date and trade date
            dayFiled = cells[2].get_text(strip=True)
            dayFiled = parser.parse(dayFiled) if dayFiled else None

            dayTraded = cells[3].get_text(strip=True)
            dayTraded = parser.parse(dayTraded) if dayTraded else None

            # calculate delay between stock traded and trade reported
            daysDiff = (dayFiled - dayTraded).days if (dayFiled and dayTraded) else None

            # get % change (column index 5)
            gainOrLoss = cells[5].get_text(strip=True)
            gainOrLoss = gainOrLoss if gainOrLoss != "-" else "N/A"

            # store gathered data in dictionary
            trades.append({
                'ticker': ticker,
                'company': company,
                'transaction_type': transaction_type,
                'transaction_amount': transaction_amount,
                'file_date': dayFiled.isoformat() if dayFiled else None,
                'trade_date': dayTraded.isoformat() if dayTraded else None,
                'delay_in_days': daysDiff,
                'gain_or_loss': gainOrLoss
            })
        
        browser.close()
    return trades

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