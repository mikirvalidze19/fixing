# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Content management (Pages CMS)

Product data lives in `content/` as **one JSON file per product** (`content/products/*.json`) plus shared libraries (`content/badges`, `content/icons`, `content/standards`, `content/table-columns`). Photos uploaded by editors go to `content/images/*/`.

Non-developer editors add products through [Pages CMS](https://pagescms.org) (form UI configured by `.pages.yml`):

- Editors open **https://app.pagescms.org/mikirvalidze19/fixing** (or `/admin` on the site) and log in with a GitHub account that has write access to this repo.
- Publishing a product commits the JSON + image to this repo — Cloudflare Pages rebuilds and deploys automatically.
- `src/data/catalog.ts` is the single adapter that reads `content/` at build time; the legacy seed (`tecfi-georgia-planning/data/products.json`) remains as a fallback.
- The migration from the legacy sidecar files was done by `scripts/migrate-catalog.mjs` (idempotent; re-runnable).
- Variant tables are fully generic (`columns` + `cells`, see **docs/TABLE-ARCHITECTURE.md**); the one-time conversion from the old hard-coded slot fields was done by `scripts/migrate-table-columns.mjs` (`npm run migrate:table`).

See **docs/EDITOR-GUIDE.md** for the step-by-step editor guide.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
