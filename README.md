# Smart Bank

A full-featured online banking simulation built with React, TypeScript, Vite, and MUI. It includes separate customer, employee, and admin portals backed by browser `localStorage` (no external server required).

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Default Accounts

On first run the app seeds two system accounts:

| Role     | Email                   | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@smartbank.com      | admin123    |
| Employee | employee@smartbank.com   | employee123 |

All other data (customers, cards, transactions) starts empty — customer accounts are created via Sign Up or by an employee, and require admin/employee approval.

## Tech Stack

- React 19 + TypeScript
- Vite
- MUI (Material UI) + Emotion
- React Router
- Recharts, Framer Motion
