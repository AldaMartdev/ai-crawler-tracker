import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/node.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  // Keep the node: prefix — node:dns/promises only exists with it
  removeNodeProtocol: false,
});
