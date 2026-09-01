import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // The real `server-only` package throws when bundled for the browser;
      // under Node's module resolution it's a no-op, but we alias it
      // explicitly so test runs never depend on that resolution detail.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
