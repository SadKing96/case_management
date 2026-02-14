 # Board - Case Management System

A modern, Kanban-style case management application for internal team workflows. Built as a monorepo with a React frontend and Node.js/Express backend.

## 🚀 Features

- **Kanban Board**: Drag-and-drop interface for managing cases across columns.
- **Card Management**: Create, edit, move, archive, and delete cards (Orders & Quotes).
- **User Management**: Admin/SuperUser tools to manage team members and roles.
- **Team Boards**: Create and switch between multiple boards.
- **Premium UI**: Modern dark/light mode aesthetic with glassmorphism effects.

## 🛠 Tech Stack

- **Monorepo**: Turborepo / NPM Workspaces
- **Frontend**: React, Vite, TypeScript, Vanilla CSS (Variables/Themes)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: Azure SQL (configured via Prisma)
- **Shared**: Shared TypeScript types package

## 📂 Repository Structure

```
├── apps
│   ├── backend     # Express server & Prisma ORM
│   └── frontend    # React application (Vite)
├── packages
│   └── shared      # Shared TypeScript types & utilities
└── infra           # Application infrastructure
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- NPM

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd case-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   - Create `.env` in `apps/backend` with `DATABASE_URL` and `JWT_SECRET`.
   - Create `.env` in `apps/frontend` if needed (e.g. `VITE_API_URL`).

### Running Locally

To run both frontend and backend concurrently:

```bash
# From the root directory
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request