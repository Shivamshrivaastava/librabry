import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverImage: text("cover_image"),
  description: text("description"),
  averageRating: integer("average_rating").default(0),
  reviewCount: integer("review_count").default(0),
  availability: boolean("availability").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const myBooks = pgTable("my_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: varchar("book_id").references(() => books.id).notNull(),
  status: text("status").notNull().default("Want to Read"), // "Want to Read", "Currently Reading", "Read"
  rating: integer("rating"), // 1-5 stars
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  myBooks: many(myBooks),
}));

export const booksRelations = relations(books, ({ many }) => ({
  myBooks: many(myBooks),
}));

export const myBooksRelations = relations(myBooks, ({ one }) => ({
  user: one(users, { fields: [myBooks.userId], references: [users.id] }),
  book: one(books, { fields: [myBooks.bookId], references: [books.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export const insertMyBookSchema = createInsertSchema(myBooks).omit({
  id: true,
  addedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type InsertMyBook = z.infer<typeof insertMyBookSchema>;
export type MyBook = typeof myBooks.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;

export type BookWithUserData = Book & {
  userStatus?: string;
  userRating?: number;
  isInMyBooks?: boolean;
};

export type MyBookWithBook = MyBook & {
  book: Book;
};
