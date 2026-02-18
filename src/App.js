import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import PrayerCountdownRing from './components/PrayerCountdownRing';

const CHATBOT_API_URL = (process.env.REACT_APP_CHATBOT_API_URL || '/api/chat').trim();
const PROVIDERS_API_URL = (process.env.REACT_APP_PROVIDERS_API_URL || '/api/providers').trim();
const PROVIDER_SUBMISSIONS_API_URL = (process.env.REACT_APP_PROVIDER_SUBMISSIONS_API_URL || '/api/providers/submissions').trim();
const ADMIN_PROVIDER_SUBMISSIONS_API_URL = (process.env.REACT_APP_ADMIN_PROVIDER_SUBMISSIONS_API_URL || '/api/admin/provider-submissions').trim();
const ADMIN_SEHRI_REQUESTS_API_URL = (process.env.REACT_APP_ADMIN_SEHRI_REQUESTS_API_URL || '/api/admin/sehri-requests').trim();
const ADMIN_SEHRI_ANALYTICS_API_URL = (process.env.REACT_APP_ADMIN_SEHRI_ANALYTICS_API_URL || '/api/admin/sehri-analytics').trim();
const ADMIN_SEHRI_EXPORT_API_URL = (process.env.REACT_APP_ADMIN_SEHRI_EXPORT_API_URL || '/api/admin/sehri-requests/export').trim();
const AUTH_API_BASE_URL = (process.env.REACT_APP_AUTH_API_URL || '/api/auth').trim();
const SEHRI_REQUESTS_API_URL = (process.env.REACT_APP_SEHRI_REQUESTS_API_URL || '/api/sehri-requests').trim();
const PROVIDERS_PAGE_SIZE = Math.max(
  1,
  parseInt(process.env.REACT_APP_PROVIDERS_PAGE_SIZE || '12', 10) || 12
);
const AUTH_TOKEN_STORAGE_KEY = 'sehriFinder_authToken';
const ENTRY_LOTTIE_URL = 'https://lottie.host/18c8584d-60fa-4004-a299-add753193be5/nkq6EpDrn2.lottie';
const ENTRY_LOTTIE_DURATION_MS = 5000;
const BANGALORE_RAMADAN_CALENDAR = [
  { date: '19 Feb 2026 (1 Ramadan)', sehri: '05:29 AM', iftar: '06:26 PM' },
  { date: '20 Feb 2026', sehri: '05:29 AM', iftar: '06:27 PM' },
  { date: '21 Feb 2026', sehri: '05:28 AM', iftar: '06:27 PM' },
  { date: '22 Feb 2026', sehri: '05:28 AM', iftar: '06:27 PM' },
  { date: '23 Feb 2026', sehri: '05:28 AM', iftar: '06:27 PM' },
  { date: '24 Feb 2026', sehri: '05:27 AM', iftar: '06:27 PM' },
  { date: '25 Feb 2026', sehri: '05:27 AM', iftar: '06:28 PM' },
  { date: '26 Feb 2026', sehri: '05:26 AM', iftar: '06:28 PM' },
  { date: '27 Feb 2026', sehri: '05:26 AM', iftar: '06:28 PM' },
  { date: '28 Feb 2026', sehri: '05:25 AM', iftar: '06:28 PM' },
  { date: '01 Mar 2026', sehri: '05:25 AM', iftar: '06:28 PM' },
  { date: '02 Mar 2026', sehri: '05:24 AM', iftar: '06:28 PM' },
  { date: '03 Mar 2026', sehri: '05:24 AM', iftar: '06:29 PM' },
  { date: '04 Mar 2026', sehri: '05:23 AM', iftar: '06:29 PM' },
  { date: '05 Mar 2026', sehri: '05:23 AM', iftar: '06:29 PM' },
  { date: '06 Mar 2026', sehri: '05:22 AM', iftar: '06:29 PM' },
  { date: '07 Mar 2026', sehri: '05:22 AM', iftar: '06:29 PM' },
  { date: '08 Mar 2026', sehri: '05:21 AM', iftar: '06:29 PM' },
  { date: '09 Mar 2026', sehri: '05:21 AM', iftar: '06:29 PM' },
  { date: '10 Mar 2026', sehri: '05:20 AM', iftar: '06:29 PM' },
  { date: '11 Mar 2026', sehri: '05:19 AM', iftar: '06:30 PM' },
  { date: '12 Mar 2026', sehri: '05:19 AM', iftar: '06:30 PM' },
  { date: '13 Mar 2026', sehri: '05:18 AM', iftar: '06:30 PM' },
  { date: '14 Mar 2026', sehri: '05:17 AM', iftar: '06:30 PM' },
  { date: '15 Mar 2026', sehri: '05:17 AM', iftar: '06:30 PM' },
  { date: '16 Mar 2026', sehri: '05:16 AM', iftar: '06:30 PM' },
  { date: '17 Mar 2026', sehri: '05:16 AM', iftar: '06:30 PM' },
  { date: '18 Mar 2026', sehri: '05:15 AM', iftar: '06:30 PM' },
  { date: '19 Mar 2026 (30 Ramadan)', sehri: '05:14 AM', iftar: '06:30 PM' },
];

const RAMADAN_AHADEES = [
  {
    id: 1,
    topic: 'Virtue of Ramadan Fasting',
    text: 'Whoever fasts Ramadan with faith and seeking reward, his past sins are forgiven.',
    source: 'Sahih al-Bukhari 38, Sahih Muslim 760',
  },
  {
    id: 2,
    topic: 'Reward for Feeding a Fasting Person',
    text: 'Whoever gives food for a fasting person to break his fast gets a reward like his, without reducing the fasting person reward.',
    source: 'Jami at-Tirmidhi 807',
  },
  {
    id: 3,
    topic: 'Dua at Iftar',
    text: 'The supplication of a fasting person at the time of breaking fast is not rejected.',
    source: 'Sunan Ibn Majah 1753',
  },
  {
    id: 4,
    topic: 'Seeking Laylat al-Qadr',
    text: 'Seek Laylat al-Qadr in the last ten nights of Ramadan.',
    source: 'Sahih al-Bukhari 2020, Sahih Muslim 1169',
  },
  {
    id: 5,
    topic: 'Best Charity in Ramadan',
    text: 'The Prophet was the most generous of people, and he was even more generous in Ramadan.',
    source: 'Sahih al-Bukhari 6, Sahih Muslim 2308',
  },
  {
    id: 6,
    topic: 'Suhoor Blessing',
    text: 'Take suhoor, for indeed there is blessing in suhoor.',
    source: 'Sahih al-Bukhari 1923, Sahih Muslim 1095',
  },
];

const ISLAMIC_QUOTES = [
  {
    id: 1,
    text: 'Allah does not burden a soul beyond that it can bear.',
    source: 'Quran 2:286',
  },
  {
    id: 2,
    text: 'Indeed, with hardship comes ease.',
    source: 'Quran 94:6',
  },
  {
    id: 3,
    text: 'The best among you are those who have the best manners and character.',
    source: 'Sahih al-Bukhari 3559',
  },
  {
    id: 4,
    text: 'The strong person is not the one who can wrestle, but the one who controls himself when angry.',
    source: 'Sahih al-Bukhari 6114, Sahih Muslim 2609',
  },
  {
    id: 5,
    text: 'Whoever believes in Allah and the Last Day should speak good or remain silent.',
    source: 'Sahih al-Bukhari 6018, Sahih Muslim 47',
  },
  {
    id: 6,
    text: 'The most beloved deeds to Allah are those done regularly, even if they are few.',
    source: 'Sahih al-Bukhari 6464, Sahih Muslim 783',
  },
];

const SKY_GRADIENT_BY_PERIOD = {
  fajr: 'bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-900',
  sunrise: 'bg-gradient-to-b from-orange-300 via-pink-300 to-yellow-200',
  dhuhr: 'bg-gradient-to-b from-sky-400 to-blue-500',
  asr: 'bg-gradient-to-b from-amber-300 to-orange-400',
  maghrib: 'bg-gradient-to-b from-orange-500 via-red-500 to-pink-600',
  isha: 'bg-gradient-to-b from-indigo-950 via-blue-950 to-slate-900',
};

const UI_GRADIENT_BY_PERIOD = {
  fajr: 'from-indigo-800 via-purple-700 to-blue-800',
  sunrise: 'from-orange-400 via-pink-400 to-yellow-300',
  dhuhr: 'from-sky-500 to-blue-600',
  asr: 'from-amber-400 to-orange-500',
  maghrib: 'from-orange-600 via-red-500 to-pink-600',
  isha: 'from-indigo-950 via-blue-900 to-slate-900',
};

const DARK_UI_PERIODS = new Set(['fajr', 'maghrib', 'isha']);
const CAPTCHA_FORM_KEYS = ['auth', 'provider', 'sehri', 'feedback'];
const DEFAULT_SECTION = 'sehri';
const SHOW_NAVBAR = false;
const SHOW_NAMAZ_TIMINGS_SECTION = false;
const AUTH_ALLOW_REGISTRATION = false;
const SHOW_CHATBOT_ON_SEHRI_PAGE = false;

function getSectionFromPath(pathname) {
  const path = String(pathname || '').toLowerCase();
  if (path.startsWith('/admin')) {
    return 'admin';
  }
  if (path.startsWith('/ahadees')) {
    return 'ahadees';
  }
  if (path.startsWith('/about')) {
    return 'about';
  }
  if (path.startsWith('/profile')) {
    return 'profile';
  }
  if (path.startsWith('/home')) {
    return 'home';
  }
  if (path.startsWith('/sehri-request') || path.startsWith('/request-sehri')) {
    return 'sehri';
  }
  return DEFAULT_SECTION;
}

function createCaptchaChallenge() {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 2;
  const operations = ['+', '-'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  if (operation === '-') {
    const high = Math.max(left, right);
    const low = Math.min(left, right);
    return {
      question: `${high} - ${low}`,
      answer: high - low,
    };
  }

  return {
    question: `${left} + ${right}`,
    answer: left + right,
  };
}

function createCaptchaChallengeMap() {
  return CAPTCHA_FORM_KEYS.reduce((acc, key) => {
    acc[key] = createCaptchaChallenge();
    return acc;
  }, {});
}

function createCaptchaTextMap() {
  return CAPTCHA_FORM_KEYS.reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {});
}

