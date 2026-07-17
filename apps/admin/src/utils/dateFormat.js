const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const monthMap = MONTHS.reduce((map, month, index) => {
  map[month] = index + 1;
  return map;
}, {});

function pad(value) {
  return String(value).padStart(2, "0");
}

function isValidDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseDateParts(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
  }

  const input = String(value).trim();
  if (!input) return null;

  if (input.includes("T")) {
    const date = new Date(input);
    if (!Number.isNaN(date.getTime())) {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }
  }

  let match = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return isValidDate(year, month, day) ? { year, month, day } : null;
  }

  match = input.match(/^(\d{1,2})[-\s]([a-zA-Z]{3,})[-\s](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = monthMap[match[2].slice(0, 3).toUpperCase()];
    const year = Number(match[3]);
    return month && isValidDate(year, month, day) ? { year, month, day } : null;
  }

  return null;
}

export function toIsoDate(value) {
  const parts = parseDateParts(value);
  if (!parts) return "";
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function getTodayIsoDate() {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export function formatDateForDisplay(value, fallback = "") {
  const parts = parseDateParts(value);
  if (!parts) return fallback;
  return `${pad(parts.day)}-${MONTHS[parts.month - 1]}-${parts.year}`;
}

export function isDateColumnKey(key) {
  return String(key || "")
    .toLowerCase()
    .includes("date");
}
