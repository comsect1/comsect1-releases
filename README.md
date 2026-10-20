# comsect1-releases

Shared binary release & OTA update distribution repository for the **Comsect1 Product Suite**.

## Multi-Product Convention

1. **GitHub Release Tags (Per-Product Namespaced)**
   - `<product>-latest` — Rolling OTA & latest installer channel for `<product>` (e.g., `eschaton-latest`, `orrery-latest`, `gantry-latest`, `dcb-latest`, `hsb-latest`, `halo-latest`)
   - `<product>-v<semver>` — Immutable versioned release tag for `<product>` (e.g., `eschaton-v0.1.1`, `orrery-v0.1.0`)

2. **Repository Directory Layout (Per-Product Namespaced)**
   - `packages/<product>/` — Optional product-specific metadata, manifests, or bootstrap scripts.
   - The repository root is strictly reserved for shared multi-product index documentation (`README.md`) and must never be occupied by a single product's `package.json` or binaries.

## Product Channels

| Product | Rolling OTA & Installer Tag | NPM / CLI Direct Tarball Install |
| :--- | :--- | :--- |
| **Eschaton** | `eschaton-latest` | `npm i -g https://github.com/comsect1/comsect1-releases/releases/download/eschaton-latest/eschaton-latest.tgz` |
| **Orrery** | `orrery-latest` | `npm i -g https://github.com/comsect1/comsect1-releases/releases/download/orrery-latest/orrery-latest.tgz` |
| **Gantry** | `gantry-latest` | `npm i -g https://github.com/comsect1/comsect1-releases/releases/download/gantry-latest/gantry-latest.tgz` |