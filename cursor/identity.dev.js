// Runtime sibling for cursor/identity.ts (imports ./identity.dev.js).
// Keep in sync with identity.dev.ts when changing the simulated viewer.

/** @type {import('./identity').DevViewer | null} */
export const DEV_VIEWER = {
  sub: "user:dev",
  email: "dev@example.com",
  name: "Dev Viewer",
  teamId: 1,
  teamRole: "admin",
};
