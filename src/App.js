import React, { useState, useEffect, useCallback, useRef } from 'react';

// Mock Sehri providers data (Masjids, Volunteers, Restaurants)
const mockProviders = [
  {
    id: 1,
    name: "Jamia Masjid",
    type: "Masjid",
    location: "Shivajinagar",
    address: "Mosque Road, Shivajinagar",
    opens: "3:00 AM",
    foodType: "Biryani, Chai, Dates",
    pricing: "Free",
    image: "🕌"
  },
  {
    id: 2,
    name: "Al-Huda Community Kitchen",
    type: "Volunteer",
    location: "Frazer Town",
    address: "Near Frazer Town Circle",
    opens: "2:30 AM",
    foodType: "Home-cooked meals, Fruits",
    pricing: "Free",
    image: "🤝"
  },
  {
    id: 3,
    name: "Empire Restaurant",
    type: "Restaurant",
    location: "Koramangala",
    address: "Church Street, Koramangala 1st Block",
    opens: "3:00 AM",
    foodType: "Mughlai, Biryani",
    pricing: "Paid",
    image: "🍛"
  },
  {
    id: 4,
    name: "Bilal Masjid Community Sehri",
    type: "Masjid",
    location: "Indiranagar",
    address: "100 Feet Road, Indiranagar",
    opens: "3:30 AM",
    foodType: "Porridge, Bread, Chai",
    pricing: "Free",
    image: "🕌"
  },
  {
    id: 5,
    name: "Friends of Ramadan",
    type: "Volunteer",
    location: "Jayanagar",
    address: "9th Block, Jayanagar",
    opens: "3:00 AM",
    foodType: "Traditional Sehri meals",
    pricing: "Free",
    image: "🤝"
  },
  {
    id: 6,
    name: "Mehfil Small Eatery",
    type: "Restaurant",
    location: "Banashankari",
    address: "IIMB Road, Banashankari",
    opens: "3:30 AM",
    foodType: "South Indian, Parathas",
    pricing: "Paid",
    image: "🍽️"
  },
  {
    id: 7,
    name: "Masjid-e-Khadija",
    type: "Masjid",
    location: "Koramangala",
    address: "4th Block, Koramangala",
    opens: "2:45 AM",
    foodType: "Biryani, Fruits, Juice",
    pricing: "Free",
    image: "🕌"
  },
  {
    id: 8,
    name: "Sehri Seva Volunteers",
    type: "Volunteer",
    location: "HSR Layout",
    address: "Sector 2, HSR Layout",
    opens: "3:15 AM",
    foodType: "Mixed meals, Sweets",
    pricing: "Free",
    image: "🤝"
  },
  {
    id: 9,
    name: "Al-Baik Small Restaurant",
    type: "Restaurant",
    location: "Whitefield",
    address: "ITPL Main Road, Whitefield",
    opens: "3:00 AM",
    foodType: "Arabic, Shawarma",
    pricing: "Paid",
    image: "🥙"
  }
];

