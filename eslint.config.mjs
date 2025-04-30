import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginImport from 'eslint-plugin-import';
// Import TypeScript ESLint plugin and parser
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Apply TS config FIRST
  ...tseslint.configs.recommended, // Apply recommended TS rules
  // Then apply Next.js and Prettier overrides
  ...compat.extends(
    "next/core-web-vitals",
    "eslint-config-prettier" // Ensure Prettier runs last to override formatting
  ),
  // Configuration specific to import plugin (can often be merged)
  {
    files: ["**/*.ts", "**/*.tsx"], // Ensure TS files use the TS parser
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            project: ['./tsconfig.json', './tsconfig.worker.json'], // Let TS ESLint know about your projects
            tsconfigRootDir: __dirname,
        },
    },
    plugins: {
      import: eslintPluginImport,
      // Reference TS plugin again if needed for specific overrides below
      // '@typescript-eslint': tseslint.plugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          // project already specified in languageOptions.parserOptions
        },
        node: true
      },
    },
    rules: {
      // Your custom rule overrides/additions go here
      "react/no-unescaped-entities": "warn", // Keep this downgraded
      // Example: If you specifically need to allow require in some places
      // '@typescript-eslint/no-var-requires': 'off',
      // Or configure specific import rules
      'import/no-unresolved': 'error',
    }
  }
];

export default eslintConfig;
