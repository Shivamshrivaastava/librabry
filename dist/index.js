var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  books: () => books,
  booksRelations: () => booksRelations,
  insertBookSchema: () => insertBookSchema,
  insertMyBookSchema: () => insertMyBookSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  myBooks: () => myBooks,
  myBooksRelations: () => myBooksRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverImage: text("cover_image"),
  description: text("description"),
  averageRating: integer("average_rating").default(0),
  reviewCount: integer("review_count").default(0),
  availability: boolean("availability").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var myBooks = pgTable("my_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  status: text("status").notNull().default("Want to Read"),
  // "Want to Read", "Currently Reading", "Read"
  rating: integer("rating"),
  // 1-5 stars
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  addedAt: timestamp("added_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  myBooks: many(myBooks)
}));
var booksRelations = relations(books, ({ many }) => ({
  myBooks: many(myBooks)
}));
var myBooksRelations = relations(myBooks, ({ one }) => ({
  user: one(users, { fields: [myBooks.userId], references: [users.id] }),
  book: one(books, { fields: [myBooks.bookId], references: [books.id] })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true
});
var insertMyBookSchema = createInsertSchema(myBooks).omit({
  id: true,
  addedAt: true
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var connectionString = "postgresql://neondb_owner:npg_wo2ErX9NvBTO@ep-withered-sunset-a1t7kpsh-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
var pool = new Pool({ connectionString });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllBooks() {
    return db.select().from(books);
  }
  async getBooksWithUserData(userId) {
    const booksQuery = db.select().from(books);
    const allBooks = await booksQuery;
    if (!userId) {
      return allBooks.map((book) => ({ ...book, isInMyBooks: false }));
    }
    const userBooks = await db.select().from(myBooks).where(eq(myBooks.userId, userId));
    const userBookMap = new Map(userBooks.map((ub) => [ub.bookId, ub]));
    return allBooks.map((book) => {
      const userBook = userBookMap.get(book.id);
      return {
        ...book,
        userStatus: userBook?.status,
        userRating: userBook?.rating || void 0,
        isInMyBooks: !!userBook
      };
    });
  }
  async createBook(insertBook) {
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }
  async getUserBooks(userId) {
    const result = await db.select({
      myBook: myBooks,
      book: books
    }).from(myBooks).leftJoin(books, eq(myBooks.bookId, books.id)).where(eq(myBooks.userId, userId));
    return result.map((row) => ({
      ...row.myBook,
      book: row.book
    }));
  }
  async addBookToUser(insertMyBook) {
    const existing = await this.getUserBookStatus(insertMyBook.userId, insertMyBook.bookId);
    if (existing) {
      throw new Error("Book already in user's library");
    }
    const [myBook] = await db.insert(myBooks).values(insertMyBook).returning();
    return myBook;
  }
  async updateBookStatus(userId, bookId, status) {
    const updateData = { status };
    if (status === "Currently Reading" && !updateData.startedAt) {
      updateData.startedAt = /* @__PURE__ */ new Date();
    } else if (status === "Read") {
      updateData.finishedAt = /* @__PURE__ */ new Date();
    }
    const [updated] = await db.update(myBooks).set(updateData).where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId))).returning();
    return updated;
  }
  async updateBookRating(userId, bookId, rating) {
    const [updated] = await db.update(myBooks).set({ rating }).where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId))).returning();
    return updated;
  }
  async getUserBookStatus(userId, bookId) {
    const [myBook] = await db.select().from(myBooks).where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId)));
    return myBook;
  }
  async removeBookFromUser(userId, bookId) {
    await db.delete(myBooks).where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId)));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z as z2 } from "zod";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};
async function registerRoutes(app2) {
  await seedBooks();
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });
  app2.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  });
  app2.get("/api/books", async (req, res) => {
    try {
      const userId = req.user?.id;
      const books2 = await storage.getBooksWithUserData(userId);
      res.json(books2);
    } catch (error) {
      console.error("Get books error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/mybooks", authenticateToken, async (req, res) => {
    try {
      const userBooks = await storage.getUserBooks(req.user.id);
      res.json(userBooks);
    } catch (error) {
      console.error("Get user books error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/mybooks/:bookId", authenticateToken, async (req, res) => {
    try {
      const { bookId } = req.params;
      const { status = "Want to Read" } = req.body;
      const myBookData = {
        userId: req.user.id,
        bookId,
        status
      };
      const myBook = await storage.addBookToUser(myBookData);
      res.json(myBook);
    } catch (error) {
      if (error instanceof Error && error.message === "Book already in user's library") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Add book error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/mybooks/:bookId/status", authenticateToken, async (req, res) => {
    try {
      const { bookId } = req.params;
      const { status } = req.body;
      if (!["Want to Read", "Currently Reading", "Read"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updated = await storage.updateBookStatus(req.user.id, bookId, status);
      if (!updated) {
        return res.status(404).json({ message: "Book not found in your library" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/mybooks/:bookId/rating", authenticateToken, async (req, res) => {
    try {
      const { bookId } = req.params;
      const { rating } = req.body;
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
      }
      const updated = await storage.updateBookRating(req.user.id, bookId, rating);
      if (!updated) {
        return res.status(404).json({ message: "Book not found in your library" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update rating error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/mybooks/:bookId", authenticateToken, async (req, res) => {
    try {
      const { bookId } = req.params;
      await storage.removeBookFromUser(req.user.id, bookId);
      res.json({ message: "Book removed from library" });
    } catch (error) {
      console.error("Remove book error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function seedBooks() {
  try {
    const existingBooks = await storage.getAllBooks();
    if (existingBooks.length > 0) {
      return;
    }
    const initialBooks = [
      {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt & David Thomas",
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "A guide to pragmatic programming techniques",
        averageRating: 4,
        reviewCount: 324,
        availability: true
      },
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "A handbook of agile software craftsmanship",
        averageRating: 5,
        reviewCount: 892,
        availability: true
      },
      {
        title: "Dune",
        author: "Frank Herbert",
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "Epic science fiction novel about politics, religion, and ecology",
        averageRating: 4,
        reviewCount: 1256,
        availability: true
      },
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        coverImage: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "Psychological thriller about a woman's act of violence",
        averageRating: 4,
        reviewCount: 2847,
        availability: true
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        coverImage: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "An easy and proven way to build good habits and break bad ones",
        averageRating: 5,
        reviewCount: 3421,
        availability: true
      }
    ];
    for (const book of initialBooks) {
      await storage.createBook(book);
    }
    console.log("Books seeded successfully");
  } catch (error) {
    console.error("Error seeding books:", error);
  }
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import cors from "cors";
import * as nodePath from "path";
import { fileURLToPath } from "url";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(cookieParser());
var __filename = fileURLToPath(import.meta.url);
var __dirname = nodePath.dirname(__filename);
var CLIENT_URL = "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
    const clientDistPath = nodePath.resolve(__dirname, "public");
    app.get("*", (_req, res) => {
      res.sendFile(nodePath.join(clientDistPath, "index.html"));
    });
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`\u{1F680} Server running on port ${port}`);
    }
  );
})();
