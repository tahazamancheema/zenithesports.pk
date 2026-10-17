# Zenith Esports Platform

![Zenith Esports](https://zenithesports.pk/favicon.ico)

Next-generation esports tournament platform and broadcasting portfolio for Zenith Esports, built on Next.js 16 (App Router) and Supabase.

## Tech Stack
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4, custom UI primitives (shadcn/ui inspired)
- **Animations**: Framer Motion & CSS keyframes
- **Database & Auth**: Supabase (PostgreSQL, RLS, Storage)
- **Emails**: Resend + React Email

## Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- A Supabase project

## Getting Started

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd zenithesports
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DISCORD_WEBHOOK_URL=your-discord-webhook-url
   RESEND_API_KEY=your-resend-api-key
   ```

3. **Database Setup**
   Run the Supabase SQL migrations located in `supabase/migrations/` in your Supabase SQL Editor.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components, layout structures, and specific page components.
- `src/lib`: Utilities for Supabase client creation, motion presets, discord webhooks, and formatting.
- `src/config`: Static configuration files for navigation and site metadata.
- `emails`: React Email templates.
- `supabase/migrations`: SQL schema definitions and RLS policies.

## Features
- **Player Dashboard**: Manage team rosters, register for tournaments, and upload payment proofs.
- **Admin Control Panel**: Review payments, approve teams, manage tournament status, and handle production enquiries.
- **Mark47 Production**: Distinct sub-brand portfolio showcasing broadcasting capabilities.
- **Atomic Registrations**: Concurrency-safe tournament registration using PostgreSQL row-level locks.

## License
Proprietary. All rights reserved by Zenith Esports.
