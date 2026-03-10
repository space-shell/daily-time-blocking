import { blocks, currentDate, intention, icsPrefix } from '../state/signals.js';

function pad(n) { return String(n).padStart(2, '0'); }

function toICSDate(date, totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d  = pad(date.getDate());
  return `${y}${mo}${d}T${pad(h)}${pad(m)}00`;
}

function escapeICS(str) {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadICS() {
  const date = currentDate.value;
  const allBlocks = blocks.value;

  if (!allBlocks.length) {
    alert('No blocks to export for this day.');
    return;
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`;

  const events = allBlocks.map(b => {
    const start = toICSDate(date, b.startMin);
    const end   = toICSDate(date, b.startMin + b.durMin);
    const uid   = `${b.id}@daily-time-blocking`;
    const summary = escapeICS(b.label);
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${summary}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  const intentionText = intention.value;
  const desc = intentionText ? `DESCRIPTION:${escapeICS(intentionText)}\r\n` : '';

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daily Time Blocking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(intentionText ? [`X-WR-CALDESC:${escapeICS(intentionText)}`] : []),
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([cal], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${icsPrefix.value}-${date.toISOString().slice(0, 10)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