function getTodayCalendarFallback() {
  const now = new Date();
  const gregorianLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  try {
    const hijriParts = new Intl.DateTimeFormat('en-u-ca-islamic', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(now);

    const readPart = (type) => hijriParts.find((part) => part.type === type)?.value || '';
    return {
      hijriDay: readPart('day'),
      hijriMonth: readPart('month'),
      hijriYear: readPart('year'),
      hijriWeekday: readPart('weekday'),
      gregorianLabel,
    };
  } catch (_error) {
    return {
      hijriDay: '',
      hijriMonth: '',
      hijriYear: '',
      hijriWeekday: '',
      gregorianLabel,
    };
  }
}

function parseCalendarInfoFromApi(datePayload) {
  if (!datePayload) {
    return getTodayCalendarFallback();
  }

  const hijri = datePayload.hijri || {};
  const gregorian = datePayload.gregorian || {};
  const fallback = getTodayCalendarFallback();

  const gregorianDateText = [gregorian.day, gregorian.month?.en, gregorian.year]
    .filter(Boolean)
    .join(' ');
  const gregorianLabel = [gregorian.weekday?.en, gregorianDateText]
    .filter(Boolean)
    .join(', ');

  return {
    hijriDay: String(hijri.day || '').trim() || fallback.hijriDay,
    hijriMonth: String(hijri.month?.en || '').trim() || fallback.hijriMonth,
    hijriYear: String(hijri.year || '').trim() || fallback.hijriYear,
    hijriWeekday: String(hijri.weekday?.en || '').trim() || fallback.hijriWeekday,
    gregorianLabel: gregorianLabel || fallback.gregorianLabel,
  };
}

function getRamadanDayFromLabel(label, fallbackDay) {
  const match = String(label || '').match(/\((\d+)\s*Ramadan\)/i);
  if (!match) {
    return fallbackDay;
  }
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackDay;
}

function parseTwelveHourTimeToMinutes(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (hours < 1 || hours > 12) {
    return null;
  }

  if (hours === 12) {
    hours = 0;
  }
  if (meridiem === 'PM') {
    hours += 12;
  }

  return (hours * 60) + minutes;
}

function formatTimeShift(previousValue, currentValue) {
  const previousMinutes = parseTwelveHourTimeToMinutes(previousValue);
  const currentMinutes = parseTwelveHourTimeToMinutes(currentValue);
  if (previousMinutes === null || currentMinutes === null) {
    return 'N/A';
  }
  const delta = currentMinutes - previousMinutes;
  if (delta === 0) {
    return 'No change';
  }
  return `${delta > 0 ? '+' : '-'}${Math.abs(delta)} min`;
}

const SEHRI_REQUEST_LOCATION_OPTIONS = [
  'Shivajinagar',
  'Vasanth Nagar',
  'Cunningham Road',
  'Queens Road',
  'Infantry Road',
  'Benson Town',
  'Frazer Town',
  'HBR Layout',
  'Chinappa Garden',
  'Marappa Garden',
  'Commercial Street',
  'Kamraj Road',
  'Nandi Durga Road',
  'SK Garden',
];

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
    image: "ðŸ•Œ"
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
    image: "ðŸ¤"
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
    image: "ðŸ›"
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
    image: "ðŸ•Œ"
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
    image: "ðŸ¤"
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
    image: "ðŸ½ï¸"
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
    image: "ðŸ•Œ"
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
    image: "ðŸ¤"
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
    image: "ðŸ¥™"
  },
  {
    id: 10,
    name: "Bangaluru East Volunteer Delivery",
    type: "Volunteer",
    section: "Delivery",
    zone: "Bangaluru East",
    contact: "Sadiq Rahmathulla",
    phone: "8951669581",
    location: "Bangaluru East",
    address: "Shivajinagar, Vasanth Nagar, Cunningham Road, Queens Road, Infantry Road, Benson Town, Chinappa Garden, Marappa Garden, Commercial Street, Kamraj Road, Nandi Durga Road, SK Garden",
    opens: "2:30 AM",
    foodType: "Sehri box delivery service",
    pricing: "Free",
    image: "??"
  }
];

