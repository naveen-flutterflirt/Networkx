# Server-rendered frontend deployment

The frontend now runs as a Next.js server rather than a static export. This is required so `/community/{slug}` returns Circle-specific HTML, canonical tags, Open Graph tags and Twitter metadata to Google, WhatsApp and other crawlers.

## Environment

```text
NEXT_PUBLIC_API_URL=https://api.example.com
API_INTERNAL_URL=http://private-api-host:8000
NEXT_PUBLIC_SITE_URL=https://www.networkxcircle.com
```

`API_INTERNAL_URL` is optional but recommended when the Next server can reach the backend through a private address. `NEXT_PUBLIC_API_URL` remains the browser-facing API address.

## Build and run

```bash
npm ci
npm run build
npm run start
```

The default port is 3000. Put the Next process behind the production reverse proxy and point the public domain to it. The old Firebase static `out/` deployment is no longer sufficient for public Circle SEO. Firebase users should deploy through Firebase App Hosting/Cloud Run or rewrite Hosting traffic to the Next server.

## Smoke checks

```bash
curl -I https://www.networkxcircle.com/community/<circle-slug>
curl -s https://www.networkxcircle.com/community/<circle-slug> | grep -E '<title>|og:title|canonical'
curl -I 'https://www.networkxcircle.com/community?c=<circle-slug>'
```

The clean URL must return `200`; the legacy query URL must redirect to it. View source should contain the Circle name and Circle-specific metadata without executing JavaScript.
