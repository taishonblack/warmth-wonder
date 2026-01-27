/**
 * Utility to parse market hours strings and determine if currently open
 * Supports formats like:
 * - "Daily 7am-9pm"
 * - "Wed 8am-3pm"
 * - "Sat-Sun 10am-6pm"
 * - "Mon-Fri 9am-5pm"
 * - "Tue, Thu 8am-2pm"
 */

const DAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseTime(timeStr: string): number | null {
  const match = timeStr.toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (meridiem === "pm" && hours !== 12) {
    hours += 12;
  } else if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function parseDayRange(dayStr: string): number[] {
  const normalizedDay = dayStr.toLowerCase().trim();

  // Handle "daily"
  if (normalizedDay === "daily") {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  // Handle day range like "Mon-Fri" or "Sat-Sun"
  if (normalizedDay.includes("-")) {
    const [startDay, endDay] = normalizedDay.split("-").map((d) => d.trim());
    const startIdx = DAY_MAP[startDay];
    const endIdx = DAY_MAP[endDay];

    if (startIdx === undefined || endIdx === undefined) return [];

    const days: number[] = [];
    if (startIdx <= endIdx) {
      for (let i = startIdx; i <= endIdx; i++) {
        days.push(i);
      }
    } else {
      // Wrap around (e.g., Fri-Mon)
      for (let i = startIdx; i <= 6; i++) days.push(i);
      for (let i = 0; i <= endIdx; i++) days.push(i);
    }
    return days;
  }

  // Handle comma-separated days like "Tue, Thu"
  if (normalizedDay.includes(",")) {
    return normalizedDay
      .split(",")
      .map((d) => DAY_MAP[d.trim()])
      .filter((d) => d !== undefined);
  }

  // Single day
  const dayIdx = DAY_MAP[normalizedDay];
  return dayIdx !== undefined ? [dayIdx] : [];
}

interface ParsedHours {
  days: number[];
  openTime: number; // minutes from midnight
  closeTime: number; // minutes from midnight
}

function parseHoursString(hoursStr: string): ParsedHours | null {
  if (!hoursStr) return null;

  // Try to match pattern: "Day(s) Time-Time"
  // Examples: "Wed 8am-3pm", "Mon-Fri 9am-5pm", "Daily 7am-9pm"
  const match = hoursStr.match(/^(.+?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)$/i);

  if (!match) return null;

  const [, dayPart, openStr, closeStr] = match;
  const days = parseDayRange(dayPart);
  const openTime = parseTime(openStr);
  const closeTime = parseTime(closeStr);

  if (days.length === 0 || openTime === null || closeTime === null) {
    return null;
  }

  return { days, openTime, closeTime };
}

export function isMarketOpen(hoursStr: string | null | undefined): boolean | null {
  if (!hoursStr) return null; // Unknown

  const parsed = parseHoursString(hoursStr);
  if (!parsed) return null; // Could not parse

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Check if today is an operating day
  if (!parsed.days.includes(currentDay)) {
    return false;
  }

  // Check if current time is within operating hours
  if (parsed.openTime <= parsed.closeTime) {
    // Normal case: opens and closes same day
    return currentTime >= parsed.openTime && currentTime < parsed.closeTime;
  } else {
    // Overnight case: closes after midnight
    return currentTime >= parsed.openTime || currentTime < parsed.closeTime;
  }
}

export function getNextOpenTime(hoursStr: string | null | undefined): string | null {
  if (!hoursStr) return null;

  const parsed = parseHoursString(hoursStr);
  if (!parsed) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Find next open day
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (parsed.days.includes(checkDay)) {
      if (i === 0 && currentTime < parsed.openTime) {
        // Opens later today
        const hours = Math.floor(parsed.openTime / 60);
        const mins = parsed.openTime % 60;
        const ampm = hours >= 12 ? "pm" : "am";
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `Opens at ${displayHours}${mins > 0 ? `:${mins.toString().padStart(2, "0")}` : ""}${ampm}`;
      } else if (i > 0) {
        // Opens on a future day
        const dayName = DAY_ORDER[checkDay].charAt(0).toUpperCase() + DAY_ORDER[checkDay].slice(1);
        return `Opens ${dayName}`;
      }
    }
  }

  return null;
}
