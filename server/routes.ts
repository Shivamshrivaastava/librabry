import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, loginSchema, insertMyBookSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed some books on startup
  await seedBooks();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  });

  // Books routes
  app.get("/api/books", async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const books = await storage.getBooksWithUserData(userId);
      res.json(books);
    } catch (error) {
      console.error("Get books error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // MyBooks routes (protected)
  app.get("/api/mybooks", authenticateToken, async (req: any, res) => {
    try {
      const userBooks = await storage.getUserBooks(req.user.id);
      res.json(userBooks);
    } catch (error) {
      console.error("Get user books error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/mybooks/:bookId", authenticateToken, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      const { status = "Want to Read" } = req.body;

      const myBookData = {
        userId: req.user.id,
        bookId,
        status,
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

  app.patch("/api/mybooks/:bookId/status", authenticateToken, async (req: any, res) => {
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

  app.patch("/api/mybooks/:bookId/rating", authenticateToken, async (req: any, res) => {
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

  app.delete("/api/mybooks/:bookId", authenticateToken, async (req: any, res) => {
    try {
      const { bookId } = req.params;
      await storage.removeBookFromUser(req.user.id, bookId);
      res.json({ message: "Book removed from library" });
    } catch (error) {
      console.error("Remove book error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function seedBooks() {
  try {
    // Check if books already exist
    const existingBooks = await storage.getAllBooks();
    if (existingBooks.length > 0) {
      return;
    }

    // Seed initial books
    const initialBooks = [
      {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt & David Thomas",
        coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "A guide to pragmatic programming techniques",
        averageRating: 4,
        reviewCount: 324,
        availability: true,
      },
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "A handbook of agile software craftsmanship",
        averageRating: 5,
        reviewCount: 892,
        availability: true,
      },
      {
        title: "Dune",
        author: "Frank Herbert",
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "Epic science fiction novel about politics, religion, and ecology",
        averageRating: 4,
        reviewCount: 1256,
        availability: true,
      },
      {
        title: "The Silent Patient",
        author: "Alex Michaelides",
        coverImage: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "Psychological thriller about a woman's act of violence",
        averageRating: 4,
        reviewCount: 2847,
        availability: true,
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        coverImage: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=400",
        description: "An easy and proven way to build good habits and break bad ones",
        averageRating: 5,
        reviewCount: 3421,
        availability: true,
      },
    ];

    for (const book of initialBooks) {
      await storage.createBook(book);
    }

    console.log("Books seeded successfully");
  } catch (error) {
    console.error("Error seeding books:", error);
  }
}
