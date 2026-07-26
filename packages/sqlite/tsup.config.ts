import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node22",
  // Keep the node: prefix — node:sqlite only exists with it
  removeNodeProtocol: false,
});
