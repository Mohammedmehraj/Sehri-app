# Bangalore Sehri Finder

A beautiful React.js + Tailwind CSS application to help users find Sehri (pre-dawn meals) in Bangalore during Ramadan. Connect with Masjids offering free Sehri, volunteer groups serving the community, and restaurants with early morning services.

## Features

✅ **Header with App Name** - Beautiful gradient header with branding  
✅ **Sehri Time Display** - Shows today's Sehri end time (Fajr) for Bangalore  
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
- Various locations across Bangalore

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

3. Start the development server:
```bash
npm start
```

4. Open your browser and visit: `http://localhost:3000`

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
Includes 9 providers across popular Bangalore locations:
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

The chatbot uses intelligent pattern matching to understand your questions and provide relevant, helpful responses.

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
