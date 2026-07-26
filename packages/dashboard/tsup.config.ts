import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node22",
  // Keep the node: prefix — node:sqlite only exists with it
  removeNodeProtocol: false,
});
