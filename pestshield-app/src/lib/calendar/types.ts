export interface MergedGoogleEvent {
  id: string;
  calendarId: string;
  calendarName: string;
  color?: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink?: string;
}
