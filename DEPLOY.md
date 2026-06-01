# AzurTant PRO — Landing

Landing page lista para producción.

## Despliegue (3 opciones, todas en 5 minutos)

### Opción 1: Vercel (recomendado, gratis)
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Opción 2: Netlify (gratis)
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir=public
```

### Opción 3: GitHub Pages
1. Sube `public/` a un repo `emanuelazurcorp/emanuelazurcorp.github.io`
2. Settings → Pages → Source: `main` / root
3. Listo en `https://emanuelazurcorp.github.io`

## Dominio personalizado `emanuelazurcorp.com`

### Si usas Vercel
```bash
vercel domains add emanuelazurcorp.com
vercel domains add www.emanuelazurcorp.com
```
Te dará los nameservers. Cámbialos en tu registrar (GoDaddy, Namecheap, etc.) a:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

### Si usas Netlify
```bash
netlify domains:add emanuelazurcorp.com
```
Te dará un CNAME tipo `apex-loadbalancer.netlify.com`. Configura en tu DNS:
- `A` `@` → `75.2.60.5` (Netlify apex)
- `CNAME` `www` → `apex-loadbalancer.netlify.com`

### SSL
Vercel/Netlify emiten Let's Encrypt automáticamente. Sin acción.

## Contenido

- `public/landing.html` — la landing
- `public/robots.txt` — para SEO
- `public/sitemap.xml` — para SEO
- `public/og-image.svg` — preview para redes sociales

## Local dev

```bash
node serve.mjs
# Abre http://127.0.0.1:5193
```