function App() {
  const [searchLocation, setSearchLocation] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [calendarInfo, setCalendarInfo] = useState(() => getTodayCalendarFallback());
  const [loading, setLoading] = useState(true);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showRamadanCalendarModal, setShowRamadanCalendarModal] = useState(false);
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [selectedRamadanDay, setSelectedRamadanDay] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SECTION;
    }
    return getSectionFromPath(window.location.pathname);
  });
  const [showChatbot, setShowChatbot] = useState(false);
  const skyThemeClass = SKY_GRADIENT_BY_PERIOD.isha;
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
  });
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authFormData, setAuthFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    gender: '',
    phone: '',
    city: '',
    address: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [captchaByForm, setCaptchaByForm] = useState(() => createCaptchaChallengeMap());
  const [captchaInputByForm, setCaptchaInputByForm] = useState(() => createCaptchaTextMap());
  const [captchaErrorByForm, setCaptchaErrorByForm] = useState(() => createCaptchaTextMap());
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Assalamu Alaikum! ðŸŒ™ I\'m here to help you with Sehri information, prayer times, and Ramadan queries. How can I assist you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null);
  const adminSehriDateFromInputRef = useRef(null);
  const adminSehriDateToInputRef = useRef(null);
  const [visitorCount, setVisitorCount] = useState(0);
  const [providers, setProviders] = useState(mockProviders.slice(0, PROVIDERS_PAGE_SIZE));
  const [providersPage, setProvidersPage] = useState(1);
  const [providersTotal, setProvidersTotal] = useState(mockProviders.length);
  const [providersTotalPages, setProvidersTotalPages] = useState(
    Math.max(1, Math.ceil(mockProviders.length / PROVIDERS_PAGE_SIZE))
  );
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersPageLoadingDirection, setProvidersPageLoadingDirection] = useState('');
  const [providersError, setProvidersError] = useState('');
  const [providerSubmitting, setProviderSubmitting] = useState(false);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [adminSubmissionsLoading, setAdminSubmissionsLoading] = useState(false);
  const [adminSubmissionsError, setAdminSubmissionsError] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('pending');
  const [adminActionLoadingById, setAdminActionLoadingById] = useState({});
  const [adminSehriRequests, setAdminSehriRequests] = useState([]);
  const [adminSehriRequestsLoading, setAdminSehriRequestsLoading] = useState(false);
  const [adminSehriRequestsError, setAdminSehriRequestsError] = useState('');
  const [adminSehriDateFrom, setAdminSehriDateFrom] = useState('');
  const [adminSehriDateTo, setAdminSehriDateTo] = useState('');
  const [adminActiveMenu, setAdminActiveMenu] = useState('providers');
  const [adminSehriAnalytics, setAdminSehriAnalytics] = useState(null);
  const [adminSehriAnalyticsLoading, setAdminSehriAnalyticsLoading] = useState(false);
  const [adminSehriAnalyticsError, setAdminSehriAnalyticsError] = useState('');
  const [adminSehriExportLoading, setAdminSehriExportLoading] = useState(false);
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
  const [sehriRequestData, setSehriRequestData] = useState({
    fullName: '',
    gender: '',
    mobileNumber: '',
    location: '',
    boxCount: '1'
  });
  const [sehriRequestSubmitting, setSehriRequestSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    name: '',
    email: '',
    rating: '5',
    message: ''
  });
  const [showEntryAnimation, setShowEntryAnimation] = useState(true);
  const [activeIslamicQuoteIndex, setActiveIslamicQuoteIndex] = useState(0);

  const ramadanCalendarRows = useMemo(() => (
    BANGALORE_RAMADAN_CALENDAR.map((row, index) => ({
      ...row,
      ramadanDay: getRamadanDayFromLabel(row.date, index + 1),
    }))
  ), []);

  const filteredRamadanCalendarRows = useMemo(() => {
    const query = calendarSearchQuery.trim().toLowerCase();
    if (!query) {
      return ramadanCalendarRows;
    }
    return ramadanCalendarRows.filter((row) => (
      row.date.toLowerCase().includes(query)
      || row.sehri.toLowerCase().includes(query)
      || row.iftar.toLowerCase().includes(query)
      || String(row.ramadanDay).includes(query)
      || `day ${row.ramadanDay}`.includes(query)
    ));
  }, [calendarSearchQuery, ramadanCalendarRows]);

  const selectedRamadanRow = useMemo(() => (
    ramadanCalendarRows.find((row) => row.ramadanDay === selectedRamadanDay) || null
  ), [ramadanCalendarRows, selectedRamadanDay]);

  const selectedRamadanSummary = useMemo(() => {
    if (!selectedRamadanRow) {
      return null;
    }
    const previousDayRow = ramadanCalendarRows.find(
      (row) => row.ramadanDay === (selectedRamadanRow.ramadanDay - 1)
    );
    return {
      ...selectedRamadanRow,
      sehriShift: previousDayRow ? formatTimeShift(previousDayRow.sehri, selectedRamadanRow.sehri) : 'Start of Ramadan',
      iftarShift: previousDayRow ? formatTimeShift(previousDayRow.iftar, selectedRamadanRow.iftar) : 'Start of Ramadan',
    };
  }, [ramadanCalendarRows, selectedRamadanRow]);

  const navigateToSection = useCallback((section) => {
    setActiveSection(section);
    if (typeof window === 'undefined') {
      return;
    }

    let targetPath = '/';
    if (section === 'admin') {
      targetPath = '/admin';
    } else if (section === 'ahadees') {
      targetPath = '/ahadees';
    } else if (section === 'about') {
      targetPath = '/about';
    } else if (section === 'profile') {
      targetPath = '/profile';
    } else if (section === 'home') {
      targetPath = '/home';
    } else if (section === 'sehri') {
      targetPath = '/';
    }
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, []);
  
  const calculateNextPrayer = useCallback((timings) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Fajr (Sehri Ends)', time: timings.Fajr, icon: 'ðŸŒ…' },
      { name: 'Sunrise', time: timings.Sunrise, icon: 'â˜€ï¸' },
      { name: 'Dhuhr', time: timings.Dhuhr, icon: 'ðŸ•Œ' },
      { name: 'Asr', time: timings.Asr, icon: 'ðŸŒ¤ï¸' },
      { name: 'Maghrib (Iftar)', time: timings.Maghrib, icon: 'ðŸŒ†' },
      { name: 'Isha', time: timings.Isha, icon: 'ðŸŒ™' }
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
      icon: 'ðŸŒ…',
      timeUntil: 'Tomorrow'
    });
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShowEntryAnimation(false);
    }, ENTRY_LOTTIE_DURATION_MS);

    return () => clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (filteredRamadanCalendarRows.length === 0) {
      return;
    }
    const selectedDayExists = filteredRamadanCalendarRows.some(
      (row) => row.ramadanDay === selectedRamadanDay
    );
    if (!selectedDayExists) {
      setSelectedRamadanDay(filteredRamadanCalendarRows[0].ramadanDay);
    }
  }, [filteredRamadanCalendarRows, selectedRamadanDay]);

  const openRamadanCalendarModal = useCallback(() => {
    setCalendarSearchQuery('');
    setSelectedRamadanDay(1);
    setShowRamadanCalendarModal(true);
  }, []);

  const handlePreviousIslamicQuote = useCallback(() => {
    setActiveIslamicQuoteIndex((prev) => (
      prev === 0 ? ISLAMIC_QUOTES.length - 1 : prev - 1
    ));
  }, []);

  const handleNextIslamicQuote = useCallback(() => {
    setActiveIslamicQuoteIndex((prev) => (
      (prev + 1) % ISLAMIC_QUOTES.length
    ));
  }, []);

  const handleRandomIslamicQuote = useCallback(() => {
    if (ISLAMIC_QUOTES.length <= 1) {
      return;
    }
    setActiveIslamicQuoteIndex((prev) => {
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * ISLAMIC_QUOTES.length);
      }
      return next;
    });
  }, []);

  const activeIslamicQuote = ISLAMIC_QUOTES[activeIslamicQuoteIndex] || ISLAMIC_QUOTES[0];
  const shouldShowChatbotUi = SHOW_CHATBOT_ON_SEHRI_PAGE || activeSection !== 'sehri';
  
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
          setCalendarInfo(parseCalendarInfoFromApi(data.data.date));
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
        setCalendarInfo(getTodayCalendarFallback());
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

  // Keep section in sync with browser navigation.
  useEffect(() => {
    const syncSectionWithPath = () => {
      setActiveSection(getSectionFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', syncSectionWithPath);
    return () => window.removeEventListener('popstate', syncSectionWithPath);
  }, []);

  useEffect(() => {
    if (!shouldShowChatbotUi && showChatbot) {
      setShowChatbot(false);
    }
  }, [shouldShowChatbotUi, showChatbot]);

  // Restore authenticated user from token
  useEffect(() => {
    if (!authToken) {
      setAuthUser(null);
      return;
    }

    const controller = new AbortController();
    const authBaseUrl = AUTH_API_BASE_URL.replace(/\/+$/, '');

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${authBaseUrl}/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Auth session check failed with status ${response.status}`);
        }

        const payload = await response.json();
        if (!payload?.user) {
          throw new Error('Invalid auth response');
        }

        setAuthUser(payload.user);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        console.error('Auth session restore failed:', error);
        setAuthUser(null);
        setAuthToken('');
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        }
      }
    };

    fetchCurrentUser();
    return () => controller.abort();
  }, [authToken]);

  useEffect(() => {
    if (!authUser) {
      setProfileFormData({
        name: '',
        gender: '',
        phone: '',
        city: '',
        address: '',
      });
      return;
    }

    setProfileFormData({
      name: authUser.name || '',
      gender: authUser.gender || '',
      phone: authUser.phone || '',
      city: authUser.city || '',
      address: authUser.address || '',
    });
  }, [authUser]);

  useEffect(() => {
    if (activeSection !== 'profile' || authUser) {
      return;
    }
    if (authToken && !authUser) {
      return;
    }
    setAuthError('Please login to access your profile.');
    setIsRegisterMode(false);
    setShowAuthModal(true);
    navigateToSection(DEFAULT_SECTION);
  }, [activeSection, authToken, authUser, navigateToSection]);

  useEffect(() => {
    if (activeSection !== 'admin') {
      return;
    }
    if (authToken && !authUser) {
      return;
    }

    if (!authUser) {
      setAuthError('Please login as admin to manage provider approvals.');
      setIsRegisterMode(false);
      setShowAuthModal(true);
      navigateToSection(DEFAULT_SECTION);
      return;
    }

    if (!authUser.isAdmin) {
      alert('Admin access is required to open this page.');
      navigateToSection(DEFAULT_SECTION);
    }
  }, [activeSection, authToken, authUser, navigateToSection]);

  // Load providers from backend API
  useEffect(() => {
    const controller = new AbortController();

    const fetchProviders = async () => {
      setProvidersLoading(true);
      setProvidersError('');

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('page', String(providersPage));
        queryParams.set('page_size', String(PROVIDERS_PAGE_SIZE));
        const trimmedSearchLocation = searchLocation.trim();
        const trimmedLocationFilter = locationFilter.trim();
        const effectiveLocation = trimmedLocationFilter || trimmedSearchLocation;
        if (effectiveLocation) {
          queryParams.set('location', effectiveLocation);
        }

        const separator = PROVIDERS_API_URL.includes('?') ? '&' : '?';
        const requestUrl = `${PROVIDERS_API_URL}${separator}${queryParams.toString()}`;

        const response = await fetch(requestUrl, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const contentType = response.headers.get('content-type') || '';

        if (response.status === 304) {
          return;
        }

        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}`;
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.error || errorMessage;
          } else {
            const rawText = await response.text();
            if (rawText) {
              errorMessage = rawText;
            }
          }
          throw new Error(errorMessage);
        }

        if (!contentType.includes('application/json')) {
          throw new Error('Invalid response from providers API');
        }

        const data = await response.json();

        // Backward compatibility if API returns a plain list.
        if (Array.isArray(data)) {
          const total = data.length;
          const totalPages = Math.max(1, Math.ceil(total / PROVIDERS_PAGE_SIZE));
          const safePage = Math.min(providersPage, totalPages);
          const startIndex = (safePage - 1) * PROVIDERS_PAGE_SIZE;

          setProviders(data.slice(startIndex, startIndex + PROVIDERS_PAGE_SIZE));
          setProvidersTotal(total);
          setProvidersTotalPages(totalPages);
          if (safePage !== providersPage) {
            setProvidersPage(safePage);
          }
          return;
        }

        if (!data || !Array.isArray(data.data)) {
          throw new Error('Providers API did not return paginated data');
        }

        const pagination = data.pagination || {};
        const total = Number.isFinite(Number(pagination.total))
          ? Number(pagination.total)
          : data.data.length;
        const totalPages = Number.isFinite(Number(pagination.total_pages))
          ? Math.max(1, Number(pagination.total_pages))
          : Math.max(1, Math.ceil(total / PROVIDERS_PAGE_SIZE));
        const pageFromApi = Number.isFinite(Number(pagination.page))
          ? Number(pagination.page)
          : providersPage;

        setProviders(data.data);
        setProvidersTotal(total);
        setProvidersTotalPages(totalPages);
        if (pageFromApi !== providersPage) {
          setProvidersPage(pageFromApi);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        console.error('Providers fetch error:', error);
        setProvidersError(error.message || 'Failed to load providers');

        const trimmedSearchLocation = searchLocation.trim();
        const trimmedLocationFilter = locationFilter.trim();
        const effectiveLocation = (trimmedLocationFilter || trimmedSearchLocation).toLowerCase();
        const fallbackFiltered = mockProviders.filter(provider => {
          if (!effectiveLocation) {
            return true;
          }
          return (provider.location || '').toLowerCase().includes(effectiveLocation);
        });
        const fallbackTotal = fallbackFiltered.length;
        const fallbackTotalPages = Math.max(1, Math.ceil(fallbackTotal / PROVIDERS_PAGE_SIZE));
        const safePage = Math.min(providersPage, fallbackTotalPages);
        const startIndex = (safePage - 1) * PROVIDERS_PAGE_SIZE;

        setProviders(fallbackFiltered.slice(startIndex, startIndex + PROVIDERS_PAGE_SIZE));
        setProvidersTotal(fallbackTotal);
        setProvidersTotalPages(fallbackTotalPages);
        if (safePage !== providersPage) {
          setProvidersPage(safePage);
        }
      } finally {
        setProvidersLoading(false);
        setProvidersPageLoadingDirection('');
      }
    };

    const debounceId = setTimeout(fetchProviders, 250);
    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [providersPage, searchLocation, locationFilter]);

  const filteredProviders = providers;
  const locationFilterOptions = useMemo(() => {
    const byKey = new Map();

    const registerLocation = (value) => {
      const normalized = String(value || '').trim();
      if (!normalized) {
        return;
      }
      const key = normalized.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, normalized);
      }
    };

    SEHRI_REQUEST_LOCATION_OPTIONS.forEach((option) => registerLocation(option));
    mockProviders.forEach((provider) => registerLocation(provider.location));
    providers.forEach((provider) => registerLocation(provider.location));
    registerLocation(searchLocation);
    registerLocation(locationFilter);

    return Array.from(byKey.values()).sort((left, right) => left.localeCompare(right));
  }, [providers, searchLocation, locationFilter]);

  const currentProvidersPage = Math.min(providersPage, providersTotalPages);
  const providersStart = providersTotal === 0 ? 0 : ((currentProvidersPage - 1) * PROVIDERS_PAGE_SIZE) + 1;
  const providersEnd = Math.min(currentProvidersPage * PROVIDERS_PAGE_SIZE, providersTotal);

  const handlePreviousProvidersPage = () => {
    if (currentProvidersPage === 1 || providersLoading) {
      return;
    }
    setProvidersPageLoadingDirection('prev');
    setProvidersPage(prev => Math.max(1, prev - 1));
  };

  const handleNextProvidersPage = () => {
    if (currentProvidersPage === providersTotalPages || providersLoading) {
      return;
    }
    setProvidersPageLoadingDirection('next');
    setProvidersPage(prev => Math.min(providersTotalPages, prev + 1));
  };

  const refreshCaptcha = useCallback((formKey) => {
    setCaptchaByForm(prev => ({
      ...prev,
      [formKey]: createCaptchaChallenge(),
    }));
    setCaptchaInputByForm(prev => ({
      ...prev,
      [formKey]: '',
    }));
    setCaptchaErrorByForm(prev => ({
      ...prev,
      [formKey]: '',
    }));
  }, []);

  const handleCaptchaInputChange = useCallback((formKey, value) => {
    setCaptchaInputByForm(prev => ({
      ...prev,
      [formKey]: value,
    }));
    setCaptchaErrorByForm(prev => ({
      ...prev,
      [formKey]: '',
    }));
  }, []);

  const validateCaptcha = useCallback((formKey) => {
    const challenge = captchaByForm[formKey];
    const rawValue = (captchaInputByForm[formKey] || '').trim();

    if (!challenge) {
      setCaptchaErrorByForm(prev => ({
        ...prev,
        [formKey]: 'Captcha is unavailable. Refresh and try again.',
      }));
      return false;
    }

    if (!rawValue) {
      setCaptchaErrorByForm(prev => ({
        ...prev,
        [formKey]: 'Please solve the captcha.',
      }));
      return false;
    }

    if (Number(rawValue) !== Number(challenge.answer)) {
      setCaptchaByForm(prev => ({
        ...prev,
        [formKey]: createCaptchaChallenge(),
      }));
      setCaptchaInputByForm(prev => ({
        ...prev,
        [formKey]: '',
      }));
      setCaptchaErrorByForm(prev => ({
        ...prev,
        [formKey]: 'Captcha answer is incorrect. Try the new challenge.',
      }));
      return false;
    }

    setCaptchaErrorByForm(prev => ({
      ...prev,
      [formKey]: '',
    }));
    return true;
  }, [captchaByForm, captchaInputByForm]);

  const parseApiError = useCallback(async (response, fallbackMessage) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data.detail || data.error || data.message || fallbackMessage;
    }
    const rawText = await response.text();
    return rawText || fallbackMessage;
  }, []);

  const formatAdminDateTime = useCallback((value) => {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError('');
    setAuthLoading(false);
    refreshCaptcha('auth');
  };

  const fetchAdminProviderSubmissions = useCallback(async () => {
    if (!authToken || !authUser?.isAdmin || !ADMIN_PROVIDER_SUBMISSIONS_API_URL) {
      return;
    }

    setAdminSubmissionsLoading(true);
    setAdminSubmissionsError('');

    try {
      const query = new URLSearchParams({
        status: adminStatusFilter || 'pending',
        page: '1',
        page_size: '100',
      });
      const separator = ADMIN_PROVIDER_SUBMISSIONS_API_URL.includes('?') ? '&' : '?';
      const response = await fetch(
        `${ADMIN_PROVIDER_SUBMISSIONS_API_URL}${separator}${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to load provider submissions.'));
      }

      const payload = await response.json().catch(() => ({}));
      setAdminSubmissions(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      console.error('Failed to load admin submissions:', error);
      setAdminSubmissions([]);
      setAdminSubmissionsError(error.message || 'Could not load provider submissions.');
    } finally {
      setAdminSubmissionsLoading(false);
    }
  }, [authToken, authUser?.isAdmin, adminStatusFilter, parseApiError]);

  const fetchAdminSehriRequests = useCallback(async () => {
    if (!authToken || !authUser?.isAdmin || !ADMIN_SEHRI_REQUESTS_API_URL) {
      return;
    }

    setAdminSehriRequestsLoading(true);
    setAdminSehriRequestsError('');

    try {
      const query = new URLSearchParams();
      query.set('page', '1');
      query.set('page_size', '200');
      if (adminSehriDateFrom) {
        query.set('date_from', adminSehriDateFrom);
      }
      if (adminSehriDateTo) {
        query.set('date_to', adminSehriDateTo);
      }
      const separator = ADMIN_SEHRI_REQUESTS_API_URL.includes('?') ? '&' : '?';
      const response = await fetch(
        `${ADMIN_SEHRI_REQUESTS_API_URL}${separator}${query.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to load Sehri requests.'));
      }

      const payload = await response.json().catch(() => ({}));
      setAdminSehriRequests(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      console.error('Failed to load admin Sehri requests:', error);
      setAdminSehriRequests([]);
      setAdminSehriRequestsError(error.message || 'Could not load Sehri requests.');
    } finally {
      setAdminSehriRequestsLoading(false);
    }
  }, [authToken, authUser?.isAdmin, adminSehriDateFrom, adminSehriDateTo, parseApiError]);

  const fetchAdminSehriAnalytics = useCallback(async () => {
    if (!authToken || !authUser?.isAdmin || !ADMIN_SEHRI_ANALYTICS_API_URL) {
      return;
    }

    setAdminSehriAnalyticsLoading(true);
    setAdminSehriAnalyticsError('');

    try {
      const query = new URLSearchParams();
      query.set('days', '7');
      if (adminSehriDateFrom) {
        query.set('date_from', adminSehriDateFrom);
      }
      if (adminSehriDateTo) {
        query.set('date_to', adminSehriDateTo);
      }
      const separator = ADMIN_SEHRI_ANALYTICS_API_URL.includes('?') ? '&' : '?';
      const response = await fetch(`${ADMIN_SEHRI_ANALYTICS_API_URL}${separator}${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to load Sehri analytics.'));
      }

      const payload = await response.json().catch(() => ({}));
      setAdminSehriAnalytics(payload || null);
    } catch (error) {
      console.error('Failed to load Sehri analytics:', error);
      setAdminSehriAnalytics(null);
      setAdminSehriAnalyticsError(error.message || 'Could not load Sehri analytics.');
    } finally {
      setAdminSehriAnalyticsLoading(false);
    }
  }, [authToken, authUser?.isAdmin, adminSehriDateFrom, adminSehriDateTo, parseApiError]);

  const downloadSehriRequestsExcel = useCallback(async () => {
    if (!authToken || !authUser?.isAdmin || !ADMIN_SEHRI_EXPORT_API_URL) {
      return;
    }
    if (adminSehriDateFrom && adminSehriDateTo && adminSehriDateFrom > adminSehriDateTo) {
      alert('From date cannot be after To date.');
      return;
    }

    setAdminSehriExportLoading(true);
    try {
      const query = new URLSearchParams();
      if (adminSehriDateFrom) {
        query.set('date_from', adminSehriDateFrom);
      }
      if (adminSehriDateTo) {
        query.set('date_to', adminSehriDateTo);
      }
      const separator = ADMIN_SEHRI_EXPORT_API_URL.includes('?') ? '&' : '?';
      const response = await fetch(`${ADMIN_SEHRI_EXPORT_API_URL}${separator}${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to export Sehri requests.'));
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('content-disposition') || '';
      const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const fallbackName = `sehri-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      const fileName = fileNameMatch?.[1] || fallbackName;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Sehri export failed:', error);
      alert(error.message || 'Could not download Sehri requests.');
    } finally {
      setAdminSehriExportLoading(false);
    }
  }, [authToken, authUser?.isAdmin, adminSehriDateFrom, adminSehriDateTo, parseApiError]);

  const handleAdminSubmissionAction = useCallback(async (submissionId, status) => {
    if (!authToken || !authUser?.isAdmin || !submissionId) {
      return;
    }

    setAdminActionLoadingById(prev => ({
      ...prev,
      [submissionId]: status,
    }));

    try {
      const response = await fetch(`${ADMIN_PROVIDER_SUBMISSIONS_API_URL}/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, `Failed to ${status} provider submission.`));
      }

      const payload = await response.json().catch(() => ({}));
      if (payload.message) {
        alert(payload.message);
      }

      await fetchAdminProviderSubmissions();
      setProvidersPage(1);
    } catch (error) {
      console.error(`Failed to ${status} submission:`, error);
      alert(error.message || `Could not ${status} this submission.`);
    } finally {
      setAdminActionLoadingById(prev => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    }
  }, [authToken, authUser?.isAdmin, fetchAdminProviderSubmissions, parseApiError]);

  useEffect(() => {
    if (activeSection !== 'admin' || !authUser?.isAdmin) {
      return;
    }
    fetchAdminProviderSubmissions();
    fetchAdminSehriRequests();
    fetchAdminSehriAnalytics();
  }, [
    activeSection,
    authUser?.isAdmin,
    fetchAdminProviderSubmissions,
    fetchAdminSehriRequests,
    fetchAdminSehriAnalytics,
  ]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    const email = authFormData.email.trim();
    const password = authFormData.password;
    const name = authFormData.name.trim();
    const isRegisterFlow = AUTH_ALLOW_REGISTRATION && isRegisterMode;

    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }
    if (isRegisterFlow && !name) {
      setAuthError('Name is required.');
      return;
    }
    if (!validateCaptcha('auth')) {
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const authBaseUrl = AUTH_API_BASE_URL.replace(/\/+$/, '');

      if (isRegisterFlow) {
        const registerResponse = await fetch(`${authBaseUrl}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        if (!registerResponse.ok) {
          throw new Error(await parseApiError(registerResponse, 'Registration failed.'));
        }
      }

      const loginResponse = await fetch(`${authBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        throw new Error(await parseApiError(loginResponse, 'Login failed.'));
      }

      const payload = await loginResponse.json();
      if (!payload?.token || !payload?.user) {
        throw new Error('Invalid auth response.');
      }

      setAuthToken(payload.token);
      setAuthUser(payload.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, payload.token);
      }

      setAuthFormData({ name: '', email: '', password: '' });
      refreshCaptcha('auth');
      closeAuthModal();
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthError(error.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setProfileError('');
    setProfileMessage('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!authToken) {
      setAuthError('Please login to continue.');
      setIsRegisterMode(false);
      setShowAuthModal(true);
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const authBaseUrl = AUTH_API_BASE_URL.replace(/\/+$/, '');
      const response = await fetch(`${authBaseUrl}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(profileFormData),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to update profile.'));
      }

      const payload = await response.json();
      if (payload?.user) {
        setAuthUser(payload.user);
      }
      setProfileMessage(payload?.message || 'Profile updated successfully.');
    } catch (error) {
      console.error('Profile update failed:', error);
      setProfileError(error.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const requireAuth = useCallback((action) => {
    if (authUser) {
      action();
      return;
    }
    setAuthError('Please login to continue.');
    setIsRegisterMode(false);
    setShowAuthModal(true);
  }, [authUser]);

  const requireChatbotAuth = useCallback(() => {
    if (authUser) {
      return true;
    }
    setAuthError('Please login to use the chatbot.');
    setIsRegisterMode(false);
    setShowAuthModal(true);
    return false;
  }, [authUser]);

  const handleLogout = useCallback(async () => {
    const token = authToken;
    setAuthUser(null);
    setAuthToken('');
    setShowAuthModal(false);
    setShowChatbot(false);
    setProfileMessage('');
    setProfileError('');
    setAdminSubmissions([]);
    setAdminSubmissionsError('');
    setAdminActionLoadingById({});
    setAdminSehriRequests([]);
    setAdminSehriRequestsError('');
    setAdminSehriAnalytics(null);
    setAdminSehriAnalyticsError('');
    navigateToSection(DEFAULT_SECTION);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }

    if (!token) {
      return;
    }

    try {
      const authBaseUrl = AUTH_API_BASE_URL.replace(/\/+$/, '');
      await fetch(`${authBaseUrl}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }, [authToken, navigateToSection]);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateCaptcha('provider')) {
      return;
    }

    if (!PROVIDER_SUBMISSIONS_API_URL) {
      alert('Provider submission API is not configured. Set REACT_APP_PROVIDER_SUBMISSIONS_API_URL.');
      return;
    }

    setProviderSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(PROVIDER_SUBMISSIONS_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to submit provider request.'));
      }

      const payload = await response.json().catch(() => ({}));
      alert(
        payload.message ||
        `Thank you! We've received your request for "${formData.providerName}".`
      );

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
      refreshCaptcha('provider');
      setShowRequestForm(false);
    } catch (error) {
      console.error('Provider submission failed:', error);
      alert(error.message || 'Could not submit provider request. Please try again.');
    } finally {
      setProviderSubmitting(false);
    }
  };

  const handleSehriRequestChange = (e) => {
    const { name, value } = e.target;
    setSehriRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSehriRequestSubmit = async (e) => {
    e.preventDefault();
    if (!validateCaptcha('sehri')) {
      return;
    }

    if (!SEHRI_REQUESTS_API_URL) {
      alert('Sehri request API is not configured. Set REACT_APP_SEHRI_REQUESTS_API_URL.');
      return;
    }

    setSehriRequestSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(SEHRI_REQUESTS_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName: sehriRequestData.fullName,
          mobileNumber: sehriRequestData.mobileNumber,
          gender: sehriRequestData.gender,
          location: sehriRequestData.location,
          boxCount: parseInt(sehriRequestData.boxCount, 10) || 1,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to submit Sehri request.'));
      }

      const payload = await response.json().catch(() => ({}));
      alert(payload.message || `Thanks ${sehriRequestData.fullName}! Your Sehri request has been received.`);

      setSehriRequestData({
        fullName: '',
        gender: '',
        mobileNumber: '',
        location: '',
        boxCount: '1'
      });
      refreshCaptcha('sehri');
    } catch (error) {
      console.error('Sehri request submission failed:', error);
      alert(error.message || 'Could not submit Sehri request. Please try again.');
    } finally {
      setSehriRequestSubmitting(false);
    }
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!validateCaptcha('feedback')) {
      return;
    }

    console.log('Feedback Submitted:', feedbackData);
    alert('Thank you for your feedback! We appreciate your support.');

    setFeedbackData({
      name: '',
      email: '',
      rating: '5',
      message: ''
    });
    refreshCaptcha('feedback');
    setShowFeedbackForm(false);
  };

  // Handle chatbot message
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!requireChatbotAuth()) {
      return;
    }

    if (!CHATBOT_API_URL) {
      setChatMessages(prev => [
        ...prev,
        {
          type: 'bot',
          text: 'Chatbot is not configured. Set REACT_APP_CHATBOT_API_URL in frontend environment variables.',
        },
      ]);
      setChatInput('');
      return;
    }

    // Add user message
    const userMessage = { type: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);

    // Call backend API for bot response
    fetch(CHATBOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: chatInput })
    })
    .then(async response => {
      if (!response.ok) {
        throw new Error(await parseApiError(response, `Request failed with status ${response.status}`));
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const rawText = await response.text();
        return { response: rawText || 'Received empty response from server.' };
      }

      return response.json();
    })
    .then(data => {
      if (data.response) {
        setChatMessages(prev => [...prev, { type: 'bot', text: data.response }]);
      } else if (data.error) {
        setChatMessages(prev => [...prev, { type: 'bot', text: data.error }]);
      }
    })
    .catch(error => {
      console.error('Chatbot error:', error);
      setChatMessages(prev => [...prev, { type: 'bot', text: `Chatbot error: ${error.message}` }]);
    });

    setChatInput('');
  };

  const handlePrayerPeriodChange = useCallback(() => {
    // Keep the website theme static regardless of prayer period.
  }, []);

  const headerCardGradientClass = UI_GRADIENT_BY_PERIOD.isha;
  const isDarkUiTheme = DARK_UI_PERIODS.has('isha');
  const headerTextClass = isDarkUiTheme ? 'text-white' : 'text-slate-900';
  const headerSubTextClass = isDarkUiTheme ? 'text-white/85' : 'text-slate-800';
  const navSectionClass = isDarkUiTheme
    ? `bg-gradient-to-r ${headerCardGradientClass} border-b border-white/20`
    : `bg-gradient-to-r ${headerCardGradientClass} border-b border-white/70`;
  const navActiveButtonClass = isDarkUiTheme
    ? 'bg-white/20 text-white border-white/40 shadow-md'
    : 'bg-white/80 text-slate-900 border-white/80 shadow-md';
  const navInactiveButtonClass = isDarkUiTheme
    ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
    : 'bg-white/55 text-slate-900 border-white/70 hover:bg-white/75';
  const primaryTimingButtonClass = isDarkUiTheme
    ? `bg-gradient-to-r ${headerCardGradientClass} text-white hover:opacity-95`
    : `bg-gradient-to-r ${headerCardGradientClass} text-slate-900 hover:opacity-95`;
  const overlayTextClass = isDarkUiTheme ? 'text-white' : 'text-slate-900';
  const overlayMutedTextClass = isDarkUiTheme ? 'text-white/80' : 'text-slate-700';
  const overlayIconClass = isDarkUiTheme ? 'text-white/70' : 'text-slate-500';
  const overlayStrongTextClass = isDarkUiTheme ? 'text-white' : 'text-slate-950';
  const overlayButtonClass = isDarkUiTheme
    ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
    : 'border-white/80 bg-white/60 text-slate-900 hover:bg-white/80';
  const calendarPanelClass = isDarkUiTheme
    ? `bg-gradient-to-br ${headerCardGradientClass} border border-white/25`
    : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100';
  const calendarLabelClass = isDarkUiTheme ? 'text-white/85' : 'text-gray-700';
  const calendarValueClass = isDarkUiTheme ? 'text-white' : 'text-gray-900';
  const calendarActionClass = isDarkUiTheme
    ? 'text-white/95 hover:text-white underline decoration-white/60'
    : 'text-purple-700 hover:text-purple-800 underline decoration-dotted';
  const calendarModalSurfaceClass = isDarkUiTheme
    ? 'bg-slate-950 border border-white/20'
    : 'bg-white';
  const calendarModalNoteClass = isDarkUiTheme ? 'text-white/80' : 'text-gray-600';
  const calendarTableBorderClass = isDarkUiTheme ? 'border-white/15' : 'border-gray-200';
  const calendarTableHeadClass = isDarkUiTheme
    ? `bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass}`
    : 'bg-indigo-50 text-gray-800';
  const calendarTableBodyDividerClass = isDarkUiTheme ? 'divide-white/10' : 'divide-gray-100';
  const calendarRowEvenClass = isDarkUiTheme ? 'bg-white/5' : 'bg-white';
  const calendarRowOddClass = isDarkUiTheme ? 'bg-white/10' : 'bg-gray-50';
  const calendarTableStrongTextClass = isDarkUiTheme ? 'text-white' : 'text-gray-800';
  const calendarTableMutedTextClass = isDarkUiTheme ? 'text-white/85' : 'text-gray-700';
  const calendarControlInputClass = isDarkUiTheme
    ? 'w-full px-3 py-2 rounded-lg border border-white/20 bg-slate-900 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30'
    : 'w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-200';
  const calendarControlChipClass = isDarkUiTheme
    ? 'px-3 py-1.5 rounded-full text-xs font-semibold border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors'
    : 'px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors';
  const calendarSelectedCardClass = isDarkUiTheme
    ? 'rounded-lg border border-white/15 bg-white/5 p-3 sm:p-4 mb-4'
    : 'rounded-lg border border-indigo-100 bg-indigo-50 p-3 sm:p-4 mb-4';
  const calendarSelectedBadgeClass = isDarkUiTheme
    ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200'
    : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700';
  const ledAdPanelClass = isDarkUiTheme
    ? 'bg-gradient-to-br from-indigo-950/95 via-blue-950/90 to-slate-900/95 border border-white/20'
    : 'bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-800 border border-indigo-200';
  const ledAdLabelClass = isDarkUiTheme ? 'text-sky-200/90' : 'text-sky-100';
  const ledAdTextClass = isDarkUiTheme ? 'text-sky-100' : 'text-white';
  const ledAdSourceClass = isDarkUiTheme ? 'text-white/75' : 'text-white/80';
  const ledAdButtonClass = isDarkUiTheme
    ? 'h-7 min-w-7 px-2 rounded-md text-xs font-semibold border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors'
    : 'h-7 min-w-7 px-2 rounded-md text-xs font-semibold border border-white/40 text-white bg-white/15 hover:bg-white/25 transition-colors';
  const isAdminUser = Boolean(authUser?.isAdmin);
  const hasInvalidAdminSehriDateRange = Boolean(
    adminSehriDateFrom
    && adminSehriDateTo
    && adminSehriDateFrom > adminSehriDateTo
  );
  const shouldShowNavbar = SHOW_NAVBAR || isAdminUser || activeSection === 'admin';
  const authDisplayName = (authUser?.name || '').trim() || 'User';
  const authInitials = authDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const captchaBlockClass = 'bg-gray-50 border-gray-200';
  const captchaTextClass = 'text-gray-800';

  const openAdminDatePicker = useCallback((inputRef) => {
    const input = inputRef?.current;
    if (!input) {
      return;
    }
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  }, []);

  const renderCaptchaField = (formKey) => {
    const challenge = captchaByForm[formKey];
    const value = captchaInputByForm[formKey] || '';
    const error = captchaErrorByForm[formKey] || '';

    return (
      <div className={`rounded-lg border p-3 ${captchaBlockClass}`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className={`text-sm font-semibold ${captchaTextClass}`}>
            Captcha: solve {challenge?.question || '--'}
          </p>
          <button
            type="button"
            onClick={() => refreshCaptcha(formKey)}
            className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors border border-sky-300 bg-sky-200 text-slate-900 hover:bg-sky-300"
          >
            Refresh
          </button>
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleCaptchaInputChange(formKey, e.target.value)}
          placeholder="Enter answer"
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-sm bg-white text-gray-900"
        />
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
      </div>
    );
  };

  if (showEntryAnimation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-[82vw] sm:w-[64vw] lg:w-[46vw] max-w-[680px] min-w-[280px] aspect-square">
          <DotLottieReact
            src={ENTRY_LOTTIE_URL}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-static min-h-screen transition-all duration-700 ${skyThemeClass}`}>
      {/* Header */}
      <header className={`bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} transition-all duration-700 shadow-lg sticky top-0 z-30`}>
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                SehriConnect
              </h1>
            </div>
            {authUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigateToSection('profile')}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-2.5 py-1.5 hover:bg-white/20 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-sm font-bold">
                    {authInitials || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">{authDisplayName}</p>
                    <p className={`${headerSubTextClass} text-[11px] leading-tight`}>{authUser.email}</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs sm:text-sm rounded-full font-semibold border border-white/35 bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError('');
                  setIsRegisterMode(false);
                  setShowAuthModal(true);
                }}
                className="self-start md:self-auto px-4 py-2 text-sm rounded-full font-semibold border border-white/35 bg-white/10 hover:bg-white/20 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      {shouldShowNavbar && (
        <section className={`${navSectionClass} transition-all duration-700 backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-3">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => navigateToSection('sehri')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${
                activeSection === 'sehri'
                  ? navActiveButtonClass
                  : navInactiveButtonClass
              }`}
            >
              Request Sehri
            </button>
            <button
              onClick={() => navigateToSection('home')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${
                activeSection === 'home'
                  ? navActiveButtonClass
                  : navInactiveButtonClass
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                navigateToSection('home');
                requireAuth(() => setShowRequestForm(true));
              }}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${navInactiveButtonClass}`}
            >
              Register Provider
            </button>
            <button
              onClick={() => navigateToSection('ahadees')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${
                activeSection === 'ahadees'
                  ? navActiveButtonClass
                  : navInactiveButtonClass
              }`}
            >
              Ahadees
            </button>
            <button
              onClick={() => navigateToSection('about')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${
                activeSection === 'about'
                  ? navActiveButtonClass
                  : navInactiveButtonClass
              }`}
            >
              About Us
            </button>
            {isAdminUser && (
              <button
                onClick={() => navigateToSection('admin')}
                className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${
                  activeSection === 'admin'
                    ? navActiveButtonClass
                    : navInactiveButtonClass
                }`}
              >
                Admin
              </button>
            )}
            {authUser && (
              <button
                onClick={() => navigateToSection('profile')}
                className={`px-4 py-2 text-sm rounded-full font-semibold transition-all whitespace-nowrap border ${
                  activeSection === 'profile'
                    ? navActiveButtonClass
                    : navInactiveButtonClass
                }`}
              >
                My Profile
              </button>
            )}
          </nav>
        </div>
        </section>
      )}
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Prayer Times Section */}
        {SHOW_NAMAZ_TIMINGS_SECTION && (
          <section className="mb-6">
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 sm:p-5">
            {!loading && nextPrayer && (
              <div className={`mb-4 bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} transition-all duration-700 rounded-lg px-3 py-2.5`}>
                <div className="flex items-center justify-center">
                  <PrayerCountdownRing
                    timings={prayerTimes}
                    onPeriodChange={handlePrayerPeriodChange}
                    isDarkTheme={isDarkUiTheme}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading prayer times...</p>
              </div>
            ) : prayerTimes ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">ðŸŒ…</span>
                    <p className="text-xs font-semibold text-gray-700">Fajr</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{prayerTimes.Fajr}</p>
                  <p className="text-xs text-gray-500">Sehri Ends</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">â˜€ï¸</span>
                    <p className="text-xs font-semibold text-gray-700">Sunrise</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{prayerTimes.Sunrise}</p>
                  <p className="text-xs text-gray-500">Shuruq</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">ðŸ•Œ</span>
                    <p className="text-xs font-semibold text-gray-700">Dhuhr</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{prayerTimes.Dhuhr}</p>
                  <p className="text-xs text-gray-500">Noon</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">ðŸŒ¤ï¸</span>
                    <p className="text-xs font-semibold text-gray-700">Asr</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{prayerTimes.Asr}</p>
                  <p className="text-xs text-gray-500">Afternoon</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">ðŸŒ‡</span>
                    <p className="text-xs font-semibold text-gray-700">Maghrib</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{prayerTimes.Maghrib}</p>
                  <p className="text-xs text-gray-500">Iftar Time</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-2.5 border border-indigo-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">ðŸŒ™</span>
                    <p className="text-xs font-semibold text-gray-700">Isha</p>
                  </div>
                  <p className="text-base font-bold text-gray-900">{prayerTimes.Isha}</p>
                  <p className="text-xs text-gray-500">Night</p>
                </div>
              </div>
            ) : null}

            {!loading && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className={`${calendarPanelClass} rounded-lg p-3 lg:col-span-2`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${calendarLabelClass}`}>
                    Islamic Calendar (Hijri)
                  </p>
                  <p className={`text-lg font-bold mt-1 ${calendarValueClass}`}>
                    {calendarInfo.hijriDay && calendarInfo.hijriMonth && calendarInfo.hijriYear
                      ? `${calendarInfo.hijriDay} ${calendarInfo.hijriMonth} ${calendarInfo.hijriYear} AH`
                      : 'Hijri date unavailable'}
                  </p>
                  {calendarInfo.hijriWeekday && (
                    <p className={`text-sm mt-1 ${calendarLabelClass}`}>{calendarInfo.hijriWeekday}</p>
                  )}
                  <button
                    type="button"
                    onClick={openRamadanCalendarModal}
                    className={`mt-3 text-sm font-semibold ${calendarActionClass}`}
                  >
                    View Sehri/Iftar timings for Ramadan 2026
                  </button>
                </div>

                <div className={`${ledAdPanelClass} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${ledAdLabelClass}`}>
                      Reminder
                    </p>
                  </div>
                  <p
                    className={`text-[12px] leading-relaxed font-medium ${ledAdTextClass}`}
                  >
                    {activeIslamicQuote.text}
                  </p>
                  <p className={`mt-2 text-[10px] font-semibold ${ledAdSourceClass}`}>
                    {activeIslamicQuote.source}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePreviousIslamicQuote}
                      className={ledAdButtonClass}
                      aria-label="Previous quote"
                    >
                      â€¹
                    </button>
                    <button
                      type="button"
                      onClick={handleRandomIslamicQuote}
                      className={`${ledAdButtonClass} px-2.5`}
                    >
                      Random
                    </button>
                    <button
                      type="button"
                      onClick={handleNextIslamicQuote}
                      className={ledAdButtonClass}
                      aria-label="Next quote"
                    >
                      â€º
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </section>
        )}

        {/* Sehri Request Section */}
        {activeSection === 'sehri' && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className={`bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} p-5 sm:p-6`}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Need Sehri? Submit a Request</h2>
              </div>

              <form onSubmit={handleSehriRequestSubmit} className="p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sehriFullName" className="block text-gray-700 font-semibold mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="sehriFullName"
                      name="fullName"
                      value={sehriRequestData.fullName}
                      onChange={handleSehriRequestChange}
                      required
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="sehriMobileNumber" className="block text-gray-700 font-semibold mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="sehriMobileNumber"
                      name="mobileNumber"
                      value={sehriRequestData.mobileNumber}
                      onChange={handleSehriRequestChange}
                      required
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sehriGender" className="block text-gray-700 font-semibold mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="sehriGender"
                      name="gender"
                      value={sehriRequestData.gender}
                      onChange={handleSehriRequestChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sehriLocation" className="block text-gray-700 font-semibold mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="sehriLocation"
                      name="location"
                      value={sehriRequestData.location}
                      onChange={handleSehriRequestChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      <option value="">Select location</option>
                      {SEHRI_REQUEST_LOCATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="sehriBoxCount" className="block text-gray-700 font-semibold mb-2">
                    No. of Boxes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="sehriBoxCount"
                    name="boxCount"
                    min="1"
                    value={sehriRequestData.boxCount}
                    onChange={handleSehriRequestChange}
                    required
                    placeholder="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>

                {renderCaptchaField('sehri')}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sehriRequestSubmitting}
                    className={`w-full px-6 py-3 ${primaryTimingButtonClass} font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {sehriRequestSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>

              <div className="border-t border-gray-100 px-4 sm:px-6 pb-5 sm:pb-6 pt-5">
                <div className={`rounded-xl border border-white/20 bg-gradient-to-r ${headerCardGradientClass} p-4`}>
                  <p className={`text-lg sm:text-xl font-bold mb-2 ${headerTextClass}`}>Contact: Sadiq Rahmathulla</p>
                  <p className={`text-lg sm:text-xl font-bold ${headerTextClass}`}>Phone: 8951669581</p>
                </div>
                <div className={`mt-3 rounded-xl border border-white/20 bg-gradient-to-r ${headerCardGradientClass} p-4`}>
                  <p className={`text-sm sm:text-base font-semibold ${headerSubTextClass}`}>
                    To find more sehri options please visit{' '}
                    <a
                      href="https://bangaloresehri.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`underline font-bold ${headerTextClass} opacity-95 hover:opacity-80`}
                    >
                      https://bangaloresehri.in/
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home Section */}
        {activeSection === 'home' && (
          <>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="search" className={`block ${overlayTextClass} font-semibold mb-2`}>
                    Search by Location
                  </label>
                  <div className="relative">
                    <input
                      id="search"
                      type="text"
                      placeholder="Enter location (e.g., Koramangala, Indiranagar...)"
                      value={searchLocation}
                      onChange={(e) => {
                        setSearchLocation(e.target.value);
                        setProvidersPageLoadingDirection('');
                        setProvidersPage(1);
                      }}
                      className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <svg
                      className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${overlayIconClass}`}
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

                <div>
                  <label htmlFor="locationFilter" className={`block ${overlayTextClass} font-semibold mb-2`}>
                    Filter by Location
                  </label>
                  <select
                    id="locationFilter"
                    value={locationFilter}
                    onChange={(e) => {
                      setLocationFilter(e.target.value);
                      setProvidersPageLoadingDirection('');
                      setProvidersPage(1);
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all bg-white"
                  >
                    <option value="">All Locations</option>
                    {locationFilterOptions.map((locationOption) => (
                      <option key={locationOption} value={locationOption}>
                        {locationOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className={`${overlayTextClass} text-center`}>
                Found <span className={`font-bold ${overlayStrongTextClass}`}>{providersTotal}</span> Sehri providers
                {searchLocation && (
                  <span>
                    {' '}for "<span className="font-semibold">{searchLocation}</span>"
                  </span>
                )}
                {locationFilter && (
                  <span>
                    {' '}filtered to "<span className="font-semibold">{locationFilter}</span>"
                  </span>
                )}
                {providersTotal > 0 && (
                  <span> (showing {providersStart}-{providersEnd})</span>
                )}
              </p>
              {providersLoading && (
                <p className={`text-center text-sm mt-2 ${overlayMutedTextClass}`}>Loading providers from database...</p>
              )}
              {providersError && (
                <p className={`text-center text-sm mt-2 ${overlayMutedTextClass}`}>
                  Showing fallback list because API failed: {providersError}
                </p>
              )}
            </div>

            {/* Provider Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Card Image/Icon */}
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-28 sm:h-32 flex items-center justify-center relative">
                    <span className="text-5xl sm:text-6xl">{provider.image}</span>
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                      provider.pricing === 'Free' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {provider.pricing}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    <div className="mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {provider.name}
                        </h3>
                        {provider.isVerified !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.42l2.293 2.294 6.793-6.794a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
                          provider.type === 'Masjid' ? 'bg-purple-100 text-purple-700' :
                          provider.type === 'Volunteer' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {provider.type}
                        </span>
                        {provider.section && (
                          <span className="inline-block text-xs font-semibold px-2 py-1 rounded bg-amber-100 text-amber-700">
                            {provider.section}
                          </span>
                        )}
                      </div>
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
                      {provider.zone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Zone:</span> {provider.zone}
                        </p>
                      )}
                      {provider.contact && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Contact:</span> {provider.contact}
                        </p>
                      )}
                      {provider.phone && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-700">Phone:</span> {provider.phone}
                        </p>
                      )}
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Food Offered</p>
                      <p className="text-sm text-gray-700 font-medium">{provider.foodType}</p>
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
                          `ðŸŒ™ *Sehri at ${provider.name}*\n` +
                          `${provider.type === 'Masjid' ? 'ðŸ•Œ' : provider.type === 'Volunteer' ? 'ðŸ¤' : 'ðŸ½ï¸'} Type: ${provider.type}\n` +
                          `ðŸ’° ${provider.pricing}\n\n` +
                          `ðŸ“ Location: ${provider.address}\n` +
                          `ðŸ• Opens: ${provider.opens}\n` +
                          `ðŸ½ï¸ Food: ${provider.foodType}\n\n` +
                          `Found on BangaloreSehri`
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

            {providersTotalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviousProvidersPage}
                  disabled={currentProvidersPage === 1 || providersLoading}
                  className={`px-4 py-2 rounded-lg border font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${overlayButtonClass}`}
                >
                  {providersLoading && providersPageLoadingDirection === 'prev' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"></span>
                      Loading...
                    </span>
                  ) : (
                    'Previous'
                  )}
                </button>
                <span className={`text-sm font-semibold ${overlayTextClass}`}>
                  Page {currentProvidersPage} of {providersTotalPages}
                </span>
                <button
                  type="button"
                  onClick={handleNextProvidersPage}
                  disabled={currentProvidersPage === providersTotalPages || providersLoading}
                  className={`px-4 py-2 rounded-lg border font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${overlayButtonClass}`}
                >
                  {providersLoading && providersPageLoadingDirection === 'next' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"></span>
                      Loading...
                    </span>
                  ) : (
                    'Next'
                  )}
                </button>
              </div>
            )}

            {/* No Results Message */}
            {!providersLoading && providersTotal === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl sm:text-6xl mb-4">ðŸ”</div>
                <h3 className={`text-2xl font-bold mb-2 ${overlayTextClass}`}>
                  No Sehri providers found
                </h3>
                <p className={overlayMutedTextClass}>
                  Try a different search or choose another location filter like Shivajinagar, Koramangala, Indiranagar, or Whitefield
                </p>
              </div>
            )}
          </>
        )}

        {/* Ahadees Section */}
        {activeSection === 'ahadees' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
              <div className="text-center mb-8 max-w-3xl mx-auto">
                <div className="text-5xl sm:text-6xl mb-4">ðŸ“–</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  Ramadan Ahadees
                </h2>
                <p className="text-lg text-gray-600">
                  Authentic reminders for fasting, charity, suhoor, iftar, and the last ten nights.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {RAMADAN_AHADEES.map((hadith) => (
                  <article
                    key={hadith.id}
                    className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 mb-2">
                      {hadith.topic}
                    </p>
                    <p className="text-gray-800 leading-relaxed">{hadith.text}</p>
                    <p className="mt-3 text-xs font-medium text-gray-600">{hadith.source}</p>
                  </article>
                ))}
              </div>

              <div className={`mt-6 rounded-xl border border-white/25 bg-gradient-to-r ${headerCardGradientClass} p-4 sm:p-5`}>
                <p className={`text-sm ${headerSubTextClass}`}>
                  Note: For personal religious rulings, please consult a trusted local scholar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Section */}
        {activeSection === 'admin' && isAdminUser && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
              <div className="mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Use the menu to manage providers and Sehri requests.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminActiveMenu('providers')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      adminActiveMenu === 'providers'
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Provider Requests
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminActiveMenu('sehri')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      adminActiveMenu === 'sehri'
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    View Sehri Requests
                  </button>
                </div>
              </div>

              {adminActiveMenu === 'providers' && (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Provider Approval Admin</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Review provider submissions. Only approved submissions are published.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <select
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                      </select>
                      <button
                        type="button"
                        onClick={fetchAdminProviderSubmissions}
                        disabled={adminSubmissionsLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${overlayButtonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {adminSubmissionsLoading ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                  </div>

              {adminSubmissionsLoading && (
                <p className="text-sm text-gray-600 mb-4">Loading provider submissions...</p>
              )}
              {adminSubmissionsError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  {adminSubmissionsError}
                </p>
              )}

              {!adminSubmissionsLoading && !adminSubmissionsError && adminSubmissions.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-gray-600">
                  No provider submissions found for this status.
                </div>
              )}

              <div className="space-y-4">
                {adminSubmissions.map((submission) => {
                  const submissionStatus = (submission.status || '').toLowerCase();
                  const actionInProgress = adminActionLoadingById[submission.id] || '';
                  const canReview = submissionStatus === 'pending';
                  const statusBadgeClass =
                    submissionStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : submissionStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700';

                  return (
                    <article key={submission.id} className="rounded-xl border border-gray-200 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{submission.providerName || 'Unnamed Provider'}</h3>
                          <p className="text-sm text-gray-600">
                            {submission.providerType || 'Unknown'} â€¢ {submission.pricing || 'N/A'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${statusBadgeClass}`}>
                          {submissionStatus || 'pending'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm">
                        <p><span className="font-semibold text-gray-700">Location:</span> <span className="text-gray-600">{submission.location || '-'}</span></p>
                        <p><span className="font-semibold text-gray-700">Address:</span> <span className="text-gray-600">{submission.address || '-'}</span></p>
                        <p><span className="font-semibold text-gray-700">Opens:</span> <span className="text-gray-600">{submission.opensAt || '-'}</span></p>
                        <p><span className="font-semibold text-gray-700">Phone:</span> <span className="text-gray-600">{submission.phoneNumber || '-'}</span></p>
                        <p><span className="font-semibold text-gray-700">Food:</span> <span className="text-gray-600">{submission.foodType || '-'}</span></p>
                        <p><span className="font-semibold text-gray-700">Submitted By:</span> <span className="text-gray-600">{submission.submittedByName || submission.submittedByEmail || 'Guest'}</span></p>
                      </div>

                      {submission.additionalInfo && (
                        <p className="mt-3 text-sm text-gray-700">
                          <span className="font-semibold">Notes:</span> {submission.additionalInfo}
                        </p>
                      )}
                      {submission.reviewNote && (
                        <p className="mt-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                          <span className="font-semibold">Review Note:</span> {submission.reviewNote}
                        </p>
                      )}

                      {canReview && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdminSubmissionAction(submission.id, 'approved')}
                            disabled={Boolean(actionInProgress)}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionInProgress === 'approved' ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminSubmissionAction(submission.id, 'rejected')}
                            disabled={Boolean(actionInProgress)}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {actionInProgress === 'rejected' ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
                </>
              )}

              {adminActiveMenu === 'sehri' && (
                <div className="pt-1">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Sehri Request Admin</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      View community Sehri requests, download Excel, and monitor basic analytics.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-end">
                    <label className="flex flex-col text-xs font-semibold text-gray-600">
                      From
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          ref={adminSehriDateFromInputRef}
                          type="date"
                          value={adminSehriDateFrom}
                          onChange={(e) => setAdminSehriDateFrom(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          aria-label="From date"
                        />
                        <button
                          type="button"
                          onClick={() => openAdminDatePicker(adminSehriDateFromInputRef)}
                          className="h-9 w-9 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                          aria-label="Open from date calendar"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2"></rect>
                            <path d="M16 3v4M8 3v4M3 10h18" strokeWidth="2" strokeLinecap="round"></path>
                          </svg>
                        </button>
                      </div>
                    </label>
                    <label className="flex flex-col text-xs font-semibold text-gray-600">
                      To
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          ref={adminSehriDateToInputRef}
                          type="date"
                          value={adminSehriDateTo}
                          onChange={(e) => setAdminSehriDateTo(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                          aria-label="To date"
                        />
                        <button
                          type="button"
                          onClick={() => openAdminDatePicker(adminSehriDateToInputRef)}
                          className="h-9 w-9 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                          aria-label="Open to date calendar"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2"></rect>
                            <path d="M16 3v4M8 3v4M3 10h18" strokeWidth="2" strokeLinecap="round"></path>
                          </svg>
                        </button>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSehriDateFrom('');
                        setAdminSehriDateTo('');
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear Dates
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        fetchAdminSehriRequests();
                        fetchAdminSehriAnalytics();
                      }}
                      disabled={adminSehriRequestsLoading || adminSehriAnalyticsLoading || hasInvalidAdminSehriDateRange}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border ${overlayButtonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {(adminSehriRequestsLoading || adminSehriAnalyticsLoading) ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                      type="button"
                      onClick={downloadSehriRequestsExcel}
                      disabled={adminSehriExportLoading || hasInvalidAdminSehriDateRange}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {adminSehriExportLoading ? 'Preparing Excel...' : 'Download Excel'}
                    </button>
                  </div>
                </div>

                {hasInvalidAdminSehriDateRange && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                    From date cannot be after To date.
                  </p>
                )}
                <p className="text-xs text-gray-500 mb-4">
                  Download Excel uses the selected From/To date range.
                </p>

                {adminSehriAnalyticsLoading && (
                  <p className="text-sm text-gray-600 mb-4">Loading Sehri analytics...</p>
                )}
                {adminSehriAnalyticsError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                    {adminSehriAnalyticsError}
                  </p>
                )}

                {!adminSehriAnalyticsLoading && !adminSehriAnalyticsError && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700 font-semibold uppercase">Total Requests</p>
                        <p className="text-2xl font-bold text-blue-900">{adminSehriAnalytics?.summary?.totalRequests || 0}</p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs text-amber-700 font-semibold uppercase">Today</p>
                        <p className="text-2xl font-bold text-amber-900">{adminSehriAnalytics?.summary?.todayRequests || 0}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-700 font-semibold uppercase">Boxes Requested</p>
                        <p className="text-2xl font-bold text-emerald-900">{adminSehriAnalytics?.summary?.totalBoxesRequested || 0}</p>
                      </div>
                      <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
                        <p className="text-xs text-purple-700 font-semibold uppercase">Avg Boxes/Request</p>
                        <p className="text-2xl font-bold text-purple-900">{adminSehriAnalytics?.summary?.averageBoxesPerRequest || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Top Locations</p>
                        {(adminSehriAnalytics?.locationBreakdown || adminSehriAnalytics?.cityBreakdown || []).slice(0, 5).map((item) => (
                          <p key={`location-${item.label}`} className="text-sm text-gray-700 flex items-center justify-between">
                            <span>{item.label}</span>
                            <span className="font-semibold">{item.count}</span>
                          </p>
                        ))}
                        {(adminSehriAnalytics?.locationBreakdown || adminSehriAnalytics?.cityBreakdown || []).length === 0 && (
                          <p className="text-sm text-gray-500">No data yet.</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Gender</p>
                        {(adminSehriAnalytics?.genderBreakdown || []).slice(0, 5).map((item) => (
                          <p key={`gender-${item.label}`} className="text-sm text-gray-700 flex items-center justify-between">
                            <span>{item.label}</span>
                            <span className="font-semibold">{item.count}</span>
                          </p>
                        ))}
                        {(adminSehriAnalytics?.genderBreakdown || []).length === 0 && (
                          <p className="text-sm text-gray-500">No data yet.</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Last 7 Days</p>
                        {(adminSehriAnalytics?.lastDaysTrend || []).map((item) => (
                          <p key={`trend-${item.date}`} className="text-sm text-gray-700 flex items-center justify-between">
                            <span>{item.date}</span>
                            <span className="font-semibold">{item.count}</span>
                          </p>
                        ))}
                        {(adminSehriAnalytics?.lastDaysTrend || []).length === 0 && (
                          <p className="text-sm text-gray-500">No data yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {adminSehriRequestsLoading && (
                  <p className="text-sm text-gray-600 mb-4">Loading Sehri requests...</p>
                )}
                {adminSehriRequestsError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                    {adminSehriRequestsError}
                  </p>
                )}

                {!adminSehriRequestsLoading && !adminSehriRequestsError && adminSehriRequests.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-gray-600">
                    No Sehri requests found for the selected date range.
                  </div>
                )}

                <div className="space-y-4">
                  {adminSehriRequests.map((request) => {
                    return (
                      <article key={request.id} className="rounded-xl border border-gray-200 p-4 sm:p-5">
                        <div className="flex flex-col gap-3">
                          <div>
                            <h4 className="text-lg font-bold text-gray-800">{request.fullName || 'Unnamed Request'}</h4>
                            <p className="text-sm text-gray-600">{request.location || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm">
                          <p><span className="font-semibold text-gray-700">Mobile:</span> <span className="text-gray-600">{request.mobileNumber || '-'}</span></p>
                          <p><span className="font-semibold text-gray-700">Gender:</span> <span className="text-gray-600">{request.gender || '-'}</span></p>
                          <p><span className="font-semibold text-gray-700">No. of Boxes:</span> <span className="text-gray-600">{request.boxCount || request.sehriCount || 0}</span></p>
                          <p className="sm:col-span-2 lg:col-span-3"><span className="font-semibold text-gray-700">Location:</span> <span className="text-gray-600">{request.location || '-'}</span></p>
                        </div>

                        <p className="mt-3 text-xs text-gray-500">
                          Requested by: {request.requestedByName || request.requestedByEmail || 'Guest'} |
                          {' '}Source: {request.submissionSource || 'guest'} |
                          {' '}Created: {formatAdminDateTime(request.createdAt)}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {/* About Us Section */}
        {activeSection === 'about' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
              <div className="text-center mb-10 max-w-3xl mx-auto">
                <div className="text-5xl sm:text-6xl mb-4">ðŸŒ™</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  About BangaloreSehri
                </h2>
                <p className="text-lg text-gray-600">
                  Connecting the community with Sehri services during Ramadan
                </p>
              </div>

              <div className="space-y-8 text-left">
                {/* Mission */}
                <div className="border-l-4 border-purple-500 pl-5 sm:pl-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    <span>ðŸŽ¯</span> Our Mission
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    During the blessed month of Ramadan, finding places that serve Sehri (pre-dawn meal) 
                    can be challenging. BangaloreSehri was created to connect the Muslim community 
                    in Bangalore with Masjids offering free Sehri, volunteer groups serving the community, 
                    and restaurants with early morning services. Whether you're looking for free community 
                    Sehri or restaurants, we make it easy to find the perfect place for your pre-fast meal. 

                  </p>
                </div>

                {/* Features */}
                <div className="border-l-4 border-pink-500 pl-5 sm:pl-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    <span>âœ¨</span> What We Offer
                  </h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Real-time Prayer Times:</strong> Accurate prayer times for Bangalore including Fajr (Sehri end time) and Maghrib (Iftar time)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Community Guidance:</strong> Practical help for Sehri, prayer times, and Ramadan routines</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Comprehensive Directory:</strong> Find Masjids with free Sehri, volunteer-run community kitchens, and restaurants across Bangalore</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Free & Paid Options:</strong> Clearly marked to help you find free community Sehri or paid restaurant services</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Location Search:</strong> Find Sehri providers in your area with our easy search feature</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Google Maps Integration:</strong> Get directions to any location instantly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>WhatsApp Sharing:</strong> Share details with family and friends</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>AI Chatbot:</strong> Get instant answers about Sehri, prayer times, and Ramadan queries</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold mt-1">â€¢</span>
                      <span><strong>Community Requests:</strong> Help us grow by submitting new Sehri providers</span>
                    </li>
                  </ul>
                </div>

                {/* Community */}
                <div className="border-l-4 border-indigo-500 pl-5 sm:pl-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    <span>ðŸ¤</span> Community Driven
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    This platform thrives on community contributions. If you know a Masjid offering free Sehri, 
                    a volunteer group serving the community, or a restaurant with early morning service that's 
                    not listed here, please use the "Register as Sehri Provider" form to submit it. Together, we can make 
                    Ramadan easier for everyone in Bangalore.
                  </p>
                  <button
                    onClick={() => {
                      navigateToSection('home');
                      requireAuth(() => setShowRequestForm(true));
                    }}
                    className={`${primaryTimingButtonClass} px-6 py-3 rounded-lg font-semibold transition-all shadow-lg`}
                  >
                    Submit a Sehri Provider
                  </button>
                </div>

                {/* Contact */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    <span>ðŸ“§</span> Get in Touch
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Have suggestions or feedback? Want to partner with us? We'd love to hear from you! 
                    This is a community service built with love for the people of Bangalore.
                  </p>
                </div>

                {/* Ramadan Message */}
                <div className="text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl p-6 sm:p-8">
                  <h3 className="text-2xl font-bold mb-3">Ramadan Mubarak! ðŸŒ™</h3>
                  <p className="text-indigo-100">
                    May this blessed month bring peace, prosperity, and joy to you and your loved ones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && authUser && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
              <div className="mb-6">
                <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${overlayStrongTextClass}`}>
                  My Profile
                </h2>
                <p className={overlayMutedTextClass}>
                  Update your basic information.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profileName" className="block text-gray-700 font-semibold mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="profileName"
                      name="name"
                      value={profileFormData.name}
                      onChange={handleProfileInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="profileEmail" className="block text-gray-700 font-semibold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="profileEmail"
                      value={authUser.email || ''}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 opacity-80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profileGender" className="block text-gray-700 font-semibold mb-2">
                      Gender
                    </label>
                    <select
                      id="profileGender"
                      name="gender"
                      value={profileFormData.gender}
                      onChange={handleProfileInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="profilePhone" className="block text-gray-700 font-semibold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="profilePhone"
                      name="phone"
                      value={profileFormData.phone}
                      onChange={handleProfileInputChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profileCity" className="block text-gray-700 font-semibold mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="profileCity"
                      name="city"
                      value={profileFormData.city}
                      onChange={handleProfileInputChange}
                      placeholder="Bangalore"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="profileAddress" className="block text-gray-700 font-semibold mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      id="profileAddress"
                      name="address"
                      value={profileFormData.address}
                      onChange={handleProfileInputChange}
                      placeholder="House No, Street, Area"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                  </div>
                </div>

                {profileError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {profileError}
                  </p>
                )}
                {profileMessage && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    {profileMessage}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className={`px-6 py-3 ${primaryTimingButtonClass} font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </main>

      {/* Floating Action Button */}
      {activeSection === 'home' && (
        <button
          onClick={() => navigateToSection('sehri')}
          className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 ${primaryTimingButtonClass} p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40 flex items-center gap-2 group`}
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
      {shouldShowChatbotUi && (
        <button
          onClick={() => {
            if (!showChatbot && !requireChatbotAuth()) {
              return;
            }
            setShowChatbot(!showChatbot);
          }}
          className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8 bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-40"
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
      )}

      {/* Chatbot Modal */}
      {shouldShowChatbotUi && showChatbot && (
        <div className="fixed inset-x-2 top-16 bottom-20 sm:inset-x-auto sm:top-auto sm:bottom-24 sm:left-8 sm:w-96 sm:max-w-[calc(100vw-4rem)] sm:h-[500px] sm:max-h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
          {/* Chatbot Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">ðŸ§•</span>
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
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-lg">ðŸ§•</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
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
          <form onSubmit={handleChatSubmit} className="p-3 sm:p-4 bg-white border-t border-gray-200 rounded-b-2xl">
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[94vh] sm:max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} p-4 sm:p-6 rounded-t-2xl sticky top-0 transition-all duration-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">
                    {AUTH_ALLOW_REGISTRATION && isRegisterMode ? 'Create Account' : 'Login'}
                  </h2>
                  <p className={`${headerSubTextClass} text-sm`}>
                    {AUTH_ALLOW_REGISTRATION && isRegisterMode
                      ? 'Register to use chatbot and manage your activity.'
                      : 'Login to continue.'}
                  </p>
                </div>
                <button
                  onClick={closeAuthModal}
                  className={`${headerTextClass} hover:bg-white/20 rounded-full p-2 transition-colors`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-4 sm:p-6 space-y-4">
              {AUTH_ALLOW_REGISTRATION && isRegisterMode && (
                <div>
                  <label htmlFor="authName" className="block text-gray-700 font-semibold mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="authName"
                    name="name"
                    value={authFormData.name}
                    onChange={handleAuthInputChange}
                    required={AUTH_ALLOW_REGISTRATION && isRegisterMode}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
              )}

              <div>
                <label htmlFor="authEmail" className="block text-gray-700 font-semibold mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="authEmail"
                  name="email"
                  value={authFormData.email}
                  onChange={handleAuthInputChange}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              <div>
                <label htmlFor="authPassword" className="block text-gray-700 font-semibold mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="authPassword"
                  name="password"
                  value={authFormData.password}
                  onChange={handleAuthInputChange}
                  required
                  minLength={6}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              {renderCaptchaField('auth')}

              {authError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {authError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className={`flex-1 px-6 py-3 ${primaryTimingButtonClass} font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {authLoading ? 'Please wait...' : (AUTH_ALLOW_REGISTRATION && isRegisterMode ? 'Register' : 'Login')}
                </button>
              </div>

              {AUTH_ALLOW_REGISTRATION && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(prev => !prev);
                    setAuthError('');
                  }}
                  className="w-full text-sm text-purple-700 hover:text-purple-800 font-semibold transition-colors"
                >
                  {isRegisterMode ? 'Already have an account? Login' : 'New here? Create an account'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[94vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} p-4 sm:p-6 rounded-t-2xl sticky top-0 transition-all duration-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">ðŸ½ï¸ Register as Sehri Provider</h2>
                  <p className={`${headerSubTextClass} text-sm`}>
                    Know a Masjid, Volunteer group, or restaurant serving Sehri? Help the community!
                  </p>
                </div>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className={`${headerTextClass} hover:bg-white/20 rounded-full p-2 transition-colors`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-5">
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
                    <option value="Masjid">ðŸ•Œ Masjid</option>
                    <option value="Volunteer">ðŸ¤ Volunteer Group</option>
                    <option value="Restaurant">ðŸ½ï¸ Restaurant</option>
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
                    <option value="Free">ðŸ’š Free</option>
                    <option value="Paid">ðŸ’µ Paid</option>
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

              {renderCaptchaField('provider')}

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
                  disabled={providerSubmitting}
                  className={`flex-1 px-6 py-3 ${primaryTimingButtonClass} font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {providerSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ramadan Calendar Modal */}
      {showRamadanCalendarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className={`${calendarModalSurfaceClass} rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] overflow-hidden`}>
            <div className={`bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} p-4 sm:p-6 rounded-t-2xl sticky top-0`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Bangalore Ramadan Calendar 2026</h2>
                  <p className={`${headerSubTextClass} text-sm`}>
                    Sehri (Suhoor) and Iftar timetable
                  </p>
                </div>
                <button
                  onClick={() => setShowRamadanCalendarModal(false)}
                  className="hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(94vh-88px)] sm:max-h-[calc(90vh-96px)]">
              <p className={`text-sm mb-4 ${calendarModalNoteClass}`}>
                These timings are approximate for Bangalore. Please confirm locally with your nearby mosque.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="sm:col-span-2">
                  <label htmlFor="ramadanCalendarSearch" className={`block text-xs font-semibold mb-1.5 ${calendarLabelClass}`}>
                    Search by date, day, or time
                  </label>
                  <input
                    id="ramadanCalendarSearch"
                    type="text"
                    value={calendarSearchQuery}
                    onChange={(e) => setCalendarSearchQuery(e.target.value)}
                    placeholder="Try: day 21, 01 Mar, 05:20 AM"
                    className={calendarControlInputClass}
                  />
                </div>
                <div>
                  <label htmlFor="ramadanCalendarDaySelect" className={`block text-xs font-semibold mb-1.5 ${calendarLabelClass}`}>
                    Jump to Ramadan day
                  </label>
                  <select
                    id="ramadanCalendarDaySelect"
                    value={selectedRamadanDay}
                    onChange={(e) => setSelectedRamadanDay(parseInt(e.target.value, 10) || 1)}
                    className={calendarControlInputClass}
                  >
                    {ramadanCalendarRows.map((row) => (
                      <option key={`ramadan-day-${row.ramadanDay}`} value={row.ramadanDay}>
                        Day {row.ramadanDay}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setCalendarSearchQuery('')}
                  className={calendarControlChipClass}
                >
                  Clear Filter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarSearchQuery('');
                    setSelectedRamadanDay(21);
                  }}
                  className={calendarControlChipClass}
                >
                  Jump to Last 10 Nights
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalendarSearchQuery('');
                    setSelectedRamadanDay(27);
                  }}
                  className={calendarControlChipClass}
                >
                  Jump to Day 27
                </button>
              </div>

              {selectedRamadanSummary && (
                <div className={calendarSelectedCardClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${calendarTableStrongTextClass}`}>
                      Selected: {selectedRamadanSummary.date}
                    </p>
                    <span className={calendarSelectedBadgeClass}>Day {selectedRamadanSummary.ramadanDay}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs sm:text-sm">
                    <div>
                      <p className={calendarModalNoteClass}>Sehri</p>
                      <p className={`font-semibold ${calendarTableStrongTextClass}`}>{selectedRamadanSummary.sehri}</p>
                    </div>
                    <div>
                      <p className={calendarModalNoteClass}>Iftar</p>
                      <p className={`font-semibold ${calendarTableStrongTextClass}`}>{selectedRamadanSummary.iftar}</p>
                    </div>
                    <div>
                      <p className={calendarModalNoteClass}>Sehri Shift</p>
                      <p className={`font-semibold ${calendarTableStrongTextClass}`}>{selectedRamadanSummary.sehriShift}</p>
                    </div>
                    <div>
                      <p className={calendarModalNoteClass}>Iftar Shift</p>
                      <p className={`font-semibold ${calendarTableStrongTextClass}`}>{selectedRamadanSummary.iftarShift}</p>
                    </div>
                  </div>
                </div>
              )}

              {filteredRamadanCalendarRows.length === 0 ? (
                <div className={`rounded-lg border p-4 text-sm ${calendarTableBorderClass} ${calendarModalNoteClass}`}>
                  No matching calendar day found. Try a different search.
                </div>
              ) : (
                <div className={`rounded-lg border overflow-hidden ${calendarTableBorderClass}`}>
                  <table className="w-full table-fixed text-xs sm:text-sm">
                    <colgroup>
                      <col className="w-1/2" />
                      <col className="w-1/4" />
                      <col className="w-1/4" />
                    </colgroup>
                    <thead className={calendarTableHeadClass}>
                      <tr>
                        <th className="text-left px-2 sm:px-4 py-2.5 sm:py-3 font-semibold">Date</th>
                        <th className="text-left px-2 sm:px-4 py-2.5 sm:py-3 font-semibold">Sehri</th>
                        <th className="text-left px-2 sm:px-4 py-2.5 sm:py-3 font-semibold">Iftar</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${calendarTableBodyDividerClass}`}>
                      {filteredRamadanCalendarRows.map((row, index) => {
                        const isSelectedRow = row.ramadanDay === selectedRamadanDay;
                        const rowHoverClass = isDarkUiTheme ? 'hover:bg-white/15' : 'hover:bg-indigo-50';
                        const rowSelectedClass = isDarkUiTheme ? 'bg-emerald-500/20' : 'bg-emerald-50';
                        return (
                          <tr
                            key={row.date}
                            className={`${isSelectedRow ? rowSelectedClass : (index % 2 === 0 ? calendarRowEvenClass : calendarRowOddClass)} ${rowHoverClass} cursor-pointer transition-colors`}
                            onClick={() => setSelectedRamadanDay(row.ramadanDay)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedRamadanDay(row.ramadanDay);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <td className={`px-2 sm:px-4 py-2.5 font-semibold break-words leading-snug ${calendarTableStrongTextClass}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span>{row.date}</span>
                                <span className={calendarSelectedBadgeClass}>Day {row.ramadanDay}</span>
                              </div>
                            </td>
                            <td className={`px-2 sm:px-4 py-2.5 whitespace-nowrap ${calendarTableMutedTextClass}`}>{row.sehri}</td>
                            <td className={`px-2 sm:px-4 py-2.5 whitespace-nowrap ${calendarTableMutedTextClass}`}>{row.iftar}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-xl w-full max-h-[94vh] sm:max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-r ${headerCardGradientClass} ${headerTextClass} p-4 sm:p-6 rounded-t-2xl sticky top-0`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Share Feedback</h2>
                  <p className={`${headerSubTextClass} text-sm`}>
                    Help us improve the BangaloreSehri experience.
                  </p>
                </div>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="p-4 sm:p-6 space-y-5">
              <div>
                <label htmlFor="feedbackName" className="block text-gray-700 font-semibold mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="feedbackName"
                  name="name"
                  value={feedbackData.name}
                  onChange={handleFeedbackChange}
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="feedbackEmail" className="block text-gray-700 font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="feedbackEmail"
                    name="email"
                    value={feedbackData.email}
                    onChange={handleFeedbackChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="feedbackRating" className="block text-gray-700 font-semibold mb-2">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="feedbackRating"
                    name="rating"
                    value={feedbackData.rating}
                    onChange={handleFeedbackChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Needs Improvement</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="feedbackMessage" className="block text-gray-700 font-semibold mb-2">
                  Feedback Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedbackMessage"
                  name="message"
                  rows="5"
                  value={feedbackData.message}
                  onChange={handleFeedbackChange}
                  required
                  placeholder="What can we improve?"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                ></textarea>
              </div>

              {renderCaptchaField('feedback')}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 ${primaryTimingButtonClass} font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl`}
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-6">
        <div className="container mx-auto px-4">
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



