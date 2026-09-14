// Google Workspace API Services: Calendar, Drive, Gmail, Docs
// Compliant with least privilege, error handling, and confirmation patterns

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export interface GoogleDocItem {
  documentId: string;
  title: string;
  revisionId?: string;
}

// 1. CALENDAR API
export async function getCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // from yesterday
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=20&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Calendar API Error ${res.status}`);
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  event: { summary: string; description?: string; location?: string; startIso: string; endIso: string }
): Promise<CalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const body = {
    summary: event.summary,
    description: event.description || '',
    location: event.location || '',
    start: { dateTime: event.startIso },
    end: { dateTime: event.endIso },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Calendar Event Creation Error ${res.status}`);
  }

  return await res.json();
}

// 2. DRIVE API
export async function getDriveFiles(accessToken: string): Promise<DriveFile[]> {
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size)&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive API Error ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
}

// 3. GMAIL API
export async function getGmailMessages(accessToken: string): Promise<GmailMessageItem[]> {
  const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10';
  const listRes = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!listRes.ok) {
    const err = await listRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail List Error ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messageRefs: { id: string; threadId: string }[] = listData.messages || [];

  const detailedMessages = await Promise.all(
    messageRefs.map(async (ref) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );
        if (!detailRes.ok) return { id: ref.id, threadId: ref.threadId };
        const detail = await detailRes.json();
        const headers: { name: string; value: string }[] = detail.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value;

        return {
          id: ref.id,
          threadId: ref.threadId,
          snippet: detail.snippet,
          subject,
          from,
          date,
        };
      } catch {
        return { id: ref.id, threadId: ref.threadId };
      }
    })
  );

  return detailedMessages;
}

export async function sendGmailEmail(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  // Construct RFC 2822 email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];
  const email = messageParts.join('\r\n');

  // Base64url encode
  const base64Encoded = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ raw: base64Encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail Send Error ${res.status}`);
  }

  return await res.json();
}

// 4. DOCS API
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  initialContent?: string
): Promise<GoogleDocItem> {
  // Step 1: Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Docs Creation Error ${createRes.status}`);
  }

  const doc = await createRes.json();

  // Step 2: Insert initial text if provided
  if (initialContent && doc.documentId) {
    await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: initialContent,
            },
          },
        ],
      }),
    }).catch(() => null); // Non-fatal if text insert fails
  }

  return {
    documentId: doc.documentId,
    title: doc.title || title,
    revisionId: doc.revisionId,
  };
}
