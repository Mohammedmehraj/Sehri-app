import React, { useEffect, useMemo, useState } from 'react';

const RING_SIZE = 96;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function parsePrayerTime(value, referenceDate) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const date = new Date(referenceDate);
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

function buildCountdownState(timings, now) {
  if (!timings) {
    return null;
  }

  const base = new Date(now);
  const tomorrowBase = new Date(base);
  tomorrowBase.setDate(tomorrowBase.getDate() + 1);
  const yesterdayBase = new Date(base);
  yesterdayBase.setDate(yesterdayBase.getDate() - 1);

  const fajr = parsePrayerTime(timings.Fajr, base);
  const sunrise = parsePrayerTime(timings.Sunrise, base);
  const dhuhr = parsePrayerTime(timings.Dhuhr, base);
  const asr = parsePrayerTime(timings.Asr, base);
  const maghrib = parsePrayerTime(timings.Maghrib, base);
  const isha = parsePrayerTime(timings.Isha, base);
  const tomorrowFajr = parsePrayerTime(timings.Fajr, tomorrowBase);
  const yesterdayIsha = parsePrayerTime(timings.Isha, yesterdayBase);

  if (!fajr || !sunrise || !dhuhr || !asr || !maghrib || !isha || !tomorrowFajr || !yesterdayIsha) {
    return null;
  }

  if (now < fajr) {
    return { period: 'isha', start: yesterdayIsha, end: fajr, nextPrayerName: 'Fajr' };
  }
  if (now < sunrise) {
    return { period: 'fajr', start: fajr, end: sunrise, nextPrayerName: 'Sunrise' };
  }
  if (now < dhuhr) {
    return { period: 'sunrise', start: sunrise, end: dhuhr, nextPrayerName: 'Dhuhr' };
  }
  if (now < asr) {
    return { period: 'dhuhr', start: dhuhr, end: asr, nextPrayerName: 'Asr' };
  }
  if (now < maghrib) {
    return { period: 'asr', start: asr, end: maghrib, nextPrayerName: 'Maghrib' };
  }
  if (now < isha) {
    return { period: 'maghrib', start: maghrib, end: isha, nextPrayerName: 'Isha' };
  }

  return { period: 'isha', start: isha, end: tomorrowFajr, nextPrayerName: 'Fajr' };
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function PrayerCountdownRing({ timings, onPeriodChange, isDarkTheme = true }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const countdownState = useMemo(() => buildCountdownState(timings, now), [timings, now]);
  const period = countdownState?.period || 'isha';

  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  }, [onPeriodChange, period]);

  if (!countdownState) {
    const fallbackClassName = isDarkTheme
      ? 'border-white/40 bg-white/20 text-white'
      : 'border-slate-900/25 bg-white/60 text-slate-900';

    return (
      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center ${fallbackClassName}`}>
        <p className="text-[10px] sm:text-xs font-semibold">--:--:--</p>
      </div>
    );
  }

  const totalMs = Math.max(1000, countdownState.end.getTime() - countdownState.start.getTime());
  const remainingMs = Math.max(0, countdownState.end.getTime() - now.getTime());
  const elapsedMs = Math.min(totalMs, Math.max(0, now.getTime() - countdownState.start.getTime()));
  const progress = elapsedMs / totalMs;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const trackStroke = isDarkTheme ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.2)';
  const progressStroke = isDarkTheme ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.85)';
  const textClassName = isDarkTheme ? 'text-white' : 'text-slate-900';

  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
      <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="w-full h-full -rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={trackStroke}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={progressStroke}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      <div className={`absolute inset-0 flex flex-col items-center justify-center ${textClassName} text-center px-1`}>
        <p className="text-[9px] leading-none uppercase tracking-wide opacity-90">{countdownState.nextPrayerName}</p>
        <p className="text-xs sm:text-sm font-bold tabular-nums leading-tight">{formatDuration(remainingMs)}</p>
      </div>
    </div>
  );
}

export default PrayerCountdownRing;
