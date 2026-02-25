# sehrifinder

A beautiful React.js + Tailwind CSS application to help users find Sehri (pre-dawn meals) across India during Ramadan. Connect with Masjids offering free Sehri, volunteer groups serving the community, and restaurants with early morning services.

## Features

✅ **Header with App Name** - Beautiful gradient header with branding  
✅ **Sehri Time Display** - Shows today's Sehri end time (Fajr) for your configured location in India  
✅ **Dynamic Prayer Times** - Real-time prayer times via Aladhan API  
✅ **Search Functionality** - Filter providers by location  
✅ **Card Layout** - Beautiful card-based display of Sehri providers  
✅ **Multiple Provider Types** - Masjids (🕌), Volunteers (🤝), and Restaurants (🍽️)  
✅ **Free & Paid Options** - Clearly marked pricing information  
✅ **Mobile Responsive** - Works perfectly on all devices  
✅ **Tailwind CSS** - Styled with utility-first CSS framework  
✅ **Mock Data** - 9 sample providers with realistic information  
✅ **Google Maps Integration** - Direct navigation to providers  
✅ **WhatsApp Sharing** - Share provider details easily  
✅ **Request Form** - Community-driven submission system  
✅ **Navigation Menu** - Home, Live Stream, Request Sehri, and About Us sections  
✅ **Live Streams** - 24/7 live feeds from Makkah and Madinah
✅ **AI Chatbot** - Interactive assistant for Sehri, prayer times, and Ramadan queries
✅ **Visitor Counter** - Track total visitors to the platform

## Provider Information Displayed

Each provider card shows:
- Provider name and type (Masjid/Volunteer/Restaurant)
- Pricing (Free or Paid)
- Location and full address
- Rating
- Opening time for Sehri
- Food offered
- Google Maps link
- WhatsApp share button

## Sehri Provider Types

### 🕌 Masjids
- Community Masjids offering free Sehri
- Traditional meals with dates, tea, and main dishes
- Open to all community members

### 🤝 Volunteer Groups
- Community-run kitchens
- Home-cooked meals
- Free service by volunteers
- Various locations across India

### 🍽️ Restaurants
- Small restaurants and eateries
- Paid services
- Variety of cuisines
- Early morning opening times

## Installation

1. Navigate to the project directory:
```bash
cd "c:\Users\Muhammed mehraj\Desktop\New folder (2)\New folder"
```

2. Install dependencies:
```bash
npm install
```

3. Create your local environment file:
```bash
copy .env.example .env
```

4. Install Python API dependencies:
```bash
env\Scripts\python.exe -m pip install -r requirements.txt
```

5. Start the API server:
```bash
env\Scripts\python.exe -m uvicorn api.index:app --reload --port 8000
```

6. In another terminal, start the frontend:
```bash
npm start
```

7. Open your browser and visit: `http://localhost:3000`

## Vercel Deployment

1. Import the repository into Vercel.
2. Set these environment variables in Vercel Project Settings:
	- `REACT_APP_CHATBOT_API_URL` (optional): `/api/chat` for same-project deployment
	- `REACT_APP_PROVIDERS_API_URL` (optional): `/api/providers` for same-project deployment
	- `REACT_APP_PROVIDER_SUBMISSIONS_API_URL` (optional): `/api/providers/submissions`
	- `REACT_APP_ADMIN_PROVIDER_SUBMISSIONS_API_URL` (optional): `/api/admin/provider-submissions`
	- `REACT_APP_ADMIN_SEHRI_REQUESTS_API_URL` (optional): `/api/admin/sehri-requests`
	- `REACT_APP_AUTH_API_URL` (optional): `/api/auth` for same-project deployment
	- `REACT_APP_SEHRI_REQUESTS_API_URL` (optional): `/api/sehri-requests` for same-project deployment
	- `REACT_APP_PROVIDERS_PAGE_SIZE` (optional): default `12`
	- `REACT_APP_PRAYER_LATITUDE` (optional): default `28.6139` (New Delhi)
	- `REACT_APP_PRAYER_LONGITUDE` (optional): default `77.2090` (New Delhi)
	- `OPENROUTER_API_KEY` (required for chatbot): OpenRouter API key
	- `OPENROUTER_MODEL` (optional): defaults to `liquid/lfm-2.5-1.2b-instruct:free`
	- `OPENROUTER_BASE_URL` (optional): defaults to `https://openrouter.ai/api/v1`
	- `OPENROUTER_SITE_URL` (optional): site URL sent in request headers
	- `OPENROUTER_APP_NAME` (optional): app name sent in request headers
	- `MONGODB_URI` (required): MongoDB connection string
	- `MONGODB_DB_NAME` (optional): if omitted, API auto-detects a DB with providers
	- `MONGODB_PROVIDERS_COLLECTION` (optional): defaults to `providers` (case-insensitive)
	- `MONGODB_PROVIDER_SUBMISSIONS_COLLECTION` (optional): defaults to `provider_submissions`
	- `MONGODB_USERS_COLLECTION` (optional): defaults to `users`
	- `MONGODB_SESSIONS_COLLECTION` (optional): defaults to `auth_sessions`
	- `MONGODB_SEHRI_REQUESTS_COLLECTION` (optional): defaults to `sehri_requests`
	- `ADMIN_EMAILS` (optional for admin approvals): comma-separated admin emails (for example: `owner@example.com,ops@example.com`)
	- `ADMIN_EMAILS1`, `ADMIN_EMAILS2` (optional): set admin emails as separate variables
	- `AUTH_SECRET_KEY` (required for auth): random secret used to sign session token hashes
	- `AUTH_SESSION_DAYS` (optional): defaults to `7`
