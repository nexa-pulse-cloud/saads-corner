
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = process.cwd();

// Restore only the API files affected by our earlier fixes.
execFileSync("git", [
  "restore", "--",
  "app/api/admin",
  "app/api/orders/route.ts",
  "app/api/reviews/route.ts"
], { stdio: "inherit" });

function getFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return getFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

function fixStatusArgs(source) {
  const replacements = [];
  const marker = "NextResponse.json(";
  let searchFrom = 0;

  while (true) {
    const start = source.indexOf(marker, searchFrom);
    if (start < 0) break;

    const open = start + marker.length - 1;
    let paren = 1, brace = 0, bracket = 0;
    let quote = null, escaped = false, lineComment = false, blockComment = false;
    let comma = -1, close = -1;

    for (let i = open + 1; i < source.length; i++) {
      const ch = source[i], next = source[i + 1];

      if (lineComment) {
        if (ch === "\n") lineComment = false;
        continue;
      }
      if (blockComment) {
        if (ch === "*" && next === "/") {
          blockComment = false;
          i++;
        }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === "/" && next === "/") {
        lineComment = true; i++; continue;
      }
      if (ch === "/" && next === "*") {
        blockComment = true; i++; continue;
      }
      if (ch === "'" || ch === '"' || ch === "`") {
        quote = ch; continue;
      }

      if (ch === "(") paren++;
      else if (ch === ")") {
        paren--;
        if (paren === 0) { close = i; break; }
      } else if (ch === "{") brace++;
      else if (ch === "}") brace--;
      else if (ch === "[") bracket++;
      else if (ch === "]") bracket--;

      if (ch === "," && paren === 1 && brace === 0 && bracket === 0 && comma < 0) {
        comma = i;
      }
    }

    if (comma >= 0 && close > comma) {
      const second = source.slice(comma + 1, close).trim();
      if (/^(400|401|403|404|405|409|422|429|500|502|503|201)$/.test(second)) {
        replacements.push({
          start: comma + 1,
          end: close,
          value: " { status: " + second + " }"
        });
      }
    }
    searchFrom = close > start ? close + 1 : start + marker.length;
  }

  for (const r of replacements.reverse()) {
    source = source.slice(0, r.start) + r.value + source.slice(r.end);
  }
  return source;
}

let count = 0;
for (const file of getFiles(path.join(root, "app"))) {
  let source = fs.readFileSync(file, "utf8");
  let updated = fixStatusArgs(source);

  if (file.endsWith(path.join("api", "orders", "route.ts"))) {
    updated = updated.replace(
      "const ids=[...new Set(v.items.map(i=>i.product_id))]",
      "const ids=Array.from(new Set(v.items.map(i=>i.product_id)))"
    );
  }

  if (file.endsWith(path.join("api", "admin", "products", "route.ts"))) {
    updated = updated.replace(
      "upsert(v.id?{...payload,id:v.id}:payload)",
      "upsert((v.id?{...payload,id:v.id}:payload) as any)"
    );
  }

  if (updated !== source) {
    fs.writeFileSync(file, updated, "utf8");
    console.log("Updated:", path.relative(root, file));
    count++;
  }
}

console.log("Finished. Files updated:", count);
