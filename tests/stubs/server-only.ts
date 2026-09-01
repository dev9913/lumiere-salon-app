// Intentionally empty. The real `server-only` package's only job is to throw
// when accidentally bundled into client/browser code; that concern doesn't
// apply when running under Vitest's Node environment, so tests alias to this
// no-op instead of depending on package resolution internals.
export {};
