import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    // Paths are relative to this config's directory (src/), which is also where
    // `npm run lint` runs. They previously carried an extra "src/" prefix, so
    // they resolved to src/src/** and matched no files at all - eslint reported
    // success while linting nothing.
    files: [
      "components/**/*.{js,mjs,cjs,jsx}",
      "pages/**/*.{js,mjs,cjs,jsx}",
      "App.jsx",
    ],
    ignores: ["lib/**/*", "components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      // Colour must come from the token layer, never from Tailwind's built-in
      // palettes - a literal palette class cannot follow a token change. The
      // same rule is checked over the whole tree by
      // src/test/design-system.test.jsx; this one catches it in the editor.
      // Both string and template-literal className forms are covered.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:text|bg|border|from|to|via|ring|divide|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00)\\b/]",
          message:
            "Raw Tailwind palette colour. Use a semantic token (primary, muted, destructive, success, warning, info) or the categorical scale (category-1..5). See docs/design-system.md.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\b(?:text|bg|border|from|to|via|ring|divide|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00)\\b/]",
          message:
            "Raw Tailwind palette colour. Use a semantic token (primary, muted, destructive, success, warning, info) or the categorical scale (category-1..5). See docs/design-system.md.",
        },
      ],
    },
  },
];
