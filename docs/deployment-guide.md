# Deployment Guide - QLNP-TTCDS

## Prerequisites

- Node.js 18+ or Bun 1.x
- Supabase account (free tier works)
- Git

## 1. Supabase Project Setup

### Create Project
1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. Note the project URL and anon/public key from Settings > API

### Run Migration
The migration file at `supabase/migrations/20260416034940_xxx.sql` contains the full schema.

**Option A: Via Supabase Dashboard (SQL Editor)**
- Copy contents of the migration file
- Paste into SQL Editor and run

**Option B: Via Supabase CLI**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### Seed Data (Manual)
After migration, seed the database via Supabase Dashboard SQL Editor:

```sql
-- Insert departments
INSERT INTO departments (name, code) VALUES
  ('Phong Hanh chinh Tong hop', 'P.HCTH'),
  ('Phong Chuyen mon 1', 'P.CM1');

-- Insert employee accounts (password_hash should be proper hash in production)
INSERT INTO employees (username, password_hash, full_name, role, department_id, is_active)
SELECT
  'admin', 'admin123', 'Quan tri vien', 'QTHT', id, true
FROM departments WHERE code = 'P.HCTH';

-- Insert leave types
INSERT INTO leave_types (name, code, default_days) VALUES
  ('Nghi phep nam', 'YEARLY', 12),
  ('Nghi om', 'SICK', 5),
  ('Nghi viec rieng', 'PERSONAL', 3);
```

## 2. Environment Variables

Create `.env.local` (or set in hosting dashboard):

```bash
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

- `VITE_SUPABASE_URL`: your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the `anon` public key (not the service_role secret)

These MUST be prefixed with `VITE_` for Vite to expose them to the client bundle.

## 3. Local Development

```bash
# Install dependencies
bun install
# or: pnpm install

# Start dev server (http://localhost:8080)
bun run dev
# or: pnpm dev
```

Visit `http://localhost:8080` to access the app. Login page at `/login`.

## 4. Build for Production

```bash
bun run build
# or: pnpm build
```

Output goes to `dist/` directory. This is a fully static build (SPA) - no server-side rendering.

### Build Output Structure
```
dist/
  index.html
  assets/
    index-{hash}.js
    index-{hash}.css
```

## 5. Deployment Options

### Vercel (Recommended)

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure build settings:
   - Framework Preset: Vite
   - Build Command: `bun run build` or `pnpm build`
   - Output Directory: `dist`
4. Add environment variables in Vercel project settings
5. Deploy

For SPA routing, add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Netlify

1. Push code to Git provider
2. Import project in Netlify
3. Build settings:
   - Build command: `bun run build`
   - Publish directory: `dist`
4. Add environment variables
5. For SPA routing, add `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Static Hosting (Nginx, Apache, S3+CloudFront)

Copy `dist/` contents to web root. Configure server to rewrite all paths to `index.html`:

**Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 6. Post-Deployment Verification

- [ ] Landing page at route `/` redirects to `/login` (if not authenticated)
- [ ] Login with seeded account works
- [ ] Role-based sidebar shows correct menu items
- [ ] Create leave request -> approve -> verify in calendar
- [ ] Charts render on Reports, Summary, Violations pages
- [ ] Mobile responsive: sidebar toggle works on narrow viewport

## 7. Environment Validation (Recommended)

The app currently does not validate environment variables at startup. Missing `VITE_SUPABASE_URL` causes cryptic runtime errors. Consider adding validation in `src/integrations/supabase/client.ts`:

```typescript
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Thieu bien moi truong Supabase. Vui long kiem tra VITE_SUPABASE_URL va VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}
```

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid URL" on Supabase client init | Check `VITE_SUPABASE_URL` includes `https://` |
| Login always fails | Seed employee accounts in Supabase SQL Editor. Check password matches `password_hash` column value |
| Blank page on route | SPA routing not configured on host. Add rewrite rules to serve `index.html` for all paths |
| Charts not rendering | Check Recharts imported correctly. Ensure container has explicit width/height |
| CORS errors | Supabase API allows browser requests by default. If errors, check Supabase project API settings |
| build command fails | Run `bun install` / `pnpm install` first. Check Node.js / Bun version compatibility |
