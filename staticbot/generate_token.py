import requests
from firebase_admin import auth, credentials, firestore, initialize_app

# Initialize Firebase Admin SDK
service_account_path = "./app/serviceAccountKey.json"
cred = credentials.Certificate(service_account_path)
initialize_app(cred)

# Generate custom token
uid = "6uPQJBL00TPM42iUOJ3ZRWNvzhy1"
custom_token = auth.create_custom_token(uid).decode()

# Exchange custom token for ID token
api_key = "AIzaSyC12S5Bc0H3QLg7JHN8mmClAbrb0x1hNPM"
url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={api_key}"

response = requests.post(url, json={"token": custom_token, "returnSecureToken": True})
id_token = response.json().get("idToken")

print("ID Token:", id_token)