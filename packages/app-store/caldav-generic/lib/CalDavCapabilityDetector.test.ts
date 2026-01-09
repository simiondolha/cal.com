import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { detectCapabilities } from "./CalDavCapabilityDetector";

describe("CalDavCapabilityDetector", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const credentials = { username: "test@example.com", password: "password123" };
  const url = "https://caldav.example.com/calendars/";

  describe("detectCapabilities", () => {
    it("should return read=false when server is unreachable", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(false);
      expect(result.write).toBe(false);
      expect(result.detectionNote).toContain("Could not connect");
    });

    it("should return read=false when PROPFIND fails", async () => {
      mockFetch.mockResolvedValue({ status: 401 });

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(false);
      expect(result.write).toBe(false);
    });

    it("should detect read-only when only read privilege is present", async () => {
      // First call: testRead (PROPFIND for resourcetype)
      mockFetch.mockResolvedValueOnce({ status: 207 });

      // Second call: testWritePrivileges (PROPFIND for privileges)
      mockFetch.mockResolvedValueOnce({
        status: 207,
        text: async () => `
          <?xml version="1.0"?>
          <d:multistatus xmlns:d="DAV:">
            <d:response>
              <d:propstat>
                <d:prop>
                  <d:current-user-privilege-set>
                    <d:privilege><d:read/></d:privilege>
                  </d:current-user-privilege-set>
                </d:prop>
              </d:propstat>
            </d:response>
          </d:multistatus>
        `,
      });

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(true);
      expect(result.write).toBe(false);
      expect(result.detectionNote).toContain("read-only");
    });

    it("should detect write access when write privilege is present", async () => {
      mockFetch.mockResolvedValueOnce({ status: 207 });
      mockFetch.mockResolvedValueOnce({
        status: 207,
        text: async () => `
          <?xml version="1.0"?>
          <d:multistatus xmlns:d="DAV:">
            <d:response>
              <d:propstat>
                <d:prop>
                  <d:current-user-privilege-set>
                    <d:privilege><d:read/></d:privilege>
                    <d:privilege><d:write/></d:privilege>
                  </d:current-user-privilege-set>
                </d:prop>
              </d:propstat>
            </d:response>
          </d:multistatus>
        `,
      });

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(true);
      expect(result.write).toBe(true);
    });

    it("should detect write access with bind privilege", async () => {
      mockFetch.mockResolvedValueOnce({ status: 207 });
      mockFetch.mockResolvedValueOnce({
        status: 207,
        text: async () => `<d:privilege><d:bind/></d:privilege>`,
      });

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(true);
      expect(result.write).toBe(true);
    });

    it("should detect write access with all privilege", async () => {
      mockFetch.mockResolvedValueOnce({ status: 207 });
      mockFetch.mockResolvedValueOnce({
        status: 207,
        text: async () => `<d:privilege><d:all/></d:privilege>`,
      });

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(true);
      expect(result.write).toBe(true);
    });

    it("should assume write when server doesn't report privileges", async () => {
      mockFetch.mockResolvedValueOnce({ status: 207 });
      mockFetch.mockResolvedValueOnce({ status: 404 }); // No privilege support

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(true);
      expect(result.write).toBe(true);
      expect(result.detectionNote).toContain("Assuming write access");
    });

    it("should handle case-insensitive privilege names", async () => {
      mockFetch.mockResolvedValueOnce({ status: 207 });
      mockFetch.mockResolvedValueOnce({
        status: 207,
        text: async () => `<D:privilege><D:WRITE/></D:privilege>`,
      });

      const result = await detectCapabilities(url, credentials);

      expect(result.read).toBe(true);
      expect(result.write).toBe(true);
    });
  });
});
