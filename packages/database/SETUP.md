# Database Setup

Run these commands from this folder:

```powershell
pwd
```

The path should end with:

```text
DEAL_intillegence\packages\database
```

Do not run `cd packages/database` again if you are already here.

## Required `.env`

Create:

```text
packages\database\.env
```

With your Supabase/PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

For Supabase, use the PostgreSQL connection string from:

```text
Supabase Project Settings > Database > Connection string
```

## Commands

```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

## If Prisma Generate Fails With EPERM On Windows

This usually means the Prisma query engine file is locked by a running Node/Nest process, antivirus, or OneDrive sync.

Try:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npx prisma generate
```

If it still fails, pause OneDrive sync for this folder and run `npx prisma generate` again.
