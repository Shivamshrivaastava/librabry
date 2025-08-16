import { users, books, myBooks, type User, type InsertUser, type Book, type InsertBook, type MyBook, type InsertMyBook, type BookWithUserData, type MyBookWithBook } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Book methods
  getAllBooks(): Promise<Book[]>;
  getBooksWithUserData(userId?: string): Promise<BookWithUserData[]>;
  createBook(book: InsertBook): Promise<Book>;

  // MyBooks methods
  getUserBooks(userId: string): Promise<MyBookWithBook[]>;
  addBookToUser(myBook: InsertMyBook): Promise<MyBook>;
  updateBookStatus(userId: string, bookId: string, status: string): Promise<MyBook | undefined>;
  updateBookRating(userId: string, bookId: string, rating: number): Promise<MyBook | undefined>;
  getUserBookStatus(userId: string, bookId: string): Promise<MyBook | undefined>;
  removeBookFromUser(userId: string, bookId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllBooks(): Promise<Book[]> {
    return db.select().from(books);
  }

  async getBooksWithUserData(userId?: string): Promise<BookWithUserData[]> {
    const booksQuery = db.select().from(books);
    const allBooks = await booksQuery;

    if (!userId) {
      return allBooks.map(book => ({ ...book, isInMyBooks: false }));
    }

    // Get user's books to check status
    const userBooks = await db.select().from(myBooks).where(eq(myBooks.userId, userId));
    const userBookMap = new Map(userBooks.map(ub => [ub.bookId, ub]));

    return allBooks.map(book => {
      const userBook = userBookMap.get(book.id);
      return {
        ...book,
        userStatus: userBook?.status,
        userRating: userBook?.rating || undefined,
        isInMyBooks: !!userBook,
      };
    });
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(insertBook)
      .returning();
    return book;
  }

  async getUserBooks(userId: string): Promise<MyBookWithBook[]> {
    const result = await db
      .select({
        myBook: myBooks,
        book: books,
      })
      .from(myBooks)
      .leftJoin(books, eq(myBooks.bookId, books.id))
      .where(eq(myBooks.userId, userId));

    return result.map(row => ({
      ...row.myBook,
      book: row.book!,
    }));
  }

  async addBookToUser(insertMyBook: InsertMyBook): Promise<MyBook> {
    // Check if already exists
    const existing = await this.getUserBookStatus(insertMyBook.userId, insertMyBook.bookId);
    if (existing) {
      throw new Error("Book already in user's library");
    }

    const [myBook] = await db
      .insert(myBooks)
      .values(insertMyBook)
      .returning();
    return myBook;
  }

  async updateBookStatus(userId: string, bookId: string, status: string): Promise<MyBook | undefined> {
    const updateData: any = { status };
    
    if (status === "Currently Reading" && !updateData.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === "Read") {
      updateData.finishedAt = new Date();
    }

    const [updated] = await db
      .update(myBooks)
      .set(updateData)
      .where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId)))
      .returning();
    return updated;
  }

  async updateBookRating(userId: string, bookId: string, rating: number): Promise<MyBook | undefined> {
    const [updated] = await db
      .update(myBooks)
      .set({ rating })
      .where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId)))
      .returning();
    return updated;
  }

  async getUserBookStatus(userId: string, bookId: string): Promise<MyBook | undefined> {
    const [myBook] = await db
      .select()
      .from(myBooks)
      .where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId)));
    return myBook;
  }

  async removeBookFromUser(userId: string, bookId: string): Promise<void> {
    await db
      .delete(myBooks)
      .where(and(eq(myBooks.userId, userId), eq(myBooks.bookId, bookId)));
  }
}

export const storage = new DatabaseStorage();
