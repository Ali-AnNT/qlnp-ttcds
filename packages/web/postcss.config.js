export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-prefix-selector": {
      prefix: ".qlnp-app",
      // Scope all CSS under .qlnp-app to isolate from parent DNN page's CSS reset.
      // Combined with `all: revert` on #root for maximum isolation.
      transform(prefix, selector, prefixedSelector) {
        // Skip @keyframes and other at-rules that can't be prefixed
        if (selector.startsWith("@")) return selector;

        // :root → .qlnp-app (scope CSS custom properties)
        if (selector === ":root") return prefix;

        // html/body → .qlnp-app (scope preflight resets)
        if (selector === "html" || selector === "body") return prefix;

        // html body, html.something → .qlnp-app
        if (selector.startsWith("html ") || selector.startsWith("body "))
          return selector.replace(/^(html|body)/, prefix);

        // Compound selectors like html.something → .qlnp-app.something
        if (selector.startsWith("html.") || selector.startsWith("body."))
          return selector.replace(/^(html|body)/, prefix);

        // Default: prepend .qlnp-app as ancestor selector
        return prefixedSelector;
      },
    },
  },
};