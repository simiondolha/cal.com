/**
 * CalDAV Provider Presets
 * Known configurations for common CalDAV providers.
 */

export interface ProviderPreset {
  slug: string;
  name: string;
  caldavUrl: string | ((email: string) => string) | null;
  knownCapabilities: { read: boolean; write: boolean } | null;
  instructions?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    slug: "proton",
    name: "Proton Calendar",
    caldavUrl: null,
    knownCapabilities: { read: true, write: false },
    instructions: "Use the CalDAV URL from Proton Bridge. Note: Read-only due to encryption.",
  },
  {
    slug: "fastmail",
    name: "Fastmail",
    caldavUrl: (email: string) =>
      `https://caldav.fastmail.com/dav/calendars/user/${encodeURIComponent(email)}/`,
    knownCapabilities: { read: true, write: true },
    instructions: "Use your Fastmail email and an app-specific password.",
  },
  {
    slug: "icloud",
    name: "Apple iCloud",
    caldavUrl: "https://caldav.icloud.com",
    knownCapabilities: { read: true, write: true },
    instructions: "Use your Apple ID and an app-specific password.",
  },
  {
    slug: "nextcloud",
    name: "Nextcloud",
    caldavUrl: null,
    knownCapabilities: { read: true, write: true },
    instructions: "URL: https://your-server/remote.php/dav/calendars/USERNAME/",
  },
  {
    slug: "synology",
    name: "Synology Calendar",
    caldavUrl: null,
    knownCapabilities: { read: true, write: true },
    instructions: "URL: https://your-nas:5001/caldav/USERNAME/",
  },
  {
    slug: "zoho",
    name: "Zoho Calendar",
    caldavUrl: "https://calendar.zoho.com/caldav",
    knownCapabilities: { read: true, write: true },
    instructions: "Use your Zoho email and an app-specific password.",
  },
  {
    slug: "custom",
    name: "Other CalDAV Server",
    caldavUrl: null,
    knownCapabilities: null,
    instructions: "Enter your CalDAV server URL.",
  },
];

export function getPreset(slug: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.slug === slug);
}

export function resolvePresetUrl(preset: ProviderPreset, email: string): string | null {
  if (preset.caldavUrl === null) return null;
  if (typeof preset.caldavUrl === "function") return preset.caldavUrl(email);
  return preset.caldavUrl;
}
