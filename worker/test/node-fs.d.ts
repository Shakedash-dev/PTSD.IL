// The two node:fs calls the tests use (the worker's types are workers-types
// only, no @types/node).
declare module "node:fs" {
  export function existsSync(path: string | URL): boolean;
  export function readFileSync(path: string | URL, encoding: "utf8"): string;
}
