import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const sourceRoot = resolve(repositoryRoot, "contract", "src", "managed", "driveproof");
const publicRoot = resolve(repositoryRoot, "apps", "driver", "public", "contract", "compiled", "driveproof");

mkdirSync(publicRoot, { recursive: true });
for (const directory of ["keys", "zkir"]) {
  cpSync(resolve(sourceRoot, directory), resolve(publicRoot, directory), { recursive: true });
}

console.log("Copied generated DriveProof ZK assets into the Driver public directory.");
