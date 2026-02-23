# SVG Filter Matrix

A tiny in-browser image filter playground built with vanilla HTML, CSS, and TypeScript.

## What it is

Apply convolution kernels and color adjustments to images with instant preview, then bake results into a new image state.

## What makes it special

- Vanilla stack: no UI framework
- Very small bundle: under 10 kB gzipped total
- GPU-assisted live preview using SVG filters (`feConvolveMatrix`, `feColorMatrix`)
- Destructive "bake" workflow for stable performance over many edits

## Install & build

```bash
npm install
npm run build

# To start a development server with hot reload
npm run dev

# To preview the production build locally:
npm run preview
```

## License

GNU Affero General Public License v3.0 (AGPL-3.0), see `LICENSE`
