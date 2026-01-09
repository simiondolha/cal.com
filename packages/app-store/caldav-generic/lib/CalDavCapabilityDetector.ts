/**
 * CalDAV Capability Detection
 * Determines if a CalDAV server supports read/write or read-only access.
 */

export interface CalDavCapabilities {
  read: boolean;
  write: boolean;
  detectionNote?: string;
}

interface AuthCredentials {
  username: string;
  password: string;
}

export async function detectCapabilities(
  url: string,
  credentials: AuthCredentials
): Promise<CalDavCapabilities> {
  const authHeader = makeBasicAuthHeader(credentials);

  const canRead = await testRead(url, authHeader);
  if (!canRead) {
    return {
      read: false,
      write: false,
      detectionNote: "Could not connect to CalDAV server",
    };
  }

  const writeResult = await testWritePrivileges(url, authHeader);
  return {
    read: true,
    write: writeResult.canWrite,
    detectionNote: writeResult.note,
  };
}

function makeBasicAuthHeader(credentials: AuthCredentials): string {
  const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
  return `Basic ${encoded}`;
}

async function testRead(url: string, authHeader: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "0",
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:resourcetype/>
  </D:prop>
</D:propfind>`,
    });
    return response.status === 207;
  } catch {
    return false;
  }
}

async function testWritePrivileges(
  url: string,
  authHeader: string
): Promise<{ canWrite: boolean; note?: string }> {
  try {
    const response = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "0",
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:current-user-privilege-set/>
  </D:prop>
</D:propfind>`,
    });

    if (response.status !== 207) {
      return { canWrite: true, note: "Server does not report privileges. Assuming write access." };
    }

    const xml = await response.text();
    const xmlLower = xml.toLowerCase();

    // Check for write privileges (write, write-content, bind, or all)
    const hasWrite = ["write", "write-content", "bind", "all"].some(
      (p) => xmlLower.includes(`<d:${p}`) || xmlLower.includes(`:${p}>`)
    );

    if (hasWrite) return { canWrite: true };

    const hasReadOnly =
      xmlLower.includes("<d:read") && !xmlLower.includes("<d:write") && !xmlLower.includes("<d:all");
    if (hasReadOnly) {
      return { canWrite: false, note: "Calendar is read-only (server reported read-only privileges)" };
    }

    return { canWrite: true, note: "Could not determine privileges. Assuming write access." };
  } catch {
    return { canWrite: true, note: "Privilege detection failed. Assuming write access." };
  }
}
