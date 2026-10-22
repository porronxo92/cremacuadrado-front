// Vercel serverless entry point for the Angular SSR server.
//
// server.ts still uses CommonEngine (the AngularNodeAppEngine adapter that
// 19+ offers is phase 6 of the migration), built into
// dist/cremacuadrado/server/server.mjs, which
// exports `app(): express.Express` and only calls `.listen()` when run
// directly (see the `import.meta.url` guard in server.ts). Vercel doesn't
// auto-detect or wire this up on its own: this file — plus the rewrites and
// `functions.includeFiles` in vercel.json — is what actually connects it.
//
// An Express app instance is itself a valid (req, res) => void handler, so
// exporting the already-built app directly is enough; Vercel's Node runtime
// calls it exactly like Node's own http.createServer(app) would.
import { app } from '../dist/cremacuadrado/server/server.mjs';

export default app();
