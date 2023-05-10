import { serve } from "https://deno.land/std@0.186.0/http/server.ts";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.17.11/mod.d.ts"
import * as esbuildWasm from "https://deno.land/x/esbuild@v0.17.11/wasm.js";
import * as esbuildNative from "https://deno.land/x/esbuild@v0.17.11/mod.js";
// @ts-ignore trust me
// deno-lint-ignore no-deprecated-deno-api
const esbuild: typeof esbuildWasm = Deno.run === undefined
  ? esbuildWasm
  : esbuildNative;

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

let esbuildInitialized: boolean | Promise<void> = false;
async function ensureEsbuildInitialized() {
  if (esbuildInitialized === false) {
    // deno-lint-ignore no-deprecated-deno-api
    if (Deno.run === undefined) {
      const wasmURL = new URL("./esbuild_v0.17.11.wasm", import.meta.url).href;
      esbuildInitialized = fetch(wasmURL).then(async (r) => {
        const resp = new Response(r.body, {
          headers: { "Content-Type": "application/wasm" },
        });
        const wasmModule = await WebAssembly.compileStreaming(resp);
        await esbuild.initialize({
          wasmModule,
          worker: false,
        });
      });
    } else {
      esbuild.initialize({});
    }
    await esbuildInitialized;
    esbuildInitialized = true;
  } else if (esbuildInitialized instanceof Promise) {
    await esbuildInitialized;
  }
}

{
  const start = performance.now();
  await ensureEsbuildInitialized();
  console.log("ensureEsbuildInitialized", performance.now() - start);
}

{
  const start = performance.now();
  await Deno.readFile(new URL(import.meta.resolve("./README.md")));
  console.log("Deno.readFile", performance.now() - start);
}

const url = new URL(import.meta.resolve("./files"));
{
  const start = performance.now();
  for await (const entry of Deno.readDir(url)) {
    await Deno.stat("./files/" + entry.name);
  }
  console.log("serial Deno.readDir", performance.now() - start);
}

{
  const start = performance.now();
  const statPromise = [];
  for await (const entry of Deno.readDir(url)) {
    statPromise.push(Deno.stat("./files/" + entry.name));
  }
  await Promise.all(statPromise);
  console.log("paralell Deno.readDir", performance.now() - start);
}

serve((_req) => Response.json("hello"));
