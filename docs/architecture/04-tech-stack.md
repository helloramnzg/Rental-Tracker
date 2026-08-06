# 04 – Tech Stack

# Technology Stack

The Rental Tracker application is intentionally built using modern, free, and low-maintenance technologies. Every technology choice prioritises simplicity, reliability, and long-term maintainability over unnecessary complexity.

---

# Core Stack

| Layer | Technology | Purpose |
|--------|------------|---------|
| Frontend | Next.js 16 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS v4 | Utility-first styling |
| Components | shadcn/ui | Accessible UI components |
| Icons | Lucide React | Icon library |
| Forms | React Hook Form | Form management |
| Validation | Zod | Runtime validation |
| Charts | Recharts | Dashboard visualisations |
| PDF Generation | pdf-lib | Statement of Account (SOA) generation |
| Email | Resend | Reminder email delivery |
| Authentication | Supabase Auth | Secure landlord authentication |
| Database | Supabase PostgreSQL | Primary relational database |
| Storage | Supabase Storage | PDF and file storage |
| Hosting | Vercel | Application hosting |
| Version Control | Git + GitHub | Source control |
| Package Manager | npm | Dependency management |

---

# Backend Services

The application uses Supabase as its Backend-as-a-Service (BaaS).

Supabase provides:

- PostgreSQL database
- Authentication
- Storage
- Row Level Security (RLS)
- Database backups
- Edge Functions (future use)

No custom backend server is required for Version 1.

---

# Database Management

Database schema changes are managed using the Supabase CLI.

## Tools

- Supabase Database
- Supabase CLI
- Supabase Migrations

All database changes must be version-controlled through migration files.

Database schema must never be edited directly in production.

---

# Development Tools

- ESLint
- Prettier
- TypeScript
- GitHub
- Claude Code

---

# Deployment

Production deployment uses:

- Vercel
- Supabase

Deployment should occur automatically from the `main` branch.

---

# Future Integrations

Potential future integrations include:

- Stripe
- Messenger API
- SMS notifications
- Multiple property support
- Mobile application
