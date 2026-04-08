# 🎁 GiftBot — AI-Powered Gift Finder

A full-stack web app that uses **Claude AI** to suggest personalised gifts and fetches **real Amazon.in product links** using web search.

---

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Python + Flask
- **AI:** Anthropic Claude API (with web search tool)
- **Shopping:** Amazon.in real product links

---

## Setup & Run

### 1. Clone / download the project

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Set your Anthropic API key
```bash
# Mac/Linux
export ANTHROPIC_API_KEY=your_api_key_here

# Windows
set ANTHROPIC_API_KEY=your_api_key_here
```
Get your API key at: https://console.anthropic.com

### 4. Run the app
```bash
python app.py
```

### 5. Open in browser
```
http://localhost:5000
```

---

## Project Structure

```
giftbot/
├── app.py                  # Flask backend + Claude API
├── requirements.txt
├── README.md
├── templates/
│   └── index.html          # Main webpage
└── static/
    ├── css/
    │   └── style.css       # All styling
    └── js/
        └── main.js         # Frontend logic
```

---

## Features

- Full-page form with fields for recipient, age, interests, occasion
- Toggle buttons for gift type and budget
- 4 sliders: emotional value, aesthetics, luxury feel, how well you know them
- Claude AI generates 5 personalised gift ideas
- Real Amazon.in product links fetched via Claude's web search
- Animated loading screen with step indicators
- Fully responsive design

---

Built by **Mahi Patel** · BSc Data Science, Gujarat University
