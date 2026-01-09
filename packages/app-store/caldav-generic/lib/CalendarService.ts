import process from "node:process";
import BaseCalendarService from "@calcom/lib/CalendarService";
import { symmetricDecrypt } from "@calcom/lib/crypto";
import type {
  CalendarEvent,
  CalendarServiceEvent,
  IntegrationCalendar,
  NewCalendarEventType,
} from "@calcom/types/Calendar";
import type { CredentialPayload } from "@calcom/types/Credential";

const CALENDSO_ENCRYPTION_KEY = process.env.CALENDSO_ENCRYPTION_KEY || "";

interface CalDavGenericCredential {
  url: string;
  username: string;
  password: string;
  providerSlug?: string;
  capabilities: { read: boolean; write: boolean };
  capabilityNote?: string;
}

export default class CalDavGenericService extends BaseCalendarService {
  private capabilities: { read: boolean; write: boolean };
  private providerSlug: string;

  constructor(credential: CredentialPayload) {
    const decrypted = JSON.parse(
      symmetricDecrypt(credential.key as string, CALENDSO_ENCRYPTION_KEY)
    ) as CalDavGenericCredential;

    super(credential, "caldav_generic_calendar", decrypted.url);

    this.capabilities = decrypted.capabilities || { read: true, write: true };
    this.providerSlug = decrypted.providerSlug || "custom";
  }

  async createEvent(event: CalendarServiceEvent, credentialId: number): Promise<NewCalendarEventType> {
    if (this.capabilities.write) {
      return super.createEvent(event, credentialId);
    }
    return this.readOnlyResponse(event.uid || "", "create");
  }

  async updateEvent(
    uid: string,
    event: CalendarEvent
  ): Promise<NewCalendarEventType | NewCalendarEventType[]> {
    if (this.capabilities.write) {
      return super.updateEvent(uid, event);
    }
    return this.readOnlyResponse(uid, "update");
  }

  async deleteEvent(uid: string): Promise<void> {
    if (this.capabilities.write) {
      return super.deleteEvent(uid);
    }
    // Read-only: just resolve - cancellation email will be sent separately
    return Promise.resolve();
  }

  async listCalendars(event?: CalendarEvent): Promise<IntegrationCalendar[]> {
    const calendars = await super.listCalendars(event);
    if (!this.capabilities.write) {
      return calendars.map((cal) => ({ ...cal, readOnly: true }));
    }
    return calendars;
  }

  private readOnlyResponse(uid: string, operation: "create" | "update"): NewCalendarEventType {
    const messages: Record<string, string> = {
      create: "Calendar is read-only. Event confirmation will be sent via email with ICS attachment.",
      update: "Calendar is read-only. Event update will be sent via email with ICS attachment.",
    };

    return {
      uid,
      id: uid,
      type: this.integrationName,
      password: "",
      url: "",
      additionalInfo: {
        calWarnings: [messages[operation]],
        readOnlyFallback: true,
        providerSlug: this.providerSlug,
      },
    };
  }
}
