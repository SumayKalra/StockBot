import firebase_admin
from firebase_admin import credentials, firestore
import asyncio
import json
import poll_api

# Load and initialize Firestore Client - for future when we have a database
cred = credentials.Certificate("app/serviceAccountKey.json")
token = firebase_admin.initialize_app(cred, name="staticbot")
#db = firestore.client()

async def main(user_email : str):
    # Get data
    #data = get_stock_data(user_email)
    #with open("staticbot/cache/TestData.json", "r") as file:
        #data = json.load(file)
    
    data = await poll_api.fetch_indexed_data()

    # Repackage data
    repackaged = repackage_data(data)

    # Score each symbol
    results = {}
    for symbol, dat in repackaged.items():
        total_score = 0
        
        # A) Stock Analysis
        analysis = dat["analysis"]
        if analysis:
            total_score += score_zone(analysis["Zone"])
            total_score += score_analysis_decision(analysis["Decision"])
        
        # B) American Bull
        ab = dat["american_bull"]
        if ab:
            total_score += score_american_bull(ab["Signal"])

        # C) Barchart
        bc = dat["barchart"]
        if bc:
            total_score += score_barchart_opinion(bc["opinion"])

        # D) Market Beat
        mb = dat["market_beat"]
        if mb:
            total_score += score_market_beat(mb)

        recommendation = compute_recommendation(total_score)
        results[symbol] = {
            "Score": total_score,
            "Recommendation": recommendation
        }
    
    # Print final results
    print("FINAL RECOMMENDATIONS:")
    for sym, info in results.items():
        print(f"{sym}: Score={info['Score']}, Decision={info['Recommendation']}")

def get_stock_data(user_email: str):
    """
    Retrieve stock data from various indexers
    """
    data = {}
    indexers = ["stock_analysis", "american_bull_info", "barchart_opinion_info", "market_beat_info"]
    user_ref = db.collection("users").document(user_email)
    for entry in indexers:
        analysis_ref = user_ref.collection(entry)
        docs = analysis_ref.stream()
        results = []
        for d in docs:
            results.append(d.to_dict())
        data = {entry : results}
    return data

#REPACKAGE DATA INTO SAME FORMAT

def repackage_data(data_dict):
    """
    Repackage the data into a single dictionary keyed by stock symbol.
    """
    repackaged = {}

    def ensure_symbol(sym):
        """Helper to ensure there's a dictionary entry for each symbol."""
        if sym not in repackaged:
            repackaged[sym] = {
                "analysis": None,
                "american_bull": None,
                "barchart": None,
                "market_beat": None
            }

    # Merge Stock Analysis
    for item in data_dict.get("stock_analysis", []):
        symbol = item["Stock Name"].upper()
        ensure_symbol(symbol)
        repackaged[symbol]["analysis"] = item

    # Merge American Bull Info
    for item in data_dict.get("american_bull_info", []):
        symbol = item["Stock Name"].upper()
        ensure_symbol(symbol)
        repackaged[symbol]["american_bull"] = item

    # Merge Barchart Opinion Info
    for item in data_dict.get("barchart_opinion_info", []):
        symbol = item["ticker"].upper()
        ensure_symbol(symbol)
        repackaged[symbol]["barchart"] = item

    # Merge Market Beat Info
    for item in data_dict.get("market_beat_info", []):
        for key, val in item.items():
            symbol = key.upper()
            ensure_symbol(symbol)
            repackaged[symbol]["market_beat"] = val

    return repackaged


#SCORE ZONE

def score_zone(zone_text):
    """
    Basic scoring for Overbought / Oversold / Neutral zones.
    """
    zone_text = zone_text.lower()
    if "overbought" in zone_text:
        return -2
    elif "oversold" in zone_text:
        return +2
    else:
        # e.g. "Neutral Zone"
        return 0

def score_analysis_decision(decision):
    """
    Scoring for stock analysis table that says "Hold", "Consider Selling", "Consider Buying", etc.
    """
    dec = decision.lower()
    if "selling" in dec:
        return -1
    elif "buying" in dec:
        return +1
    elif "hold" in dec:
        return 0
    else:
        return 0

