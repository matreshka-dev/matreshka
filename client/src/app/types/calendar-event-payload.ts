export type CalendarEventPayload = {
  start: string | EpochTimeStamp; // Date string
  end?: string | EpochTimeStamp; // Date string
  summary: string;
  location?: string;
  description?: string;
  timeZone?: string;
};
