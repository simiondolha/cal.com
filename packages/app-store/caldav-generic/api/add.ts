import process from "node:process";
import { symmetricDecrypt, symmetricEncrypt } from "@calcom/lib/crypto";
import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import { CalendarService, detectCapabilities, getPreset, resolvePresetUrl } from "../lib";

const ENCRYPTION_KEY = process.env.CALENDSO_ENCRYPTION_KEY || "";

interface CalDavGenericCredential {
  url: string;
  username: string;
  password: string;
  providerSlug?: string;
  capabilities: { read: boolean; write: boolean };
  capabilityNote?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { username, password, url, providerSlug } = req.body;

    // Get user
    const user = await prisma.user.findFirstOrThrow({
      where: { id: req.session?.user?.id },
      select: { id: true, email: true },
    });

    // Resolve URL from provider preset if applicable
    let resolvedUrl = url;
    if (providerSlug && providerSlug !== "custom") {
      const preset = getPreset(providerSlug);
      if (preset) {
        const presetUrl = resolvePresetUrl(preset, username);
        if (presetUrl) resolvedUrl = presetUrl;
      }
    }

    if (!resolvedUrl) {
      return res.status(400).json({ message: "CalDAV URL is required" });
    }

    // Detect capabilities (read-only vs read-write)
    const capabilities = await detectCapabilities(resolvedUrl, { username, password });

    if (!capabilities.read) {
      return res.status(400).json({
        message: "Could not connect to CalDAV server. Please check your credentials and URL.",
      });
    }

    // Check for duplicate
    const existingCredentials = await prisma.credential.findMany({
      where: { userId: user.id, type: "caldav_generic_calendar" },
    });

    for (const existing of existingCredentials) {
      try {
        const decrypted = JSON.parse(
          symmetricDecrypt(existing.key as string, ENCRYPTION_KEY)
        ) as CalDavGenericCredential;
        if (decrypted.url === resolvedUrl && decrypted.username === username) {
          return res.status(400).json({ message: "This calendar is already connected" });
        }
      } catch {
        // Ignore decrypt errors
      }
    }

    const credentialData: CalDavGenericCredential = {
      url: resolvedUrl,
      username,
      password,
      providerSlug,
      capabilities: { read: capabilities.read, write: capabilities.write },
      capabilityNote: capabilities.detectionNote,
    };

    const data = {
      type: "caldav_generic_calendar",
      key: symmetricEncrypt(JSON.stringify(credentialData), ENCRYPTION_KEY),
      userId: user.id,
      teamId: null,
      appId: "caldav-generic",
      invalid: false,
      delegationCredentialId: null,
    };

    try {
      // Validate by listing calendars
      const dav = new CalendarService({
        id: 0,
        ...data,
        user: { email: user.email },
      });
      await dav.listCalendars();
      await prisma.credential.create({ data });

      const message = capabilities.write
        ? "Calendar connected successfully."
        : "Calendar connected in read-only mode. Event confirmations will be sent via email with ICS attachments.";

      return res.status(200).json({
        url: getInstalledAppPath({ variant: "calendar", slug: "caldav-generic" }),
        capabilities,
        message,
      });
    } catch (e) {
      logger.error("Could not add CalDAV account", e);
      if (e instanceof Error && e.message.indexOf("Invalid credentials") > -1) {
        return res.status(400).json({ message: "Invalid credentials. Please check username and password." });
      }
      return res.status(500).json({ message: "Could not add this CalDAV account" });
    }
  }

  if (req.method === "GET") {
    return res.status(200).json({ url: "/apps/caldav-generic/setup" });
  }
}
