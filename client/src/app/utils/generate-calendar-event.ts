export function generateCalendarEvent(data: {
  start: string | EpochTimeStamp; // Date string
  end?: string | EpochTimeStamp; // Date string
  summary: string;
  location?: string;
  description?: string;
  timeZone?: string;
}) {
  const objToString = (obj: Record<string, string>) => {
    let str = '';
    for (const p in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, p)) {
        str += p + ':' + obj[p] + `\n`;
      }
    }
    return str;
  };

  const formatText = (text: string): string => {
    return text
      .replace(/\\/gm, '\\\\')
      .replace(/\r?\n/gm, '\\n')
      .replace(/;/gm, '\\;')
      .replace(/,/gm, '\\,');
  };

  const formatDateForCalendar = (date: Date) => {
    const pad2 = (n: number) => (n < 10 ? '0' + n : n);
    return (
      date.getFullYear().toString() +
      pad2(date.getMonth() + 1) +
      pad2(date.getDate()) +
      'T' +
      pad2(date.getHours()) +
      pad2(date.getMinutes()) +
      pad2(date.getSeconds())
    );
  };

  const properties: Record<string, string> = {};
  properties['DTSTART'] = formatDateForCalendar(new Date(data.start)); // Split чтобы удалить Z часть времени
  if (data.end) {
    properties['DTEND'] = formatDateForCalendar(new Date(data.end)); // Split чтобы удалить Z часть времени
  } else {
    properties['DURATION'] = `PT1H00M`;
  }
  properties['SUMMARY'] = formatText(data.summary);
  if (data.description) {
    properties['DESCRIPTION'] = formatText(data.description);
  }
  if (data.location) {
    properties['LOCATION'] = formatText(data.location);
  }
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Matreshka.app
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
${objToString(properties)}
END:VEVENT
END:VCALENDAR`;
}
