import { defineConfig } from 'vitest/config';

// Security-rules tests. Run with `npm run test:rules` (starts the Firebase emulators).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    // Both files share one emulator; run them one at a time so clearFirestore() can't race.
    fileParallelism: false,
  },
});
