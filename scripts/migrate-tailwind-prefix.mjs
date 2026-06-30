#!/usr/bin/env node

/**
 * Tailwind CSS Prefix Migration Script v3
 *
 * Strategy: Use a comprehensive regex that matches Tailwind utility class tokens
 * directly in the source text. The regex identifies Tailwind class patterns
 * (with variant prefixes, negative, important, arbitrary selectors) and adds
 * the lma- prefix in the correct position.
 *
 * This approach is more reliable than trying to parse className contexts
 * because it operates at the token level — only matching patterns that are
 * definitively Tailwind utility classes.
 *
 * Key rules:
 *   - Prefix goes AFTER variant modifiers, BEFORE utility name
 *   - group, group/xxx, peer remain unprefixed
 *   - Only processes .tsx and .ts files
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, relative } from "path";

const PREFIX = "lma-";
const ROOT_DIR = join(import.meta.dirname, "..", "packages", "web", "src");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");
const FILE_ARG = process.argv.indexOf("--file");
const SINGLE_FILE = FILE_ARG !== -1 ? process.argv[FILE_ARG + 1] : null;

// ─── Classes that should NOT be prefixed ────────────────────────────
const SKIP_EXACT = new Set([
  "group", "peer", "toaster", "toast", "qlnp-app",
  "day-range-end", "day-outside", "day-selected", "day-today",
  "day-disabled", "day-hidden", "day-range-middle",
]);

function processFile(filePath) {
  let content = readFileSync(filePath, "utf-8");
  let changes = 0;

  // Strategy: Replace Tailwind class tokens in string contexts.
  // We process the entire file content, but only replace tokens that:
  // 1. Are inside a quoted string (single, double, or template literal)
  // 2. Match a known Tailwind utility pattern
  // 3. Are not already prefixed
  // 4. Are not in the SKIP list

  // We'll use a string-by-string replacement approach.
  // Process each string context (double-quoted, single-quoted, template) separately.

  // Process double-quoted strings
  content = content.replace(/"([^"]*)"/g, (match, str) => {
    // Skip strings that are clearly not Tailwind class strings
    if (!isClassString(str)) return match;

    const processed = processClassString(str);
    if (processed !== str) {
      changes++;
      if (VERBOSE && changes <= 50) {
        console.log(`  "${str.substring(0, 80)}${str.length > 80 ? '...' : ''}" → "${processed.substring(0, 80)}${processed.length > 80 ? '...' : ''}"`);
      }
    }
    return `"${processed}"`;
  });

  if (!DRY_RUN && changes > 0) {
    writeFileSync(filePath, content, "utf-8");
  }

  console.log(`  ${changes > 0 ? '✓' : '·'} ${relative(ROOT_DIR, filePath)}: ${changes} change(s)`);

  return { changes, modified: changes > 0 };
}

/**
 * Check if a string likely contains Tailwind utility classes.
 * Uses heuristics to avoid processing regular text, CVA variant names, etc.
 */
function isClassString(str) {
  if (!str || str.length < 1) return false;

  // Skip strings that are clearly not class strings:
  // - Import paths (contain / or .)
  // Don't filter out strings with / — Tailwind uses / for opacity modifiers (bg-muted/50, border-warning/30)
  // Only filter if the string looks like a file path or URL
  if (str.startsWith("/") || str.startsWith("./") || str.startsWith("../") || str.startsWith("http")) return false;
  if (str.startsWith(".") || str.startsWith("/")) return false;

  // - Single words that are common non-class values
  const nonClassValues = new Set([
    "default", "outline", "ghost", "destructive", "secondary", "link",
    "sm", "md", "lg", "xl", "2xl", "icon",
    "expanded", "collapsed", "floating", "inset", "sidebar", "offcanvas", "none",
    "popper", "horizontal", "vertical", "x", "y",
    "approved", "pending", "rejected", "cancelled",
    "my", "all", "staff", "admin",
    "left", "right", "top", "bottom",
  ]);
  if (nonClassValues.has(str)) return false;

  // Check if the string contains at least one token that looks like a Tailwind class
  const tokens = str.split(/\s+/);
  let twCount = 0;
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (isTailwindToken(trimmed)) {
      twCount++;
    }
  }

  // If at least 30% of tokens look like Tailwind, it's probably a class string
  return tokens.length > 0 && (twCount / tokens.length) >= 0.3;
}

/**
 * Check if a single token looks like a Tailwind utility class.
 */