def score_american_bull(signal):
    """
    American Bull signals: "BUY", "SELL", "HOLD", etc.
    """
    sig = signal.upper()
    if sig == "BUY":
        return +2
    elif sig == "SELL":
        return -2
    else:
        return 0

def score_barchart_opinion(opinion_text):
    """
    Barchart opinion might be "80% Buy" or "60% Sell". 
    Over 60% => strongly bullish/bearish, between 30-60% => mildly bullish/bearish, otherwise neutral.
    """
    if "BUY" in opinion_text.upper():
        try:
            pct = opinion_text.split('%')[0].strip()
            pct_value = float(pct)
            if pct_value >= 60:
                return +2
            elif pct_value >= 30:
                return +1
            else:
                return 0
        except:
            return 0
    elif "SELL" in opinion_text.upper():
        try:
            pct = opinion_text.split('%')[0].strip()
            pct_value = float(pct)
            if pct_value >= 60:
                return -2
            elif pct_value >= 30:
                return -1
            else:
                return 0
        except:
            return 0

def floatable(val):
    """Helper to check if a string can be converted to float."""
    try:
        float(val)
        return True
    except:
        return False

def score_market_beat(mb_dict):
    """
    Market Beat dict might have:
      - "Analyst's Opinion" -> {...}
      - "Company Ownership" -> {...}
      - "Dividend" -> {...}
      - "Earnings and Valuation" -> {...}
      - "News and Social Media" -> {...}
      - "Short Interest" -> {...}
      - "Sustainability and ESG" -> {...}
    Parse each entry and assign +/- points.
    """
    total = 0

    # Analyst's Opinion
    if "Analyst's Opinion" in mb_dict:
        val = mb_dict["Analyst's Opinion"]["value"].lower()
        if "buy" in val:
            total += 2
        elif "hold" in val:
            total += 0
        elif "sell" in val or "underperform" in val:
            total -= 2

    # Company Ownership -> Insider Trading
    if "Company Ownership" in mb_dict:
        val = mb_dict["Company Ownership"]["value"].lower()
        if "buying" in val:
            total += 2
        elif "selling" in val:
            total -= 2

    # Dividend Strength
    if "Dividend" in mb_dict:
        val = mb_dict["Dividend"]["value"].lower()
        if "strong" in val:
            total += 1
        elif "weak" in val:
            total -= 1
        else:
            total += 0

    # Earnings and Valuation
    if "Earnings and Valuation" in mb_dict:
        val = mb_dict["Earnings and Valuation"]["value"].lower()
        # If there's a "%" we can parse it
        if "%" in val:
            try:
                number_str = val.replace("%", "").strip()
                if float(number_str) > 0:
                    total += 1
                else:
                    total -= 1
            except:
                pass

    # News and Social Media
    if "News and Social Media" in mb_dict:
        val = mb_dict["News and Social Media"]["value"].lower()
        # If numeric, interpret it. If text, check for "negative"/"positive".
        if "negative" in val:
            total -= 1
        elif "positive" in val:
            total += 1
        elif floatable(val):
            # Suppose a value > 0.5 is bullish
            if float(val) > 0.5:
                total += 1
            else:
                total += 0  # or -1 if < 0

    # Short Interest
    if "Short Interest" in mb_dict:
        val = mb_dict["Short Interest"]["value"].lower()
        if "healthy" in val or "low" in val:
            total += 1
        elif "high" in val:
            total -= 1

    # (Optionally parse Sustainability and ESG if relevant)

    return total

def compute_recommendation(final_score):
    """
    Decide final recommendation based on total_score.
      -2 to 2: HOLD
      3 or above: BUY
      -2 or below: SELL
    """
    if final_score >= 3:
        return "BUY"
    elif final_score <= -3:
        return "SELL"
    else:
        return "HOLD"

if __name__ == "__main__":
    asyncio.run(main("g"))