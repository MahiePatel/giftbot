from flask import Flask, render_template, request, jsonify
from groq import Groq
from dotenv import load_dotenv
import os
import json
import re

load_dotenv(override=True)
print("GROQ KEY LOADED:", bool(os.getenv("GROQ_API_KEY")))

app = Flask(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route("/ping")
def home():
    return "Server working!"

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/suggest", methods=["POST"])
def suggest():
    try:
        data = request.json

        recipient    = data.get("recipient", "")
        age          = data.get("age", "")
        location     = data.get("location", "")
        interests    = data.get("interests", "")
        occasion     = data.get("occasion", "")
        gift_type    = data.get("giftType", "either")
        budget       = data.get("budget", "₹500–₹1500")
        emotion      = data.get("emotion", 5)
        looks        = data.get("looks", 5)
        price_feel   = data.get("priceFeel", 5)
        know         = data.get("know", 5)

        print(f"DEBUG: Generating suggestions via Groq for {recipient} in {location}...")
        prompt = f"""You are an expert gift curator AND a product researcher.

A user wants gift ideas with these details:
- Recipient: {recipient}
- Age: {age}
- Location: {location}
- Interests: {interests}
- Occasion: {occasion}
- Gift Type: {gift_type}
- Budget: {budget}
- Emotional Value (1-10): {emotion}
- Aesthetics (1-10): {looks}
- Luxury Feel (1-10): {price_feel}
- Familiarity (1-10): {know}

You must return EXACTLY 3 gift ideas. 

CRITICAL RULE FOR `purchaseUrl`:
- If the gift is "Physical", generate an Amazon search URL (e.g. https://www.amazon.in/s?k=keyword).
- If the gift is an "Experience" (like a spa, art class, concert, restaurant), generate a Google Search URL to help them book it locally based on their Location (e.g., https://www.google.com/search?q=book+spa+session+in+Mumbai).

Return ONLY valid JSON with a root key "gifts". The exact format MUST look identically like this:
{{
  "gifts": [
    {{
      "name": "Gift Name",
      "reason": "Why this is perfect based on the traits",
      "price": "Estimated price",
      "type": "Physical or Experience",
      "match_score": 95,
      "tags": ["Unique", "Budget-friendly"],
      "purchaseUrl": "search URL as per the rule above"
    }}
  ]
}}
"""

        print("DEBUG: Calling Groq API...")
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        print("DEBUG: Received response from Groq API!")

        final_text = response.choices[0].message.content
        json_str = re.sub(r'```(?:json)?\n|```', '', final_text).strip()
        
        try:
            parsed = json.loads(json_str)
            gifts = parsed.get("gifts", [])
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}\nRaw Text: {final_text}")
            raise e

        # Ensure we send back up to 3
        return jsonify({"success": True, "gifts": gifts[:3]})

    except Exception as e:
        err_str = str(e)
        if "429" in err_str:
            return jsonify({"success": False, "error": "You've hit the Groq Rate Limit! Try again in a minute."}), 200
        else:
            print("Suggest Error:", err_str)
            return jsonify({"success": False, "error": err_str}), 500


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_message = data.get("message", "")
        chat_history = data.get("history", [])
        
        # Build messages for Groq standard OpenAI format
        messages = [
            {"role": "system", "content": "You are Spark, a helpful and friendly gift concierge. Keep your responses concise, engaging, and always focused on finding amazing gift ideas."}
        ]
        
        for msg in chat_history:
            # chat_history sends role 'user' or 'spark'. Groq expects 'user' or 'assistant'
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})
            
        messages.append({"role": "user", "content": user_message})

        print(f"DEBUG: Calling Groq Chat for Spark...")
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )
        print("DEBUG: Received Chat response!")
        
        reply_text = response.choices[0].message.content.strip()
        return jsonify({"success": True, "reply": reply_text})
        
    except Exception as e:
        err_str = str(e)
        print(f"ERROR in chat: {err_str}")
        return jsonify({"success": False, "error": err_str}), 500

if __name__ == "__main__":
    app.run(debug=True)