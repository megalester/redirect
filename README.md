# Redirect System (Vercel) — Dark Admin + JSON analytics

## Setup
1. Create GitHub repo and push this project.
2. In Vercel, import the repo.
3. Set Environment Variables in Vercel (Project Settings):
   - `ADMIN_PASSWORD` = <your admin password>
   - `BASE_DOMAIN` = mdght.com   (or your domain)
4. Add domains to Vercel:
   - `mdght.com`
   - `*.mdght.com` (wildcard)
5. Deploy.

## Admin
Visit:
`https://<your-deploy>.vercel.app/admin`

Login with the admin password you configured.

## Generate redirect (via UI)
- Enter destination URL and click Generate.
- The dashboard will produce the redirect and save the mapping.

## Local generation (optional)
- Use scripts/generate_local.js or call `/api/admin/generate` from your automation.

## Notes on persistence
This implementation stores redirects and analytics in JSON files under `/data` in the deployed environment.
- On Vercel, the filesystem is ephemeral across new deployments or some runtime instances.
- For production-critical usage, migrate storage to a database (Supabase, PlanetScale, Vercel KV, or S3).
- JSON is great for testing, low-volume use, and quick iteration.

## Security
- Protect `ADMIN_PASSWORD` as an environment variable in Vercel.
- The dashboard uses a simple token-based handshake after login. For stronger security, integrate JWT or OAuth.

