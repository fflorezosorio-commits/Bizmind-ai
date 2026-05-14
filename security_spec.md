# Security Specification for BizMind

## Data Invariants
1. **User Identity**: The document ID in the `users` collection must exactly match the `uid` field and the authenticated user's `request.auth.uid`.
2. **Immutability**: The `createdAt` field must be set once during creation and cannot be modified.
3. **Temporal Integrity**: `createdAt` and `lastLogin` must use server-side timestamps (`request.time`).
4. **Schema Integrity**: Only allowed fields (`uid`, `email`, `displayName`, `photoURL`, `lastLogin`, `createdAt`) are permitted.

## The Dirty Dozen (Test Cases)
1. **Identity Spoofing**: Attempt to create/update a user doc with a `uid` different from the authenticated user's UID.
2. **Document Theft**: Attempt to write to `/users/{otherUserId}`.
3. **Ghost Fields**: Attempt to add `admin: true` to a user document.
4. **Email Spoofing**: Attempt to set an email that doesn't match the auth token.
5. **Time Travel**: Attempt to set a manual `createdAt` date instead of `request.time`.
6. **Immutability Breach**: Attempt to change `createdAt` on an update.
7. **PII Leak**: A signed-in user attempting to list all documents in `/users` (should be blocked or strictly filtered).
8. **Resource Poisoning**: Attempt to inject 1MB string as a `displayName`.
9. **Unverified Access**: Attempting to write without a verified email (if the app requires it).
10. **Orphaned Writes**: (N/A for single collection, but relevant if we had sub-collections).
11. **Type Mismatch**: Sending a number for `displayName`.
12. **Anonymous Squatting**: Anonymous users trying to create records (should be restricted to specific providers if configured).

## Test Runner (Logic)
All the above payloads must return `PERMISSION_DENIED` unless they meet the strict validation helpers.