3. Deploy. This project serves frontend and Python API from `api/index.py` in one Vercel project.

### API Endpoints (Vercel)

- `GET /api/hello` -> `{ "message": "Hello World" }`
- `POST /api/chat` -> OpenRouter-backed chat response `{ "response": "..." }`
- `GET /api/health` -> `{ "status": "ok" }`
  - Includes `database`, `runtime`, and non-secret `config` flags to help diagnose Vercel env setup.
- `GET /api/providers` -> paginated providers from MongoDB
  - Query params: `page` (default `1`), `page_size` (default `12`), `location` (optional)
- `GET /api/providers/all` -> all raw provider documents from MongoDB
- `POST /api/providers/submissions` -> submit a new provider for admin review
- `GET /api/admin/provider-submissions` -> admin-only list of provider submissions (filter by `status`)
- `PATCH /api/admin/provider-submissions/{submission_id}` -> admin-only approve/reject action
- `GET /api/admin/sehri-requests` -> admin-only list of Sehri requests (supports `status` filter + pagination)
- `PATCH /api/auth/profile` -> update logged-in user basic profile fields
- `POST /api/sehri-requests` -> creates a Sehri support request in MongoDB (guest and authenticated submissions supported)

## Technologies Used

- **React.js** - JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - useState for search functionality

## Features in Detail

### Search Bar
- Real-time filtering by location
- Case-insensitive search
- Shows count of filtered results

### Responsive Design
- Mobile-first approach
- Grid layout adapts from 1 column (mobile) to 4 columns (desktop)
- Touch-friendly interface

### Mock Provider Data
Includes 9 providers across sample locations in India:
- Shivajinagar (Masjid)
- Frazer Town (Volunteer)
- Koramangala (Restaurant & Masjid)
- Indiranagar (Masjid)
- Jayanagar (Volunteer)
- Banashankari (Restaurant)
- HSR Layout (Volunteer)
- Whitefield (Restaurant)

## Live Stream Feature

### 🕋 Makkah Live Stream
- 24/7 live feed from Masjid al-Haram
- View of the Holy Kaaba
- Watch prayers and Tawaf in real-time

### 🕌 Madinah Live Stream
- 24/7 live feed from Masjid an-Nabawi
- View of the Prophet's Mosque
- Experience Taraweeh prayers during Ramadan

The live streams are embedded from MakkahLive.net, providing authentic 24/7 views of the blessed Haramain.

## Chatbot Assistant

### 🤖 Features
- **Instant Answers**: Get immediate responses to common questions
- **Prayer Times**: Ask about Fajr, Maghrib, or any prayer time
- **Sehri Information**: Find out about free/paid providers and locations
- **Location Search**: Get help finding providers in specific areas
- **Ramadan Tips**: Receive advice and reminders for Ramadan
- **24/7 Available**: Always ready to assist you

### What You Can Ask
- "When does Sehri end today?"
- "What time is Iftar?"
- "Where can I find free Sehri?"
- "Show me prayer times"
- "How do I add a new location?"
- "Tell me about live streams"

The chatbot is powered by OpenRouter and responds to user prompts with short, context-aware answers.

## Visitor Counter

### 📊 Features
- **Persistent Count**: Tracks total visitors using localStorage
- **Daily Tracking**: Counts unique visits per day (one count per user per day)
- **Visual Display**: Shows in footer with eye icon and formatted numbers
- **Green Highlight**: Visitor count displayed in attractive green color
- **No Backend Required**: Works entirely in the browser
- **Privacy Friendly**: No personal data collected, only anonymous count

The counter increments once per user per day, ensuring accurate daily visitor tracking without duplicate counts.

## Future Enhancements

- Integration with real provider database
- Dynamic Sehri time calculation based on location
- User reviews and ratings
- Map integration with multiple locations
- Filter by provider type (Masjid/Volunteer/Restaurant)
- Sort by rating, distance, or opening time
- Donation feature for free Sehri providers
- Multi-language support (Urdu, Kannada)

## License

Free to use for the community during Ramadan and beyond.


