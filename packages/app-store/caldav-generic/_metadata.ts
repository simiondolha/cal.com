import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "CalDAV Calendar",
  description: _package.description,
  installed: true,
  type: "caldav_generic_calendar",
  title: "CalDAV Calendar",
  variant: "calendar",
  category: "calendar",
  categories: ["calendar"],
  logo: "icon.svg",
  publisher: "Cal.com",
  slug: "caldav-generic",
  url: "https://cal.com/",
  email: "help@cal.com",
  dirName: "caldav-generic",
  isOAuth: false,
} as AppMeta;

export default metadata;
