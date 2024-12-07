import requests
from bs4 import BeautifulSoup

def recommend_data():
    """Scrape recommended stock data from American Bulls website."""
    url = "https://www.americanbulls.com/Default.aspx?lang=en"

    response = requests.get(url)
    soup = BeautifulSoup(response.content, "lxml")

    # Find the table containing stock data
    table = soup.find("table", class_="table-hover")
    if not table:
        print("No table found on the page.")
        return []

    rows = table.find_all("tr", class_="gridRows")
    stock_data = []

    # Helper function to clean text
    def clean_text(text):
        return ' '.join(text.split()).strip()

    for row in rows:
        date = row.find("div", id=lambda x: x and "Tarih" in x)
        stock_name = row.find("a", class_="dxbs-hyperlink")
        signal = row.find("div", id=lambda x: x and "gridlevel" in x)
        buy_level = row.find("div", id=lambda x: x and "gridprice" in x)
        close_price = row.find("div", id=lambda x: x and "gridclose" in x)

        stock_data.append({
            "Date": clean_text(date.text) if date else "N/A",
            "Stock Name": clean_text(stock_name.text) if stock_name else "N/A",
            "Signal": clean_text(signal.text) if signal else "N/A",
            "Buy Level": clean_text(buy_level.text) if buy_level else "N/A",
            "Close Price": clean_text(close_price.text) if close_price else "N/A",
        })
    return stock_data

def specific_stock(stock_code):
    """Scrape specific stock data from American Bulls website."""
    url = f"https://www.americanbulls.com/SignalPage.aspx?lang=en&Ticker={stock_code}"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "lxml")

    table = soup.find("table", id="Content_SignalHistory_SignalShortHistoryGrid_DXMainTable")
    if table is None:
        print(f"Table not found for stock: {stock_code}")
        return []

    table_data = []
    for row in table.find("tbody").find_all("tr"):
        cells = row.find_all("td")
        if cells:
            table_data.append({
                "Date": cells[0].text.strip() if len(cells) > 0 else "N/A",
                "Price": cells[1].text.strip() if len(cells) > 1 else "N/A",
                "Signal": cells[2].text.strip() if len(cells) > 2 else "N/A",
                "Change%": cells[3].text.strip() if len(cells) > 3 else "N/A",
                "Value": cells[4].text.strip() if len(cells) > 4 else "N/A",
            })
    return table_data

# Example usage:
if __name__ == "__main__":
    data = specific_stock("IRS")
    print(data)
