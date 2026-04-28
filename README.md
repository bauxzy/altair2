# ✦ Altair 2.0 — Smart Expense Tracker

> *"Know where every rupee goes."*

![Altair 2.0](https://img.shields.io/badge/Altair-2.0-6366f1?style=for-the-badge&logo=trending-up&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

---

## 🌌 What is Altair 2.0?

Altair 2.0 is a **full-stack personal finance tracker** built specifically for Indian users. Whether you're paying via UPI, splitting chai money in cash, or tracking your Swiggy addiction — Altair 2.0 has you covered.

Dark by default. Fast by design. Built with ₹ in mind.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 **Auth** | Email/password + Google login via Supabase |
| 📊 **Dashboard** | Live balance, income, expenses + trend charts |
| 💸 **Transactions** | Add, edit, delete income & expense entries |
| 🏷️ **Categories** | 28 Indian-friendly categories + custom ones |
| 🎯 **Budgets** | Monthly category budgets with warning alerts |
| 📈 **Charts** | Pie chart + line chart powered by Recharts |
| 📤 **CSV Export** | Download all transactions as a spreadsheet |
| 🔍 **Search & Filter** | Filter by date, category, type, notes |
| 💳 **Payment Modes** | UPI, Cash, Card, Bank Transfer, Other |
| 🌑 **Dark Mode** | Dark by default, glassmorphism UI |
| 📱 **Responsive** | Works beautifully on mobile and desktop |

---

## 🛠️ Tech Stack

```
Frontend          Backend           Database & Auth
─────────         ───────           ───────────────
React 18          Node.js           Supabase (PostgreSQL)
Vite              Express.js        Row Level Security
TypeScript        TypeScript        Supabase Auth
Tailwind CSS      Zod Validation    Google OAuth
Recharts          CORS Ready
Zustand           RESTful API
React Hook Form
React Router
```

---

## 🗂️ Project Structure

```
altair2/
├── 🎨 frontend/
│   └── src/
│       ├── components/       # Layout, Modals, UI
│       ├── pages/            # Dashboard, Transactions, Budgets, Categories
│       ├── store/            # Zustand auth store
│       ├── lib/              # API client, Supabase, utilities
│       └── types/            # TypeScript interfaces
│
├── ⚙️ backend/
│   └── src/
│       ├── routes/           # auth, transactions, categories, budgets, dashboard
│       ├── middleware/       # JWT authentication
│       └── lib/              # Supabase client, Zod schemas
│
└── 🗄️ database/
    └── schema.sql            # Tables, RLS policies, 28 seeded categories
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- A Supabase project (free at supabase.com)

### 1. Clone the repo
```bash
git clone https://github.com/bauxzy/altair2.git
cd altair2
```

### 2. Set up the database
- Go to your Supabase project → SQL Editor
- Run the contents of `database/schema.sql`

### 3. Configure environment variables

**Backend** (`backend/.env`):
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 4. Install & run

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### 5. Open the app
```
http://localhost:5173
```

---

## 🏷️ Indian-Friendly Categories

Altair 2.0 comes preloaded with **28 categories** that actually make sense in India:

**Expenses:** Food & Dining · Groceries · Transport/Auto · Rent · Utilities · Shopping · Healthcare · Entertainment · **Swiggy/Zomato** · Education · Fuel · Travel · Gym · **Subscriptions** · EMI/Loan · Insurance · Personal Care · Gifts · Miscellaneous

**Income:** Salary · **Freelance** · Business · Investment Returns · Rental Income · Bonus · Gift/Transfer · Refund · Other Income

---

## 💳 Supported Payment Modes

```
📲 UPI    💵 Cash    💳 Card    🏦 Bank Transfer    🔄 Other
```

---

## 📸 Screenshots

| Dashboard | Transactions | Budgets |
|-----------|-------------|---------|
| Balance, charts & trends | Add/edit/delete entries | Category spending limits |

---

## 🔒 Security

- All API routes protected with JWT authentication
- Row Level Security (RLS) on all Supabase tables — users can only see their own data
- Service role key never exposed to frontend
- `.env` files excluded from version control

---

## 🌐 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase |

---

## 📄 License

MIT License — feel free to fork and build on top of it.

---

<div align="center">

**Built with 💜 by Avik**

*Altair — the brightest star in Aquila. Your finances, finally clear.*

</div>
