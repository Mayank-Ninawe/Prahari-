import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebase";
import { FirebaseService } from "./firebaseService";

// In-memory token storage (Do NOT persist to localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let calendarEmailAddress: string | null = null;

export interface BusySlot {
  start: string;
  end: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export const CalendarService = {
  /**
   * Set the cached token in memory (e.g. if acquired during initial login)
   */
  setAccessToken(token: string, email: string | null) {
    cachedAccessToken = token;
    if (email) calendarEmailAddress = email;
  },

  /**
   * Get the current in-memory access token
   */
  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  /**
   * Check if a token is currently available in memory
   */
  isConnected(): boolean {
    return !!cachedAccessToken;
  },

  /**
   * Triggers a popup auth flow to request Google Calendar access scopes.
   * Caches the access token in memory and updates the user's connected flag in Firestore.
   */
  async connectCalendar(uid: string): Promise<{ email: string; token: string }> {
    if (!auth) {
      throw new Error("Auth system is uninitialized.");
    }

    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
    provider.addScope("https://www.googleapis.com/auth/calendar.events");

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential || !credential.accessToken) {
        throw new Error("No access token returned from Google Calendar Authorization.");
      }

      const email = result.user.email || "";
      cachedAccessToken = credential.accessToken;
      calendarEmailAddress = email;

      // Persist the connection state metadata (NOT the raw token!) in Firestore
      await FirebaseService.updateUserDocument(uid, {
        calendarSync: true,
      });

      return { email, token: cachedAccessToken };
    } catch (err: any) {
      console.error("Google Calendar connection failed:", err);
      throw err;
    }
  },

  /**
   * Disconnects Google Calendar connection.
   */
  async disconnectCalendar(uid: string): Promise<void> {
    cachedAccessToken = null;
    calendarEmailAddress = null;

    await FirebaseService.updateUserDocument(uid, {
      calendarSync: false,
    });
  },

  /**
   * Fetches busy blocks for a given time range.
   */
  async fetchBusySlots(timeMin: string, timeMax: string): Promise<BusySlot[]> {
    if (!cachedAccessToken) {
      throw new Error("Calendar is not connected or token has expired.");
    }

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          cachedAccessToken = null; // Token expired
          throw new Error("Google Calendar session expired. Please reconnect.");
        }
        const errText = await response.text();
        throw new Error(`Google Calendar API Error: ${response.statusText} (${errText})`);
      }

      const data = await response.json();
      const primaryCalendar = data.calendars?.primary;
      return (primaryCalendar?.busy || []) as BusySlot[];
    } catch (err: any) {
      console.error("Failed to fetch busy slots:", err);
      throw err;
    }
  },

  /**
   * Fetches full event details for a given time range.
   */
  async fetchEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    if (!cachedAccessToken) {
      throw new Error("Calendar is not connected or token has expired.");
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          cachedAccessToken = null; // Token expired
          throw new Error("Google Calendar session expired. Please reconnect.");
        }
        throw new Error(`Google Calendar API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return (data.items || []) as CalendarEvent[];
    } catch (err: any) {
      console.error("Failed to fetch calendar events:", err);
      throw err;
    }
  },

  /**
   * Schedules a task rescue focus block event on the user's primary calendar.
   */
  async createRescueBlock(params: {
    taskTitle: string;
    description: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
  }): Promise<CalendarEvent> {
    if (!cachedAccessToken) {
      throw new Error("Calendar is not connected or token has expired.");
    }

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `🛡️ Prahari Rescue: ${params.taskTitle}`,
          description: `This is an automated tactical work slot scheduled by Prahari AI to rescue your high-priority deadline.\n\nTask Details:\n${params.description}`,
          start: {
            dateTime: params.startTime,
          },
          end: {
            dateTime: params.endTime,
          },
          reminders: {
            useDefault: true,
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          cachedAccessToken = null; // Token expired
          throw new Error("Google Calendar session expired. Please reconnect.");
        }
        const errText = await response.text();
        throw new Error(`Failed to create calendar event: ${response.statusText} (${errText})`);
      }

      return (await response.json()) as CalendarEvent;
    } catch (err: any) {
      console.error("Failed to create rescue event block:", err);
      throw err;
    }
  },

  /**
   * Helper: Analyzes whether a task's estimated work duration conflicts with busy segments.
   * Returns conflict report with details of any overlapping busy slots.
   */
  checkConflicts(
    taskStart: Date,
    taskEnd: Date,
    busySlots: BusySlot[]
  ): {
    hasConflict: boolean;
    conflictingSlots: BusySlot[];
    availableTimeMinutes: number;
  } {
    const startMs = taskStart.getTime();
    const endMs = taskEnd.getTime();
    const totalSpanMinutes = (endMs - startMs) / (1000 * 60);

    let conflictingSlots: BusySlot[] = [];
    let busyTimeMinutes = 0;

    for (const slot of busySlots) {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();

      // Check overlap
      const overlapStart = Math.max(startMs, slotStart);
      const overlapEnd = Math.min(endMs, slotEnd);

      if (overlapStart < overlapEnd) {
        conflictingSlots.push(slot);
        busyTimeMinutes += (overlapEnd - overlapStart) / (1000 * 60);
      }
    }

    const availableTimeMinutes = Math.max(0, totalSpanMinutes - busyTimeMinutes);

    return {
      hasConflict: conflictingSlots.length > 0,
      conflictingSlots,
      availableTimeMinutes,
    };
  }
};
