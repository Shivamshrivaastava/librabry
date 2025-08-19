# Overview

This is a React-based library management application similar to Goodreads, built with modern web technologies. The application allows users to register, log in, browse books, and track their reading progress with features like rating books and updating reading status. It follows a full-stack architecture with a React frontend and Express.js backend, using PostgreSQL for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI components
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens stored in HTTP-only cookies with bcrypt for password hashing
- **Middleware**: Custom authentication middleware to protect routes
- **API Design**: RESTful API endpoints with proper error handling

## Data Storage
- **Database**: PostgreSQL with Neon serverless connection
- **Schema**: Three main tables - users, books, and myBooks (junction table for user-book relationships)
- **Connection**: Connection pooling using @neondatabase/serverless
- **Migrations**: Drizzle Kit for database schema management

## Authentication & Authorization
- **Strategy**: JWT-based authentication with HTTP-only cookies
- **Password Security**: bcrypt for password hashing
- **Session Management**: Persistent sessions with cookie storage
- **Route Protection**: Middleware-based route protection for authenticated endpoints

## Key Features
- **User Management**: Registration, login, logout with email/password
- **Book Catalog**: Browse available books with cover images and descriptions
- **Personal Library**: Users can add books to their personal collection
- **Reading Status**: Track books as "Want to Read", "Currently Reading", or "Read"
- **Rating System**: 5-star rating system for books
- **Responsive Design**: Mobile-first design with responsive navigation

# External Dependencies

## Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation library
- **lucide-react**: Icon library
- **zod**: Schema validation library

## Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database driver
- **drizzle-orm**: Type-safe ORM for database operations
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing library
- **cookie-parser**: Cookie parsing middleware
- **express**: Web framework for Node.js

## Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **drizzle-kit**: Database schema management and migrations
- **vite**: Frontend build tool and development server