function isTailwindToken(token) {
  const t = token.trim();
  if (!t) return false;
  if (SKIP_EXACT.has(t)) return true; // Known context markers
  if (t.startsWith("lma-") || t.startsWith("-lma-") || t.startsWith("!lma-")) return false; // Already prefixed

  // Remove variant prefixes for checking
  let util = t;
  const variantMatch = t.match(/^(.+?:)+(.+)$/);
  if (variantMatch) {
    util = variantMatch[2];
  }

  // Remove ! and - prefix for checking
  let cleanUtil = util;
  if (cleanUtil.startsWith("!")) cleanUtil = cleanUtil.slice(1);
  if (cleanUtil.startsWith("-")) cleanUtil = cleanUtil.slice(1);

  // Known Tailwind utility prefixes
  const twPrefixes = [
    "flex", "grid", "block", "inline", "hidden", "visible", "invisible",
    "float", "clear", "overflow", "z-", "order-",
    "m-", "mx-", "my-", "mt-", "mr-", "mb-", "ml-", "ms-", "me-",
    "p-", "px-", "py-", "pt-", "pr-", "pb-", "pl-", "ps-", "pe-",
    "-m-", "-mx-", "-my-", "-mt-", "-mr-", "-mb-", "-ml-",
    "space-", "gap-",
    "w-", "h-", "min-w-", "min-h-", "max-w-", "max-h-", "size-",
    "text-", "font-", "leading-", "tracking-", "whitespace-", "break-",
    "underline", "line-through", "overline", "no-underline",
    "bg-", "from-", "via-", "to-",
    "border", "rounded-", "ring-", "ring",
    "shadow-", "shadow", "opacity-",
    "pointer-events-", "select-", "cursor-", "resize",
    "table-", "border-collapse", "border-spacing-",
    "transition", "duration-", "ease-", "animate-", "animate-in", "animate-out",
    "fade-in", "fade-out", "zoom-in", "zoom-out",
    "slide-in-from", "slide-out-to", "slide-in", "slide-out",
    "scale-", "rotate-", "translate-", "skew-", "transform", "origin-",
    "absolute", "relative", "fixed", "sticky",
    "inset-", "inset", "top-", "right-", "bottom-", "left-",
    "-top-", "-right-", "-bottom-", "-left-",
    "contents", "list-", "appearance-",
    "items-", "justify-", "self-", "place-",
    "col-", "row-",
    "sr-only", "not-sr-only",
    "fill-", "stroke-",
    "container",
  ];

  for (const prefix of twPrefixes) {
    if (cleanUtil === prefix || cleanUtil.startsWith(prefix)) {
      return true;
    }
  }

  // Check for arbitrary values: text-[14px], bg-[#fff], etc.
  if (/^[\w-]+\[/.test(cleanUtil)) return true;

  // Check for [&...] arbitrary selectors: [&_svg]:size-4
  if (/^\[&/.test(t)) return true;

  // Check for data-[...] variants: data-[state=open]:bg-accent
  if (/^data-\[/.test(t)) return true;

  // Check for aria-[...] variants
  if (/^aria-\[/.test(t)) return true;

  return false;
}

/**
 * Process a string of space-separated class tokens.
 * Add prefix to Tailwind utility tokens, skip non-Tailwind tokens.
 */
function processClassString(str) {
  if (!str) return str;

  const tokens = str.split(/(\s+)/); // Split but preserve whitespace
  const result = tokens.map(token => {
    const trimmed = token.trim();
    if (!trimmed) return token; // Preserve whitespace

    // Skip known non-prefix classes
    if (SKIP_EXACT.has(trimmed)) return token;

    // Already prefixed
    if (trimmed.includes(":lma-") || trimmed.startsWith("lma-") || trimmed.startsWith("-lma-") || trimmed.startsWith("!lma-")) {
      return token;
    }

    // Check if this token is a Tailwind class that needs prefixing
    if (!isTailwindToken(trimmed)) return token;

    return prefixToken(trimmed);
  });

  return result.join("");
}

/**
 * Add prefix to a single Tailwind class token.
 * Handles: variants, negatives, importants, arbitrary selectors.
 */
function prefixToken(token) {
  // group/xxx → NOT prefixed
  if (/^group(\/|$)/.test(token)) return token;
  if (/^peer(\/|$)/.test(token)) return token;

  // Already prefixed
  if (token.includes(":lma-") || token.startsWith("lma-") || token.startsWith("-lma-") || token.startsWith("!lma-")) {
    return token;
  }

  // Split by : to separate variants from utility
  const colonParts = token.split(":");

  if (colonParts.length === 1) {
    // No variants
    return prefixUtility(token);
  }

  // Has variants — last part is the utility, rest are variants
  const variants = colonParts.slice(0, -1);
  const utility = colonParts[colonParts.length - 1];

  // Don't prefix if the utility is a non-Tailwind token
  if (!isTailwindToken(utility) && !SKIP_EXACT.has(utility)) return token;

  return [...variants, prefixUtility(utility)].join(":");
}

/**
 * Prefix a utility class (no variant modifiers).
 */
function prefixUtility(util) {
  if (SKIP_EXACT.has(util)) return util;
  if (util.startsWith("lma-") || util.startsWith("-lma-") || util.startsWith("!lma-")) return util;

  // Important: !font-bold → !lma-font-bold
  if (util.startsWith("!")) {
    return "!" + PREFIX + util.slice(1);
  }

  // Negative: -mt-8 → -lma-mt-8
  if (util.startsWith("-")) {
    return "-" + PREFIX + util.slice(1);
  }

  return PREFIX + util;
}

// ─── File Discovery ──────────────────────────────────────────────────

function getAllSourceFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "test") {
        getAllSourceFiles(fullPath, files);
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Main ─────────────────────────────────────────────────────────────

function main() {
  console.log(`\n🔧 Tailwind Prefix Migration v3 (prefix: "${PREFIX}")`);
  console.log(DRY_RUN ? "📋 DRY RUN — no files will be modified\n" : "");

  const files = SINGLE_FILE
    ? [SINGLE_FILE.startsWith("/") ? SINGLE_FILE : join(process.cwd(), SINGLE_FILE)]
    : getAllSourceFiles(ROOT_DIR);

  let totalChanges = 0;
  let modifiedFiles = 0;
  let skippedFiles = 0;

  for (const filePath of files) {
    try {
      const { changes, modified } = processFile(filePath);
      if (modified) {
        modifiedFiles++;
        totalChanges += changes;
      } else {
        skippedFiles++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${filePath}:`, err.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Files skipped: ${skippedFiles}`);
  console.log(`   Total changes: ${totalChanges}`);

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN — no files were actually modified");
  }

  console.log("\n✅ Migration complete!");
}

main();