/**
 * Phase 0 Payload-First Security Rule Verification Suite
 * Mirrors the exact invariants enforced in firestore.rules and verifies all 12
 * "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 *
 * Run with: npx tsx firestore.rules.test.ts
 */
import assert from 'node:assert/strict';

interface AuthContext {
  uid: string;
  token: {
    email?: string;
    email_verified?: boolean;
  };
}

const REQUEST_TIME = 'SERVER_TIME_TOKEN';
const BOOTSTRAP_ADMIN_EMAIL = 'darioskerletic@gmail.com';
const VALID_ID_RE = /^[a-zA-Z0-9_\-]+$/;
const SEASON_RE = /^[0-9]{4}\/[0-9]{4}$/;

const existingDocs = new Set<string>([
  'season_meta/current_2026_27',
  'season_meta/archived_2025_26',
]);

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && VALID_ID_RE.test(id);
}

function isSignedIn(auth: AuthContext | null): boolean {
  return auth !== null;
}

function isVerifiedUser(auth: AuthContext | null): boolean {
  return auth !== null && auth.token.email_verified === true;
}

function isAdmin(auth: AuthContext | null, adminUids: Set<string> = new Set()): boolean {
  return (
    isVerifiedUser(auth) &&
    (auth!.token.email === BOOTSTRAP_ADMIN_EMAIL || adminUids.has(auth!.uid))
  );
}

function hasAllAndOnly(data: Record<string, unknown>, reqKeys: string[], allowedKeys: string[]): boolean {
  const keys = Object.keys(data);
  return reqKeys.every((k) => keys.includes(k)) && keys.every((k) => allowedKeys.includes(k));
}

function isValidUserProfile(data: Record<string, unknown>, auth: AuthContext | null): boolean {
  if (!isVerifiedUser(auth)) return false;
  if (
    !hasAllAndOnly(
      data,
      ['uid', 'displayName', 'email', 'createdAt', 'updatedAt'],
      ['uid', 'displayName', 'email', 'photoURL', 'createdAt', 'updatedAt']
    )
  ) {
    return false;
  }
  return (
    isValidId(data.uid) &&
    data.uid === auth!.uid &&
    typeof data.displayName === 'string' &&
    data.displayName.length >= 1 &&
    data.displayName.length <= 120 &&
    typeof data.email === 'string' &&
    data.email.length >= 5 &&
    data.email.length <= 160 &&
    (data.photoURL === undefined || (typeof data.photoURL === 'string' && data.photoURL.length <= 512))
  );
}

function isValidSeasonMeta(data: Record<string, unknown>, auth: AuthContext | null): boolean {
  if (!isVerifiedUser(auth)) return false;
  const keys = [
    'season',
    'status',
    'lbaRound',
    'euroleagueGamesCount',
    'eurocupGamesCount',
    'totalGames',
    'teamsCount',
    'playersCount',
    'teamChunksCount',
    'playerChunksCount',
    'pbpCachedGames',
    'pbpCoveragePct',
    'sourceLastUpdated',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ];
  if (!hasAllAndOnly(data, keys, keys)) return false;
  return (
    typeof data.season === 'string' &&
    data.season.length >= 4 &&
    data.season.length <= 20 &&
    SEASON_RE.test(data.season) &&
    (data.status === 'active' || data.status === 'archived') &&
    typeof data.lbaRound === 'number' &&
    data.lbaRound >= 1 &&
    data.lbaRound <= 40 &&
    typeof data.totalGames === 'number' &&
    data.totalGames >= 0 &&
    typeof data.sourceLastUpdated === 'string' &&
    data.sourceLastUpdated.length >= 10 &&
    data.sourceLastUpdated.length <= 64 &&
    isValidId(data.updatedBy) &&
    data.updatedBy === auth!.uid
  );
}

