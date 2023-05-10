import "data:text/typescript,Deno.run = undefined"
import { serve } from "https://deno.land/std@0.186.0/http/server.ts";
import { BuildOptions } from "https://deno.land/x/esbuild@v0.17.11/mod.js";
import { denoPlugin } from "https://raw.githubusercontent.com/lucacasonato/esbuild_deno_loader/8031f71afa1bbcd3237a94b11f53a2e5c5c0e7bf/mod.ts";

// -- esbuild --
// @deno-types="https://deno.land/x/esbuild@v0.17.11/mod.d.ts"
import * as esbuild from "./esbuild.js";
// import * as esbuild from "https://deno.land/x/esbuild@v0.17.11/wasm.js";

export interface JSXConfig {
  jsx: "react" | "react-jsx";
  jsxImportSource?: string;
}

let esbuildInitialized: boolean | Promise<void> = false;
async function ensureEsbuildInitialized() {
  if (esbuildInitialized === false) {
    // deno-lint-ignore no-deprecated-deno-api
    if (true) {
      console.log("aaaaaa")
      const wasmURL = new URL("https://deno.land/x/fresh@1.1.5/src/server/esbuild_v0.17.11.wasm?source")
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
  console.log("ensureEsbuildInitialized:", performance.now() - start);
}
console.log("> await delay(5000)");
await new Promise((ok) => setTimeout(ok, 5000));
{
  const start = performance.now();
  // In dev-mode we skip identifier minification to be able to show proper
  // component names in Preact DevTools instead of single characters.
  const minifyOptions: Partial<BuildOptions> = { minify: true };
  const bundle = await esbuild.build({
    bundle: true,
    define: { __FRSH_BUILD_ID: `"BUILD_ID"` },
    entryPoints: { main: "./test.ts" },
    format: "esm",
    metafile: true,
    ...minifyOptions,
    outdir: ".",
    // This is requried to ensure the format of the outputFiles path is the same
    // between windows and linux
    absWorkingDir: Deno.cwd(),
    outfile: "",
    platform: "neutral",
    plugins: [denoPlugin({loader:"portable"})],
    sourcemap: false,
    splitting: true,
    target: ["chrome99", "firefox99", "safari15"],
    treeShaking: true,
    write: false,
    jsx: "automatic",
    jsxImportSource: "react",
  });
  console.log("esbuild.build (1):", performance.now() - start);
}
console.log("> await delay(5000)");
await new Promise((ok) => setTimeout(ok, 5000));
{
  const start = performance.now();
  // In dev-mode we skip identifier minification to be able to show proper
  // component names in Preact DevTools instead of single characters.
  const minifyOptions: Partial<BuildOptions> = { minify: true };
  const bundle = await esbuild.build({
    bundle: true,
    define: { __FRSH_BUILD_ID: `"BUILD_ID"` },
    entryPoints: { main: "./main.ts" },
    format: "esm",
    metafile: true,
    ...minifyOptions,
    outdir: ".",
    // This is requried to ensure the format of the outputFiles path is the same
    // between windows and linux
    absWorkingDir: Deno.cwd(),
    outfile: "",
    platform: "neutral",
    plugins: [denoPlugin({loader:"portable"})],
    sourcemap: false,
    splitting: true,
    target: ["chrome99", "firefox99", "safari15"],
    treeShaking: true,
    write: false,
    jsx: "automatic",
    jsxImportSource: "react",
  });
  console.log("esbuild.build (2):", performance.now() - start);
}

{
  const start = performance.now();
  await Deno.readFile(new URL(import.meta.resolve("./README.md")));
  console.log("Deno.readFile:", performance.now() - start);
}

const url = new URL(import.meta.resolve("./files"));
{
  const start = performance.now();
  for await (const entry of Deno.readDir(url)) {
    await Deno.stat("./files/" + entry.name);
  }
  console.log("serial Deno.readDir:", performance.now() - start);
}

{
  const start = performance.now();
  const statPromise = [];
  for await (const entry of Deno.readDir(url)) {
    statPromise.push(Deno.stat("./files/" + entry.name));
  }
  await Promise.all(statPromise);
  console.log("paralell Deno.readDir:", performance.now() - start);
}

serve((_req) => Response.json("hello"));
