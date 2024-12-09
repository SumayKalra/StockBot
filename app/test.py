import robin_stocks.robinhood as r
import pyotp

# Your provided credentials
username = "sumaykalra@gmail.com"
password = "#Sk191091817"

response = r.login(username, password, store_session=False)

investment_profile = r.load_account_profile()
print(investment_profile)
