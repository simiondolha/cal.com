import { describe, it, expect } from "vitest";

import { PROVIDER_PRESETS, getPreset, resolvePresetUrl } from "./providerPresets";

describe("providerPresets", () => {
  describe("PROVIDER_PRESETS", () => {
    it("should have all required providers", () => {
      const slugs = PROVIDER_PRESETS.map((p) => p.slug);

      expect(slugs).toContain("proton");
      expect(slugs).toContain("fastmail");
      expect(slugs).toContain("icloud");
      expect(slugs).toContain("nextcloud");
      expect(slugs).toContain("synology");
      expect(slugs).toContain("zoho");
      expect(slugs).toContain("custom");
    });

    it("should mark Proton as read-only", () => {
      const proton = PROVIDER_PRESETS.find((p) => p.slug === "proton");

      expect(proton?.knownCapabilities?.read).toBe(true);
      expect(proton?.knownCapabilities?.write).toBe(false);
    });

    it("should mark Fastmail as read-write", () => {
      const fastmail = PROVIDER_PRESETS.find((p) => p.slug === "fastmail");

      expect(fastmail?.knownCapabilities?.read).toBe(true);
      expect(fastmail?.knownCapabilities?.write).toBe(true);
    });
  });

  describe("getPreset", () => {
    it("should return preset by slug", () => {
      const preset = getPreset("proton");

      expect(preset).toBeDefined();
      expect(preset?.name).toBe("Proton Calendar");
    });

    it("should return undefined for unknown slug", () => {
      const preset = getPreset("nonexistent");

      expect(preset).toBeUndefined();
    });
  });

  describe("resolvePresetUrl", () => {
    it("should return null when caldavUrl is null", () => {
      const preset = getPreset("proton")!;
      const url = resolvePresetUrl(preset, "test@proton.me");

      expect(url).toBeNull();
    });

    it("should return static URL for icloud", () => {
      const preset = getPreset("icloud")!;
      const url = resolvePresetUrl(preset, "test@icloud.com");

      expect(url).toBe("https://caldav.icloud.com");
    });

    it("should compute URL from function for fastmail", () => {
      const preset = getPreset("fastmail")!;
      const url = resolvePresetUrl(preset, "test@fastmail.com");

      expect(url).toBe("https://caldav.fastmail.com/dav/calendars/user/test%40fastmail.com/");
    });

    it("should URL-encode email in fastmail URL", () => {
      const preset = getPreset("fastmail")!;
      const url = resolvePresetUrl(preset, "user+tag@fastmail.com");

      expect(url).toContain("user%2Btag%40fastmail.com");
    });
  });
});
