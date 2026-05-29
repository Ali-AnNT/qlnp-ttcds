import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      boundaries: boundaries,
    },
    settings: {
      "boundaries/elements": [
        {
          type: "feature",
          pattern: "src/features/*",
          mode: "folder",
          capture: ["featureName"],
        },
        {
          type: "shared",
          pattern: "src/shared",
          mode: "file",
        },
        {
          type: "app",
          pattern: "src/app",
          mode: "file",
        },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      
      // VSA Boundary Rules
      "boundaries/entry-point": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              target: ["feature"],
              allow: "index.ts",
            },
            {
              target: ["shared"],
              allow: "**",
            },
            {
              target: ["app"],
              allow: "**",
            }
          ],
        },
      ],
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/features/*/*"],
            message: "Deep imports from features are not allowed. Use the feature's index.ts instead."
          }
        ]
      }]
    },
  },
);
