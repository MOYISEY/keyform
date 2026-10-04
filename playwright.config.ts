import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  testMatch: "*.spec.ts",
  timeout: process.env.CI ? 120000 : 60000,
  expect: { timeout: process.env.CI ? 15000 : 5000 },
  workers: 1,
  use: {
    baseURL: process.env.KEYFORM_URL || "http://127.0.0.1:5193",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
          : undefined,
      args: [
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        ...(process.platform === "win32"
          ? []
          : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
      ],
    },
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
});
