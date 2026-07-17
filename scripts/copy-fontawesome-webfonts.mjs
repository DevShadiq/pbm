import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const websiteRoot = path.join(workspaceRoot, "apps", "website");
const source = path.join(
  workspaceRoot,
  "node_modules",
  "@fortawesome",
  "fontawesome-free",
  "webfonts"
);
const destination = path.join(websiteRoot, "public", "webfonts");

try {
  await stat(source);
} catch {
  throw new Error("Font Awesome is missing. Run npm install before starting or building the website.");
}

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
