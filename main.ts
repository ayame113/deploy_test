import { serve } from "https://deno.land/std@0.186.0/http/server.ts";

{
  const start = performance.now();
  await Deno.readFile(new URL(import.meta.resolve("./README.md")));
  console.log("Deno.readFile", performance.now() - start);
}

{
  const start = performance.now();
  for await (const entry of Deno.readDir(new URL(import.meta.resolve("./")))) {
    console.log(await Deno.stat(entry.name));
  }
  console.log("serial Deno.readDir", performance.now() - start);
}

{
  const start = performance.now();
  const statPromise = [];
  for await (const entry of Deno.readDir(new URL(import.meta.resolve("./")))) {
    statPromise.push(Deno.stat(entry.name));
  }
  await Promise.all(statPromise);
  console.log("serial Deno.readDir", performance.now() - start);
}

serve((_req) => Response.json("hello"));
