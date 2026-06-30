import type { Plugin } from "vite";

/**
 * Vite plugin that wraps the entire IIFE output in an anonymous function
 * to prevent global scope pollution when the bundle is loaded on a page
 * that already has other scripts (e.g., DNN's ScriptResource.axd with
 * its own "sf" variable).
 *
 * Without this, Rollup's IIFE format still emits top-level `var` declarations
 * that can conflict with variables from other scripts on the same page.
 */
export function iifeWrap(): Plugin {
  return {
    name: "vite-plugin-iife-wrap",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type === "chunk" && chunk.isEntry) {
          // Wrap the entire output in an anonymous function
          // This ensures all var/let/const are scoped to this function,
          // not the global scope
          const originalCode = chunk.code;
          chunk.code = `(function(){${originalCode}})();`;
        }
      }
    },
  };
}