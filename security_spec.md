# Security Spec: Katalog Perangkat dan Formulir

## 1. Data Invariants

- **Devices Collection (`/devices/{deviceId}`)**:
  - `id` must be a valid document ID and match `deviceId`.
  - Only authenticated admins can create or update devices.
  - Normal users have Read-Only access (`get` and `list`).
  - Strict type checking on all fields including enum strings and integer bounds on stock.

- **Requests Collection (`/requests/{requestId}`)**:
  - Any authenticated user can read or list their own requests (enforced via `auth.uid` or email checks).
  - Any authenticated user can create a request, provided:
    - `email` matches the authenticated user's email (`request.auth.token.email`).
    - `status` is initialized strictly to `'Pending'`.
    - `createdAt` matches `request.time`.
  - Only admins can update the request (e.g., status, adminNotes).
  - Normal users cannot alter any request once created.
  - No one can delete a request document.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 malicious payloads designed to test the boundaries of our rules:

1. **Self-Elevated Admin Profile Creation**: An unauthenticated user tries to register a device.
2. **Ghost Field Injection on Devices**: An admin registers a device with a rogue field: `isSuperVanguard: true`.
3. **Invalid Rating Bound**: An admin sets a device's rating to `99.9` or `-5.0`.
4. **Incorrect Category Enum**: Registering a device with the category `Refrigerator`.
5. **No-Verify Request Submission**: A user whose email is not verified tries to create a request.
6. **Identity Spoof (Email mismatch)**: User `attacker@evil.com` tries to submit a request under email `herbertlanson7@gmail.com`.
7. **Status Bypass (Disetujui bypass)**: A normal user submits a request with `status: "Disetujui"`.
8. **Malicious ID Poisoning**: A user submits a request with document ID representing a long junk character overflow.
9. **Creation Timestamp Spoofing**: A user submits a request with a pre-dated `createdAt` string instead of `request.time`.
10. **Shadow Field Modification on Requests**: A normal user updates their pending request to change `deviceName` or `deviceId`.
11. **Rogue Admin Update**: A normal user updates a request's `adminNotes` or `status` directly.
12. **Request Document Deletion**: A user tries to delete their pending request to cover track logs.

---

## 3. Test Runner Definition

The rules must ensure that all 12 rogue scenarios fail when executed against the production `firestore.rules` compiler. All read/write boundaries are programmatically locked.
