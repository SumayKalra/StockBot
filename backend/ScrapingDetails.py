import requests
from bs4 import BeautifulSoup
def recommmend_data():
    # URL of the page to scrape
    url = "https://www.americanbulls.com/Default.aspx?lang=en"  # Replace with the correct URL

    # Send a request to fetch the page content
    response = requests.get(url)

    # Parse the page content with BeautifulSoup
    soup = BeautifulSoup(response.content, "lxml")

    # Find the table that contains the stock data
    table = soup.find("table", class_="table-hover")

    # Extract all rows (tr elements) with class "gridRows"
    rows = table.find_all("tr", class_="gridRows")

    # List to store extracted and cleaned stock data
    stock_data = []

    # Function to clean the text data
    def clean_text(text):
        return ' '.join(text.split()).replace("\n", "").replace("\r", "").strip()

    # Loop through each row and extract relevant data
    for row in rows:
        # Extract data from the relevant div or td elements and clean it up
        date = row.find("div", id=lambda x: x and "Tarih" in x).text if row.find("div", id=lambda x: x and "Tarih" in x) else "N/A"
        date = clean_text(date)

        stock_name = row.find("a", class_="dxbs-hyperlink").text if row.find("a", class_="dxbs-hyperlink") else "N/A"
        stock_name = clean_text(stock_name)

        signal = row.find("div", id=lambda x: x and "gridlevel" in x).text if row.find("div", id=lambda x: x and "gridlevel" in x) else "N/A"
        signal = clean_text(signal)

        buy_level = row.find("div", id=lambda x: x and "gridprice" in x).text if row.find("div", id=lambda x: x and "gridprice" in x) else "N/A"
        buy_level = clean_text(buy_level)

        close_price = row.find("div", id=lambda x: x and "gridclose" in x).text if row.find("div", id=lambda x: x and "gridclose" in x) else "N/A"
        close_price = clean_text(close_price)
        
        # Store the cleaned data in a dictionary
        stock_data.append({
            "Date": date,
            "Stock Name": stock_name,
            "Signal": signal,
            "Buy Level": buy_level,
            "Close Price": close_price
        })

    # Print the cleaned and formatted stock data
    return stock_data

import requests
from bs4 import BeautifulSoup

def specifc_stock(stock_code):
    url = f"https://www.americanbulls.com/SignalPage.aspx?lang=en&Ticker={stock_code}" 

    # Send a request to fetch the page content
    response = requests.get(url)

    # Parse the page content with BeautifulSoup
    soup = BeautifulSoup(response.content, "lxml")

    # Find the table by its id
    table = soup.find("table", id="Content_SignalHistory_SignalShortHistoryGrid_DXMainTable")

    # Check if the table was found
    if table is None:
        print(f"Table not found for stock: {stock_code}")
        return []

    # List to store extracted table data
    table_data = []

    # Loop through each row in the table body (tr elements)
    for row in table.find("tbody").find_all("tr"):
        # Extract each cell in the row (td elements)
        cells = row.find_all("td")
        
        # Clean and extract the text from each cell
        if len(cells) > 0:
            date = cells[0].text.strip() if len(cells) > 0 else "N/A"
            price = cells[1].text.strip() if len(cells) > 1 else "N/A"
            signal = cells[2].text.strip() if len(cells) > 2 else "N/A"
            change = cells[3].text.strip() if len(cells) > 3 else "N/A"
            value = cells[4].text.strip() if len(cells) > 4 else "N/A"

            # Append the row data as a dictionary
            print(date)
            table_data.append({
                "Date": date,
                "Price": price,
                "Signal": signal,
                "Change%": change,
                "Value": value
            })

    # Return the extracted table data
    return table_data


specifc_stock("IRS")