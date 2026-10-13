# TOPAS paper website

A static companion website for *From Textbooks to Proactive Agentic Systems*.

## Develop locally

```sh
npm ci
npm run dev
```

## Deploy

Run `npm run build`, copy the generated `dist` contents into `docs`, and commit
the updated `docs` directory. GitHub Pages publishes `main` from `/docs`.

The linked paper is `public/TOPAS_ICLR.pdf`. Replace that file when updating the
paper shown on the site.