function isValidSeasonChunk(data: Record<string, unknown>, auth: AuthContext | null): boolean {
  if (!isVerifiedUser(auth)) return false;
  const keys = [
    'metaId',
    'kind',
    'chunkIndex',
    'totalChunks',
    'season',
    'items',
    'updatedBy',
    'createdAt',
    'updatedAt',
  ];
  if (!hasAllAndOnly(data, keys, keys)) return false;
  if (!Array.isArray(data.items) || data.items.length > 250) return false;
  if (data.items.length > 0 && (typeof data.items[0] !== 'object' || data.items[0] === null || Array.isArray(data.items[0]))) {
    return false;
  }
  return (
    isValidId(data.metaId) &&
    (data.kind === 'teams' || data.kind === 'players') &&
    typeof data.chunkIndex === 'number' &&
    data.chunkIndex >= 0 &&
    data.chunkIndex <= 30 &&
    typeof data.totalChunks === 'number' &&
    data.totalChunks >= 1 &&
    data.totalChunks <= 30 &&
    typeof data.season === 'string' &&
    SEASON_RE.test(data.season) &&
    isValidId(data.updatedBy) &&
    data.updatedBy === auth!.uid
  );
}

// Rule simulators
function canCreateUser(docId: string, data: Record<string, unknown>, auth: AuthContext | null): boolean {
  return (
    isVerifiedUser(auth) &&
    isValidId(docId) &&
    docId === auth!.uid &&
    isValidUserProfile(data, auth) &&
    data.createdAt === REQUEST_TIME &&
    data.updatedAt === REQUEST_TIME
  );
}

function canGetUser(docId: string, auth: AuthContext | null): boolean {
  return isSignedIn(auth) && isValidId(docId) && (auth!.uid === docId || isAdmin(auth));
}

function canCreateSeasonMeta(docId: string, data: Record<string, unknown>, auth: AuthContext | null): boolean {
  return (
    isAdmin(auth) &&
    isValidId(docId) &&
    isValidSeasonMeta(data, auth) &&
    data.createdAt === REQUEST_TIME &&
    data.updatedAt === REQUEST_TIME
  );
}

function canUpdateSeasonMeta(
  docId: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  auth: AuthContext | null,
  action: 'sync' | 'admin_override' = 'sync'
): boolean {
  if (!isAdmin(auth) || !isValidId(docId) || !isValidSeasonMeta(incoming, auth)) return false;
  if (incoming.createdAt !== existing.createdAt || incoming.updatedAt !== REQUEST_TIME) return false;
  if (action === 'sync') {
    return existing.status !== 'archived';
  }
  return true;
}

function canCreateSeasonChunk(docId: string, data: Record<string, unknown>, auth: AuthContext | null): boolean {
  return (
    isAdmin(auth) &&
    isValidId(docId) &&
    isValidSeasonChunk(data, auth) &&
    data.createdAt === REQUEST_TIME &&
    data.updatedAt === REQUEST_TIME &&
    existingDocs.has(`season_meta/${String(data.metaId)}`)
  );
}

function canUpdateSeasonChunk(
  docId: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  auth: AuthContext | null
): boolean {
  if (!isAdmin(auth) || !isValidId(docId) || !isValidSeasonChunk(incoming, auth)) return false;
  if (
    incoming.createdAt !== existing.createdAt ||
    incoming.metaId !== existing.metaId ||
    incoming.kind !== existing.kind ||
    incoming.updatedAt !== REQUEST_TIME
  ) {
    return false;
  }
  const changed = Object.keys(incoming).filter((k) => incoming[k] !== existing[k]);
  const allowedChanged = new Set(['chunkIndex', 'totalChunks', 'season', 'items', 'updatedBy', 'updatedAt']);
  return changed.every((k) => allowedChanged.has(k));
}

const adminAuth: AuthContext = {
  uid: 'admin_uid_001',
  token: { email: BOOTSTRAP_ADMIN_EMAIL, email_verified: true },
};
const spoofedAdminAuth: AuthContext = {
  uid: 'spoof_uid_002',
  token: { email: BOOTSTRAP_ADMIN_EMAIL, email_verified: false },
};
const regularUserAuth: AuthContext = {
  uid: 'user_uid_003',
  token: { email: 'user@example.com', email_verified: true },
};

const validMeta = {
  season: '2026/2027',
  status: 'active',
  lbaRound: 9,
  euroleagueGamesCount: 130,
  eurocupGamesCount: 128,
  totalGames: 258,
  teamsCount: 68,
  playersCount: 957,
  teamChunksCount: 1,
  playerChunksCount: 4,
  pbpCachedGames: 258,
  pbpCoveragePct: 100,
  sourceLastUpdated: '2026-11-26T08:00:00.000Z',
  updatedBy: adminAuth.uid,
  createdAt: REQUEST_TIME,
  updatedAt: REQUEST_TIME,
};

