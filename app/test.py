import robin_stocks.robinhood as r
import pyotp

# Hardcoded credentials
username = "sumaykalra@gmail.com"
password = "#Sk191091817"

# Replace this with your actual TOTP secret key from Robinhood
totp_secret = "V6DUXYYMZGI45CQ2"  # Obtain this from Robinhood's setup for 2FA

def login_to_robinhood():
    try:
        # Generate the current TOTP code
        totp = pyotp.TOTP(totp_secret).now()
        
        # Attempt login with credentials and TOTP
        response = r.login(username, password, mfa_code=totp, store_session=False)
        account_profile = r.profiles.load_account_profile()
        print(account_profile)
        return response
    except Exception as e:
        print("Error during login:", str(e))
        return None


# Main execution
if __name__ == "__main__":
    login_response = login_to_robinhood()
    