function App() {
  const [searchLocation, setSearchLocation] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeSection, setActiveSection] = useState('home'); // 'home', 'about', 'livestream'
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Assalamu Alaikum! 🌙 I\'m here to help you with Sehri information, prayer times, and Ramadan queries. How can I assist you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null);
  const [visitorCount, setVisitorCount] = useState(0);
  const [formData, setFormData] = useState({
    providerName: '',
    providerType: 'Masjid',
    location: '',
    address: '',
    phoneNumber: '',
    opensAt: '',
    foodType: '',
    pricing: 'Free',
    additionalInfo: ''
  });
  
  const calculateNextPrayer = useCallback((timings) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Fajr (Sehri Ends)', time: timings.Fajr, icon: '🌅' },
      { name: 'Sunrise', time: timings.Sunrise, icon: '☀️' },
      { name: 'Dhuhr', time: timings.Dhuhr, icon: '🕌' },
      { name: 'Asr', time: timings.Asr, icon: '🌤️' },
      { name: 'Maghrib (Iftar)', time: timings.Maghrib, icon: '🌆' },
      { name: 'Isha', time: timings.Isha, icon: '🌙' }
    ];

    for (let prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      if (prayerMinutes > currentTime) {
        const timeUntil = prayerMinutes - currentTime;
        const hoursUntil = Math.floor(timeUntil / 60);
        const minutesUntil = timeUntil % 60;
        setNextPrayer({
          ...prayer,
          timeUntil: `${hoursUntil}h ${minutesUntil}m`
        });
        return;
      }
    }
    
    // If no prayer found today, next is Fajr tomorrow
    setNextPrayer({
      name: 'Fajr (Sehri Ends)',
      time: timings.Fajr,
      icon: '🌅',
      timeUntil: 'Tomorrow'
    });
  }, []);
  
  // Fetch prayer times for Bangalore
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        // Bangalore coordinates: 12.9716, 77.5946
        const response = await fetch(
          'https://api.aladhan.com/v1/timings?latitude=12.9716&longitude=77.5946&method=2'
        );
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
          setPrayerTimes(data.data.timings);
          calculateNextPrayer(data.data.timings);
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
        // Fallback to static times if API fails
        const fallbackTimes = {
          Fajr: '05:35',
          Sunrise: '06:45',
          Dhuhr: '12:30',
          Asr: '16:00',
          Maghrib: '18:45',
          Isha: '20:00'
        };
        setPrayerTimes(fallbackTimes);
        calculateNextPrayer(fallbackTimes);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [calculateNextPrayer]);

  // Update next prayer every minute
  useEffect(() => {
    if (!prayerTimes) return;
    
    const interval = setInterval(() => {
      calculateNextPrayer(prayerTimes);
    }, 60000);

    return () => clearInterval(interval);
  }, [prayerTimes, calculateNextPrayer]);
  
  // Auto-scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Visitor counter
  useEffect(() => {
    // Get current count from localStorage
    const currentCount = parseInt(localStorage.getItem('bangaloreSehriFinder_visitorCount') || '0');
    const hasVisitedToday = localStorage.getItem('bangaloreSehriFinder_visitedToday');
    const today = new Date().toDateString();
    
    // Increment count if it's a new day or first visit
    if (hasVisitedToday !== today) {
      const newCount = currentCount + 1;
      localStorage.setItem('bangaloreSehriFinder_visitorCount', newCount.toString());
      localStorage.setItem('bangaloreSehriFinder_visitedToday', today);
      setVisitorCount(newCount);
    } else {
      setVisitorCount(currentCount);
    }
  }, []);
  
  // Get today's date
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Filter providers based on search
  const filteredProviders = mockProviders.filter(provider =>
    provider.location.toLowerCase().includes(searchLocation.toLowerCase())
  );

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, this would send data to a backend
    console.log('Sehri Provider Request Submitted:', formData);
    
    // Show success message (you could use a toast library here)
    alert(`Thank you! We've received your request for "${formData.providerName}". We'll review and add it to our list soon!`);
    
    // Reset form
    setFormData({
      providerName: '',
      providerType: 'Masjid',
      location: '',
      address: '',
      phoneNumber: '',
      opensAt: '',
      foodType: '',
      pricing: 'Free',
      additionalInfo: ''
    });
    
    setShowRequestForm(false);
  };

  // Handle chatbot message
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);

    // Call backend API for bot response
    fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: chatInput })
    })
    .then(response => response.json())
    .then(data => {
      if (data.response) {
        setChatMessages(prev => [...prev, { type: 'bot', text: data.response }]);
      } else if (data.error) {
        setChatMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
      }
    })
    .catch(error => {
      console.error('Chatbot error:', error);
      setChatMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I\'m having trouble connecting. Please refresh and try again.' }]);
    });

    setChatInput('');
  };

  // Generate bot responses
  const generateBotResponse = (input) => {
    if (input.includes('sehri') || input.includes('time') && input.includes('end')) {
      return `Today's Sehri ends at ${prayerTimes?.Fajr || '5:35 AM'} (Fajr time). Make sure to finish eating and drinking before this time! 🌅`;
    } else if (input.includes('iftar') || input.includes('break') && input.includes('fast')) {
      return `Today's Iftar time is at ${prayerTimes?.Maghrib || '6:45 PM'} (Maghrib time). May Allah accept your fast! 🌆`;
    } else if (input.includes('prayer') || input.includes('salah') || input.includes('namaz')) {
      if (!prayerTimes) return 'Loading prayer times...';
      return `Today's prayer times for Bangalore:\n🌅 Fajr: ${prayerTimes.Fajr}\n☀️ Sunrise: ${prayerTimes.Sunrise}\n🕌 Dhuhr: ${prayerTimes.Dhuhr}\n🌤️ Asr: ${prayerTimes.Asr}\n🌆 Maghrib: ${prayerTimes.Maghrib}\n🌙 Isha: ${prayerTimes.Isha}`;
    } else if (input.includes('free') || input.includes('masjid') || input.includes('mosque')) {
      return 'We have several Masjids and volunteer groups offering FREE Sehri! Check the Home page and filter for FREE options. Popular locations include Shivajinagar, Frazer Town, and Koramangala. 🕌';
    } else if (input.includes('restaurant') || input.includes('paid')) {
      return 'Looking for restaurants? We have listings of restaurants serving Sehri marked as PAID. You can find them on the Home page - they offer various cuisines including Mughlai, Biryani, Arabic, and more! 🍽️';
    } else if (input.includes('location') || input.includes('area') || input.includes('near')) {
      return 'You can search for Sehri providers by location using the search bar on the Home page. We have providers across Bangalore including Koramangala, Indiranagar, HSR Layout, Whitefield, Banashankari, and more! 📍';
    } else if (input.includes('add') || input.includes('submit') || input.includes('request')) {
      return 'You can submit a new Sehri provider using the "Request Sehri" button in the navigation menu. Help us grow our community database! ➕';
    } else if (input.includes('live') || input.includes('stream') || input.includes('makkah')) {
      return 'You can watch live streams from Mecca 24/7! Click on the "Live Stream" button in the navigation menu to view the blessed Ka\'bah. 📺';
    } else if (input.includes('ramadan') || input.includes('fasting') || input.includes('fast')) {
      return 'Ramadan Mubarak! 🌙 Remember to have Sehri before Fajr, stay hydrated, and break your fast with dates and water. Focus on prayer, Quran, and good deeds. May Allah accept your fasts!';
    } else if (input.includes('hello') || input.includes('hi') || input.includes('assalam')) {
      return 'Wa Alaikum Assalam! 😊 How can I help you today? You can ask me about Sehri times, prayer times, free Sehri locations, or anything else related to Ramadan in Bangalore!';
    } else if (input.includes('thank')) {
      return 'You\'re welcome! May Allah make this Ramadan easy and blessed for you. Feel free to ask if you have more questions! 🤲';
    } else {
      return 'I can help you with:\n• Sehri and Iftar times\n• Prayer times for Bangalore\n• Finding free or paid Sehri providers\n• Searching by location\n• Live streams from Mecca\n• Submitting new Sehri providers\n\nWhat would you like to know? 🌙';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                🌙 Bangalore Sehri Finder
              </h1>
              <p className="text-indigo-100 text-sm md:text-base">
                Find Sehri at Masjids, Volunteers & Restaurants
              </p>
            </div>
            {!loading && nextPrayer && (
              <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/30">
                <p className="text-xs uppercase tracking-wide text-indigo-100 mb-1">
                  Next Prayer
                </p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <span>{nextPrayer.icon}</span> {nextPrayer.time}
                </p>
                <p className="text-sm text-indigo-100 mt-1">{nextPrayer.name}</p>
                <p className="text-xs text-indigo-200 mt-1">In {nextPrayer.timeUntil}</p>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveSection('home')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                activeSection === 'home'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setActiveSection('livestream')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                activeSection === 'livestream'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              📺 Live Stream
            </button>
            <button
              onClick={() => {
                setActiveSection('home');
                setShowRequestForm(true);
              }}
              className="px-6 py-2 rounded-full font-semibold transition-all bg-white/20 hover:bg-white/30 text-white"
            >
              ➕ Request Sehri
            </button>
            <button
              onClick={() => setActiveSection('about')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                activeSection === 'about'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              ℹ️ About Us
            </button>
          </nav>

          {/* Prayer Times Grid */}
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              <p className="mt-2 text-sm text-indigo-100">Loading prayer times...</p>
            </div>
          ) : prayerTimes ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🌅</span>
                  <p className="text-xs font-semibold text-indigo-100">Fajr</p>
                </div>
                <p className="text-lg font-bold">{prayerTimes.Fajr}</p>
                <p className="text-xs text-indigo-200">Sehri Ends</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">☀️</span>
                  <p className="text-xs font-semibold text-indigo-100">Sunrise</p>
                </div>
                <p className="text-lg font-bold">{prayerTimes.Sunrise}</p>
                <p className="text-xs text-indigo-200">Shuruq</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🕌</span>
                  <p className="text-xs font-semibold text-indigo-100">Dhuhr</p>
                </div>
                <p className="text-lg font-bold">{prayerTimes.Dhuhr}</p>
                <p className="text-xs text-indigo-200">Noon</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🌤️</span>
                  <p className="text-xs font-semibold text-indigo-100">Asr</p>
                </div>
                <p className="text-lg font-bold">{prayerTimes.Asr}</p>
                <p className="text-xs text-indigo-200">Afternoon</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🌆</span>
                  <p className="text-xs font-semibold text-indigo-100">Maghrib</p>
                </div>
                <p className="text-lg font-bold">{prayerTimes.Maghrib}</p>
                <p className="text-xs text-indigo-200">Iftar Time</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">🌙</span>
                  <p className="text-xs font-semibold text-indigo-100">Isha</p>
                </div>
                <p className="text-lg font-bold">{prayerTimes.Isha}</p>
                <p className="text-xs text-indigo-200">Night</p>
              </div>
            </div>
          ) : null}

          <p className="text-center text-xs text-indigo-100 mt-4">{today}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Home Section */}
        {activeSection === 'home' && (
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="max-w-2xl mx-auto">
                <label htmlFor="search" className="block text-gray-700 font-semibold mb-2">
                  Search by Location
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    placeholder="Enter location (e.g., Koramangala, Indiranagar...)"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                  <svg 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600 text-center">
                Found <span className="font-bold text-purple-600">{filteredProviders.length}</span> Sehri providers
                {searchLocation && <span> in "<span className="font-semibold">{searchLocation}</span>"</span>}
              </p>
            </div>

            {/* Provider Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Card Image/Icon */}
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-32 flex items-center justify-center relative">
                    <span className="text-6xl">{provider.image}</span>
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                      provider.pricing === 'Free' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {provider.pricing}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {provider.name}
                      </h3>
                      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${
                        provider.type === 'Masjid' ? 'bg-purple-100 text-purple-700' :
                        provider.type === 'Volunteer' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {provider.type}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                  <div className="flex items-start text-gray-600 text-sm">
                    <svg 
                      className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                        <span>{provider.address}</span>
                      </div>

                      <div className="flex items-center text-gray-600 text-sm">
                        <svg 
                          className="w-4 h-4 mr-2" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        <span>Opens at <span className="font-semibold text-purple-600">{provider.opens}</span></span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Food Offered</p>
                      <p className="text-sm text-gray-700 font-medium">{provider.foodType}</p>
                    </div>

                    <div className="mt-4">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-semibold">
                        📍 {provider.location}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      {/* Google Maps Button */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ', ' + provider.address + ', Bangalore')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0zM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11z"/>
                        </svg>
                        Maps
                      </a>

                      {/* WhatsApp Share Button */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `🌙 *Sehri at ${provider.name}*\n` +
                          `${provider.type === 'Masjid' ? '🕌' : provider.type === 'Volunteer' ? '🤝' : '🍽️'} Type: ${provider.type}\n` +
                          `💰 ${provider.pricing}\n\n` +
                          `📍 Location: ${provider.address}\n` +
                          `🕐 Opens: ${provider.opens}\n` +
                          `🍽️ Food: ${provider.foodType}\n\n` +
                          `Found on Bangalore Sehri Finder`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Share
                      </a>
                    </div>
              </div>
            </div>
              ))}
            </div>

            {/* No Results Message */}
            {filteredProviders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  No Sehri providers found
                </h3>
                <p className="text-gray-500">
                  Try searching for a different location like Shivajinagar, Koramangala, Indiranagar, or Whitefield
                </p>
              </div>
            )}
          </>
        )}

        {/* Live Stream Section */}
        {activeSection === 'livestream' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🕋</div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Live from Mecca
              </h2>
              <p className="text-lg text-gray-600">
                Watch the blessed Haramain live 24/7
              </p>
            </div>

            <div className="space-y-8">
              {/* Mecca Live Stream */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🕋</span>
                    <div>
                      <h3 className="text-2xl font-bold">Masjid al-Haram, Mecca</h3>
                      <p className="text-green-100 text-sm">Live 24/7 from the Holy Kaaba</p>
                    </div>
                  </div>
                </div>
                <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://makkahlive.net/makkahlive.aspx"
                    title="Mecca Live Stream"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                    <span>•</span>
                    <span>Mecca Al-Mukarramah, Saudi Arabia</span>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">ℹ️</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">About This Live Stream</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      This live stream brings you closer to the blessed Kaaba from the comfort of your home. 
                      Perfect for feeling connected during Ramadan, watching Taraweeh prayers, or simply seeking 
                      spiritual peace. The stream is available 24/7 and shows live views of the Holy Kaaba in 
                      Mecca Al-Mukarramah.
                    </p>
                    <p className="text-gray-500 text-xs mt-3">
                      Note: Streams are provided by MakkahLive.net. Internet connection required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Us Section */}
        {activeSection === 'about' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🌙</div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  About Bangalore Sehri Finder
                </h2>
                <p className="text-lg text-gray-600">
                  Connecting the community with Sehri services during Ramadan
                </p>
              </div>

              <div className="space-y-8">
                {/* Mission */}
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🎯</span> Our Mission
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    During the blessed month of Ramadan, finding places that serve Sehri (pre-dawn meal) 
                    can be challenging. Bangalore Sehri Finder was created to connect the Muslim community 
                    in Bangalore with Masjids offering free Sehri, volunteer groups serving the community, 
                    and restaurants with early morning services. Whether you're looking for free community 
                    Sehri or restaurants, we make it easy to find the perfect place for your pre-fast meal. 
    We also provide live streams from Mecca to keep you spiritually connected during Ramadan.
                  </p>
                </div>

                {/* Features */}
                <div className="border-l-4 border-pink-500 pl-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>✨</span> What We Offer
                  </h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Real-time Prayer Times:</strong> Accurate prayer times for Bangalore including Fajr (Sehri end time) and Maghrib (Iftar time)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Live Streams:</strong> Watch Mecca live 24/7 from Masjid al-Haram</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Comprehensive Directory:</strong> Find Masjids with free Sehri, volunteer-run community kitchens, and restaurants across Bangalore</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Free & Paid Options:</strong> Clearly marked to help you find free community Sehri or paid restaurant services</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Location Search:</strong> Find Sehri providers in your area with our easy search feature</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Google Maps Integration:</strong> Get directions to any location instantly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>WhatsApp Sharing:</strong> Share details with family and friends</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>AI Chatbot:</strong> Get instant answers about Sehri, prayer times, and Ramadan queries</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">•</span>
                      <span><strong>Community Requests:</strong> Help us grow by submitting new Sehri providers</span>
                    </li>
                  </ul>
                </div>

                {/* Community */}
                <div className="border-l-4 border-indigo-500 pl-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🤝</span> Community Driven
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    This platform thrives on community contributions. If you know a Masjid offering free Sehri, 
                    a volunteer group serving the community, or a restaurant with early morning service that's 
                    not listed here, please use the "Request Sehri" feature to submit it. Together, we can make 
                    Ramadan easier for everyone in Bangalore.
                  </p>
                  <button
                    onClick={() => {
                      setActiveSection('home');
                      setShowRequestForm(true);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                  >
                    Submit a Sehri Provider
                  </button>
                </div>

                {/* Contact */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📧</span> Get in Touch
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Have suggestions or feedback? Want to partner with us? We'd love to hear from you! 
                    This is a community service built with love for the people of Bangalore.
                  </p>
                </div>

                {/* Ramadan Message */}
                <div className="text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl p-8">
                  <h3 className="text-2xl font-bold mb-3">Ramadan Mubarak! 🌙</h3>
                  <p className="text-indigo-100">
                    May this blessed month bring peace, prosperity, and joy to you and your loved ones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {activeSection === 'home' && (
        <button
          onClick={() => setShowRequestForm(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40 flex items-center gap-2 group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden group-hover:inline-block font-semibold pr-1 animate-fade-in">
            Request Sehri
          </span>
        </button>
      )}

      {/* Chatbot Floating Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-8 left-8 bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40"
        title="Chat with us"
      >
        {showChatbot ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="fixed bottom-24 left-8 w-96 max-w-[calc(100vw-4rem)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col" style={{ height: '500px', maxHeight: 'calc(100vh - 10rem)' }}>
          {/* Chatbot Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">�</span>
              </div>
              <div>
                <h3 className="font-bold">Hala AI Assistant</h3>
                <p className="text-xs text-green-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-lg">🧕</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about Sehri, prayer times..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all text-sm"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🍽️ Request Sehri Service</h2>
                  <p className="text-purple-100 text-sm">
                    Know a Masjid, Volunteer group, or restaurant serving Sehri? Help the community!
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {/* Provider Name */}
              <div>
                <label htmlFor="providerName" className="block text-gray-700 font-semibold mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="providerName"
                  name="providerName"
                  value={formData.providerName}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., Jamia Masjid, Al-Huda Kitchen, Empire Restaurant"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              {/* Provider Type and Pricing Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="providerType" className="block text-gray-700 font-semibold mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="providerType"
                    name="providerType"
                    value={formData.providerType}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="Masjid">🕌 Masjid</option>
                    <option value="Volunteer">🤝 Volunteer Group</option>
                    <option value="Restaurant">🍽️ Restaurant</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="pricing" className="block text-gray-700 font-semibold mb-2">
                    Pricing <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="pricing"
                    name="pricing"
                    value={formData.pricing}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="Free">💚 Free</option>
                    <option value="Paid">💵 Paid</option>
                  </select>
                </div>
              </div>

              {/* Location and Address Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-gray-700 font-semibold mb-2">
                    Area/Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g., Koramangala"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="opensAt" className="block text-gray-700 font-semibold mb-2">
                    Opens At <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="opensAt"
                    name="opensAt"
                    value={formData.opensAt}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label htmlFor="address" className="block text-gray-700 font-semibold mb-2">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., 100 Feet Road, 4th Block, Koramangala"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              {/* Phone and Food Type Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phoneNumber" className="block text-gray-700 font-semibold mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleFormChange}
                    placeholder="e.g., +91 98765 43210"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="foodType" className="block text-gray-700 font-semibold mb-2">
                    Food Offered
                  </label>
                  <input
                    type="text"
                    id="foodType"
                    name="foodType"
                    value={formData.foodType}
                    onChange={handleFormChange}
                    placeholder="e.g., Biryani, Chai, Dates"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label htmlFor="additionalInfo" className="block text-gray-700 font-semibold mb-2">
                  Additional Information
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleFormChange}
                  rows="4"
                  placeholder="Any special offerings, popular dishes, or other helpful information..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                ></textarea>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-blue-700">
                    Your request will be reviewed by our team. We'll verify the details and add it to our directory if approved. Thank you for helping the community!
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-4">
            <p className="text-sm">
              © 2026 Bangalore Sehri Finder. Made with ❤️ for the community.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Prayer times may vary. Please confirm with your local mosque.
            </p>
          </div>
          
          {/* Visitor Counter */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-full">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300">
                <span className="text-green-400">{visitorCount.toLocaleString()}</span> Total Visitors
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
