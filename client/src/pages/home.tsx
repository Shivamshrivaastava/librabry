import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import BookCard from "@/components/book-card";
import MyBookCard from "@/components/my-book-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookWithUserData, MyBookWithBook } from "@shared/schema";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");

  const { data: books, isLoading: booksLoading } = useQuery<BookWithUserData[]>({
    queryKey: ["/api/books"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: myBooks, isLoading: myBooksLoading } = useQuery<MyBookWithBook[]>({
    queryKey: ["/api/mybooks"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false, // don't spam if 401
  });

  const [myBooksFilter, setMyBooksFilter] = useState("all");

  const filteredMyBooks =
    myBooks?.filter((mb) => myBooksFilter === "all" || mb.status === myBooksFilter) || [];

  if (booksLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-book-brown to-book-chocolate text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Track Your Reading Journey</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Discover, read, and rate thousands of books
            </p>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-book-brown to-book-chocolate text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">Track Your Reading Journey</h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover, read, and rate thousands of books
          </p>
          <div className="flex justify-center space-x-6">
            <div className="bg-white/10 rounded-lg px-6 py-3">
              <span className="text-3xl font-bold">{books?.length || 0}</span>
              <span className="block text-sm opacity-80">Books Available</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Books Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Discover Books</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books?.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>

        {/* My Books only after login */}
        {isAuthenticated && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">My Books</h3>
            {myBooksLoading ? (
              <p className="text-gray-500">Loading your books...</p>
            ) : filteredMyBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyBooks.map((myBook) => (
                  <MyBookCard key={myBook.id} myBook={myBook} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No books in your library yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
