const FIREBASE_PROJECT_ID = "kusms-leo-club";
const FIRESTORE_DOCUMENTS_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const PUBLIC_SITE_URL = "https://leoclubofkusms.org";
const CACHE_TTL_MS = 15 * 60 * 1000;

const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/members",
  "/past-members",
  "/constitution",
  "/wall-of-fame",
  "/events",
  "/archive",
  "/awards",
  "/stats",
];

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, { stringValue?: string }>;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

let sitemapCache: { xml: string; expiresAt: number } | null = null;

async function listPublicDocuments(collection: "events" | "activities"): Promise<FirestoreDocument[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${FIRESTORE_DOCUMENTS_URL}/${collection}`);
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) {
      throw new Error(`Firestore ${collection} listing failed with HTTP ${response.status}.`);
    }

    const page = await response.json() as FirestoreListResponse;
    documents.push(...(page.documents ?? []));

    if (page.nextPageToken && page.nextPageToken === pageToken) {
      throw new Error(`Firestore returned a repeated pagination token for ${collection}.`);
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  return documents;
}

function getPublicDetailPath(document: FirestoreDocument, kind: "event" | "activity"): string | null {
  const title = document.fields?.title?.stringValue?.trim();
  const documentId = document.name?.split("/").at(-1);
  if (!title || !documentId) return null;
  return `/${kind}/${encodeURIComponent(documentId)}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function getDynamicSitemapXml(): Promise<string> {
  if (sitemapCache && sitemapCache.expiresAt > Date.now()) return sitemapCache.xml;

  const [events, activities] = await Promise.all([
    listPublicDocuments("events"),
    listPublicDocuments("activities"),
  ]);

  const paths = new Set(STATIC_PUBLIC_PATHS);
  for (const event of events) {
    const path = getPublicDetailPath(event, "event");
    if (path) paths.add(path);
  }
  for (const activity of activities) {
    const path = getPublicDetailPath(activity, "activity");
    if (path) paths.add(path);
  }

  const entries = [...paths]
    .sort((a, b) => a.localeCompare(b))
    .map((path) => `  <url><loc>${escapeXml(`${PUBLIC_SITE_URL}${path}`)}</loc></url>`);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  sitemapCache = { xml, expiresAt: Date.now() + CACHE_TTL_MS };
  return xml;
}
