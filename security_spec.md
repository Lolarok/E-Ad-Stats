# Security Specification — EuroBasket Stats Lab Firestore Rules

## 1. Data Invariants & Relationship Mapping

1. **Master Source of Truth (Season Snapshots)**:
   - `season_meta/{metaId}` is the parent index document describing a published basketball statistical snapshot (`status: 'active' | 'archived'`).
   - Every `season_chunks/{chunkId}` document MUST reference an existing parent `season_meta/{metaId}` (verified via `exists()` on create and immutable `metaId` on update).
   - Archived `season_meta` documents (`status == 'archived'`) are terminal and cannot be modified by non-override actions.
2. **Admin-Only Cloud Publishing & Traffic Persistence**:
   - Only a verified administrator (`request.auth != null && request.auth.token.email_verified == true` matching either the bootstrapped admin email `darioskerletic@gmail.com` or an existing `/admins/{uid}` entry) can write to `season_meta`, `season_chunks`, `traffic_snapshots`, or `admins`.
   - `traffic_snapshots` contains only aggregated and anonymized telemetry (no IPs, emails, or user PII) and is strictly admin-only for both read and write.
3. **PII Isolation (`users/{userId}`)**:
   - User profiles store `email` and `displayName` and are strictly restricted to `isOwner(userId) || isAdmin()` on single-document `get`. Blanket `list` is forbidden (`allow list: if false`).
   - Users cannot inject privileged fields (`role`, `isAdmin`) on create or update.
4. **Strict Payload & Temporal Integrity**:
   - Every string field enforces explicit `.size()` bounds; every array enforces `.size() <= MAX` and first-element type validation when non-empty.
   - All single-document operations enforce `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
   - `createdAt` and `updatedAt` must equal `request.time`; `createdAt`, `uid`, `metaId`, and `kind` are immutable on update.
   - `updatedBy` must strictly equal `request.auth.uid`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Class | Target Collection | Malicious Payload / Context | Expected Result |
|---|--------------|-------------------|-----------------------------|-----------------|
| 1 | **Shadow Field Injection** | `/users/{uid}` | Valid `UserProfile` + `{ "isAdmin": true, "role": "superadmin" }` | `PERMISSION_DENIED` (`hasOnly` rejects ghost fields) |
| 2 | **Email Spoofing (Unverified)** | `/season_meta/current_2026_27` | Auth token `{ email: "darioskerletic@gmail.com", email_verified: false }` writing valid meta | `PERMISSION_DENIED` (`email_verified == true` required) |
| 3 | **Cross-User PII Read** | `/users/victim_uid` | Signed-in verified user `attacker_uid` calling `get` on `/users/victim_uid` | `PERMISSION_DENIED` (`isOwner` / `isAdmin` gate) |
| 4 | **Unauthorized List Scraping** | `/users`, `/traffic_snapshots`, `/season_chunks` | Non-admin user calling `list` on any collection | `PERMISSION_DENIED` (no open `list` rules) |
| 5 | **Identity Spoofing on Write** | `/users/attacker_uid` | Authenticated `attacker_uid` creating profile with `{ "uid": "victim_uid" }` | `PERMISSION_DENIED` (`data.uid == request.auth.uid` gate) |
| 6 | **Orphaned Chunk Write** | `/season_chunks/teams_0` | Admin creating chunk with `{ "metaId": "non_existent_meta" }` | `PERMISSION_DENIED` (`exists(/databases/.../season_meta/$(metaId))` gate) |
| 7 | **ID Poisoning** | `/season_meta/<200-char-id>` or `/users/bad$id` | Document ID exceeding 128 chars or containing invalid characters | `PERMISSION_DENIED` (`isValidId` regex + size guard) |
| 8 | **Timestamp Forgery** | `/season_meta/current_2026_27` | Admin writing client-forged `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` | `PERMISSION_DENIED` (`createdAt == request.time` gate) |
| 9 | **Immutable Field Tampering** | `/season_chunks/teams_0` | Admin updating `kind` from `"teams"` to `"players"` or altering `createdAt` | `PERMISSION_DENIED` (`affectedKeys().hasOnly(...)` + immutability check) |
| 10 | **Array Bomb / Value Poisoning** | `/season_chunks/players_0` | Admin writing `items` array with 300 elements (> 250 max) or non-map element `[123]` | `PERMISSION_DENIED` (`items.size() <= 250 && items[0] is map`) |
| 11 | **Non-Admin Snapshot Hijack** | `/season_meta/current_2026_27` | Regular verified Google user attempting to overwrite `season_meta` or `traffic_snapshots` | `PERMISSION_DENIED` (`isAdmin()` gate) |
| 12 | **Terminal State Bypass** | `/season_meta/old_2025_26` | Non-override update attempt modifying `lbaRound` on an `archived` snapshot | `PERMISSION_DENIED` (`existing().status != 'archived'` gate on regular sync action) |