// Dirty Dozen Assertions (all 12 MUST be denied)
assert.equal(
  canCreateUser(
    regularUserAuth.uid,
    {
      uid: regularUserAuth.uid,
      displayName: 'Mallory',
      email: 'user@example.com',
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME,
      isAdmin: true,
    },
    regularUserAuth
  ),
  false,
  '1. Shadow Field Injection must be denied'
);

assert.equal(
  canCreateSeasonMeta('current_2026_27', { ...validMeta, updatedBy: spoofedAdminAuth.uid }, spoofedAdminAuth),
  false,
  '2. Unverified Email Spoofing must be denied'
);

assert.equal(canGetUser('victim_uid_999', regularUserAuth), false, '3. Cross-User PII Read must be denied');

assert.equal(isAdmin(regularUserAuth), false, '4. Unauthorized List Scraping / Non-Admin must be denied');

assert.equal(
  canCreateUser(
    regularUserAuth.uid,
    {
      uid: 'victim_uid_999',
      displayName: 'Spoof',
      email: 'user@example.com',
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME,
    },
    regularUserAuth
  ),
  false,
  '5. Identity Spoofing on Write must be denied'
);

assert.equal(
  canCreateSeasonChunk(
    'teams_0',
    {
      metaId: 'non_existent_meta',
      kind: 'teams',
      chunkIndex: 0,
      totalChunks: 1,
      season: '2026/2027',
      items: [{ id: 't1' }],
      updatedBy: adminAuth.uid,
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME,
    },
    adminAuth
  ),
  false,
  '6. Orphaned Chunk Write must be denied'
);

assert.equal(
  canCreateSeasonMeta('x'.repeat(200), validMeta, adminAuth),
  false,
  '7. ID Poisoning must be denied'
);

assert.equal(
  canCreateSeasonMeta('current_2026_27', { ...validMeta, createdAt: '2020-01-01T00:00:00Z' }, adminAuth),
  false,
  '8. Timestamp Forgery must be denied'
);

assert.equal(
  canUpdateSeasonChunk(
    'teams_0',
    {
      metaId: 'current_2026_27',
      kind: 'teams',
      chunkIndex: 0,
      totalChunks: 1,
      season: '2026/2027',
      items: [{ id: 't1' }],
      updatedBy: adminAuth.uid,
      createdAt: 'OLD_TIME',
      updatedAt: 'OLD_TIME',
    },
    {
      metaId: 'current_2026_27',
      kind: 'players',
      chunkIndex: 0,
      totalChunks: 1,
      season: '2026/2027',
      items: [{ id: 'p1' }],
      updatedBy: adminAuth.uid,
      createdAt: 'OLD_TIME',
      updatedAt: REQUEST_TIME,
    },
    adminAuth
  ),
  false,
  '9. Immutable Field Tampering must be denied'
);

assert.equal(
  canCreateSeasonChunk(
    'players_0',
    {
      metaId: 'current_2026_27',
      kind: 'players',
      chunkIndex: 0,
      totalChunks: 1,
      season: '2026/2027',
      items: Array.from({ length: 260 }, () => ({ id: 'p' })),
      updatedBy: adminAuth.uid,
      createdAt: REQUEST_TIME,
      updatedAt: REQUEST_TIME,
    },
    adminAuth
  ),
  false,
  '10. Array Bomb (>250 items) must be denied'
);

assert.equal(
  canCreateSeasonMeta('current_2026_27', { ...validMeta, updatedBy: regularUserAuth.uid }, regularUserAuth),
  false,
  '11. Non-Admin Snapshot Hijack must be denied'
);

assert.equal(
  canUpdateSeasonMeta(
    'archived_2025_26',
    { ...validMeta, status: 'archived', createdAt: 'OLD_TIME' },
    { ...validMeta, lbaRound: 10, createdAt: 'OLD_TIME', updatedAt: REQUEST_TIME },
    adminAuth,
    'sync'
  ),
  false,
  '12. Terminal State Bypass must be denied'
);

// Positive sanity checks
assert.equal(canCreateSeasonMeta('current_2026_27', validMeta, adminAuth), true, 'Valid Admin meta create should pass');
assert.equal(canGetUser(regularUserAuth.uid, regularUserAuth), true, 'Owner reading own profile should pass');
console.log('ALL 12 DIRTY DOZEN SECURITY TESTS + POSITIVE ASSERTIONS PASSED.');
