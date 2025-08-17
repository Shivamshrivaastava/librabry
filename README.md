# 📚 Books Library Management System

A full-stack web application for managing a digital books library.  
Built with **React (Vite) + Express + Drizzle ORM + Neon (Postgres)**.  
Deployed on **Render**.

---
## website is live at -> https://librabry.onrender.com

## 🚀 Features

- **User Authentication**
  - Register & Login with JWT + Cookies
  - Session management with Express + Cookie Parser

- **Books Management**
  - Browse books available in the library
  - Add books to "My Library" after login
  - Track reading status (e.g. Reading, Completed)

- **Personal Library**
  - Each user has a personal collection of borrowed/added books
  - Update book status from "My Library"

- **Responsive UI**
  - Built with **React, TailwindCSS, Radix UI**
  - Mobile-first design

---

## 🛠️ Tech Stack

### Frontend
- React + Vite
- TypeScript
- TailwindCSS + Radix UI
- React Query for API state management
- Wouter for routing

### Backend
- Express.js
- TypeScript
- Drizzle ORM
- Neon (Postgres Cloud Database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)

### Dev Tools
- Vite (bundler)
- tsx (TypeScript runtime)
- Render (deployment)

---

## 📂 Project Structure

```
.
├── client/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # API utilities (queryClient.ts)
│   │   ├── pages/        # App pages (Home, My Library, etc.)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   └── styles/           # TailwindCSS config
│
├── server/               # Backend (Express + Drizzle)
│   ├── db.ts             # Database connection (Neon)
│   ├── index.ts          # Server entrypoint
│   ├── routes.ts         # API routes (auth, books, mybooks)
│   ├── storage.ts        # Session + JWT helpers
│   └── vite.ts           # Vite setup (dev mode)
│
├── shared/               # Shared types/schema (Zod + Drizzle)
│   └── schema.ts
│
├── package.json          # Common for client + server
├── drizzle.config.ts     # Drizzle ORM config
├── tailwind.config.ts    # Tailwind config
└── tsconfig.json
```

---

## ⚙️ Setup & Installation

### 1️⃣ Clone Repository
```bash
git clone https://github.com/<your-username>/books-library.git
cd books-library
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Database Setup (Neon PostgreSQL)
1. Create a Neon Postgres database.
2. Copy connection string into `.env`:
   ```
   DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
   JWT_SECRET=your_jwt_secret
   ```
3. Push schema using Drizzle:
   ```bash
   npm run db:push
   ```

### 4️⃣ Development
Run frontend & backend together:
```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:5000  

### 5️⃣ Build & Production
```bash
npm run build
npm start
```

---

## 🌐 Deployment (Render)

### Steps:
1. Push your repo to GitHub.
2. Create a new **Render Web Service**.
3. Set:
   - **Build Command**:  
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:  
     ```bash
     npm start
     ```
4. Add **Environment Variables** in Render Dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
5. Deploy 🚀

Your app will be live at:
```
https://<your-app-name>.onrender.com
```

---

## 🔍 API Endpoints

### Auth
- `POST /api/auth/register` → Register user
- `POST /api/auth/login` → Login user
- `POST /api/auth/logout` → Logout user

### Books
- `GET /api/books` → Get all books

### My Library
- `GET /api/mybooks` → Get user’s personal library
- `POST /api/mybooks/:bookId` → Add book to personal library
- `PATCH /api/mybooks/:bookId` → Update status (Reading/Completed)

---

## 📊 Database Schema

### Users
| Column    | Type        |
|-----------|-------------|
| id        | UUID (PK)   |
| email     | Text (unique) |
| password  | Text (hashed) |

### Books
| Column   | Type      |
|----------|-----------|
| id       | UUID (PK) |
| title    | Text      |
| author   | Text      |

### MyBooks
| Column    | Type        |
|-----------|-------------|
| id        | UUID (PK)   |
| user_id   | FK → Users  |
| book_id   | FK → Books  |
| status    | Enum (Reading/Completed) |

---

## 👨‍💻 Author
- Developed by **Shivam Shrivastava**  
- 🔗 [GitHub](https://github.com/Shivamshrivaastava)  

---

## 📜 License
MIT License
