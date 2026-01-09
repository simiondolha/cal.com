Connect any CalDAV-compatible calendar to Cal.com with automatic capability detection.

## Supported Providers

- **Proton Calendar** - Read-only (due to end-to-end encryption)
- **Fastmail** - Full read/write support
- **Apple iCloud** - Full read/write support
- **Nextcloud** - Full read/write support
- **Synology Calendar** - Full read/write support
- **Zoho Calendar** - Full read/write support
- Any standard CalDAV server

## How It Works

1. Select your calendar provider or choose "Custom"
2. Enter your CalDAV URL (if required) and credentials
3. Cal.com automatically detects if your calendar supports read/write or read-only access

### Read-Only Calendars

Some providers like Proton Calendar use encryption that prevents third-party apps from writing events directly. For these calendars:

- **Availability checking works normally** - Cal.com can see when you're busy
- **Event confirmations are sent via email** - You'll receive an ICS file to import

### App-Specific Passwords

Most providers require app-specific passwords:

- **Apple**: appleid.apple.com → Security → App-Specific Passwords
- **Fastmail**: Settings → Privacy & Security → Third-party apps
- **Proton**: Requires Proton Bridge
