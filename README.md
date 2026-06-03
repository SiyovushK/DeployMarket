# DeployMarket — Full-Stack E-Commerce Platform

A full-stack web application featuring a public product catalog with a customer account area and an admin panel for content management.

**Demo:** [deploymarket.vercel.app](https://deploymarket.vercel.app) *(Initial load may take up to 50 sec., please wait)*

| Role | Username | Password |
|---|---|---|
| User | `user@example.com` | `UserPassword` |
| Content Manager | `manager@example.com` | `ManagerPassword` |
| Super Admin | `admin@example.com` | `AdminPassword` |

---

## About

The project is a ready-to-use e-commerce solution with two separate interfaces:

**For customers** — a storefront with a catalog, filtering and search, product pages with image gallery and ingredient breakdown, favorites, a blog, an About page, FAQ, and a personal account area.

**For administrators** — a CMS panel for managing products, categories, banners, articles, FAQ, and site-wide settings. Access is split between two roles: Content Manager and Super Admin.

---

## Tech Stack

**Frontend:** React 18, TypeScript, TailwindCSS, TanStack Query, Zustand, React Router v6  
**Backend:** ASP.NET Core 9, Entity Framework Core 9, PostgreSQL  
**Auth:** JWT with access + refresh token rotation, BCrypt  
**Deployment:** Docker Compose

---

## Features

### Customer
- Catalog with filtering by category, price range, "hit" and "new" flags, full-text search and pagination
- Product page: image gallery, ingredient list with daily value percentages, quality certificates, links to Ozon / Wildberries
- Favorites — works without an account, syncs to the server after login
- Blog with articles, About page, FAQ
- Personal account: edit profile, change password

### Admin Panel
- **Products** — create and edit listings, upload images, manage statuses (Draft / Published / Out of Stock)
- **Categories** — nested tree structure with drag-and-drop reordering
- **Banners** — homepage slider with title, description, link and sort order
- **Articles** — blog posts with cover image upload
- **FAQ** — full CRUD with reordering
- **Pages** — editable content blocks with HTML editor and image upload
- **Site Settings** *(Super Admin only)* — contacts, social and marketplace links, branding, logo upload, gallery management
- **Users** *(Super Admin only)* — buyer and staff lists, create staff accounts, block/unblock

---

## Auth & Permissions

Role-based access control with permission claims embedded in the JWT token. Permissions are verified on each protected endpoint without an additional database query.

| Role | Access |
|---|---|
| `Buyer` | Personal account, favorites |
| `ContentManager` | Products, categories, all content |
| `SuperAdmin` | Everything above + users and site settings |

---

## Deployment

The project is deployed online using free-tier cloud platforms:

- **Frontend** — [Vercel](https://vercel.com)
- **Backend** — [Render](https://render.com)
- **Database** — [Neon](https://neon.tech) (serverless PostgreSQL)
- **File storage** — [Cloudinary](https://cloudinary.com)

---

## Project Structure

```
Proj/
├── docker-compose.yml          # Unified dev/prod compose file
├── .env.example                # Environment variable template
│
├── Backend/
│   ├── Dockerfile
│   ├── Domain/                 # Entities, DTOs, Enums, constants
│   ├── Infrastructure/         # EF Core, services, migrations
│   └── WebApi/                 # Controllers, Swagger, Program.cs
│       └── wwwroot/uploads/    # Uploaded files (products, banners, pages)
│
└── Frontend/
    ├── Dockerfile
    ├── nginx.conf              # Production nginx — proxies /api & /uploads to backend
    ├── .env                    # VITE_APP_API_URL (dev only)
    └── src/
        ├── api/                # Axios client + typed API wrappers
        ├── components/         # Reusable UI + layouts
        ├── hooks/              # useFavoritesSync, useProfileSync
        ├── pages/              # admin/, auth/, public/
        ├── router/             # React Router v6 config + guards
        ├── store/              # Zustand stores (auth, favorites)
        └── types/              # Shared TypeScript interfaces
```
