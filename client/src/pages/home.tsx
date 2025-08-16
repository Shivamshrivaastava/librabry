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
  const { isAuthenticated, user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");

  const { data: books, isLoading: booksLoading } = useQuery<BookWithUserData[]>({
    queryKey: ["/api/books"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: myBooks, isLoading: myBooksLoading } = useQuery<MyBookWithBook[]>({
    queryKey: ["/api/mybooks"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filterCategories = [
    { value: "all", label: "All Books" },
    { value: "fiction", label: "Fiction" },
    { value: "non-fiction", label: "Non-Fiction" },
    { value: "programming", label: "Programming" },
    { value: "science", label: "Science" },
  ];

  const myBookFilters = [
    { value: "all", label: "All", count: myBooks?.length || 0 },
    { value: "Want to Read", label: "Want to Read", count: myBooks?.filter(mb => mb.status === "Want to Read").length || 0 },
    { value: "Currently Reading", label: "Reading", count: myBooks?.filter(mb => mb.status === "Currently Reading").length || 0 },
    { value: "Read", label: "Read", count: myBooks?.filter(mb => mb.status === "Read").length || 0 },
  ];

  const [myBooksFilter, setMyBooksFilter] = useState("all");

  const filteredMyBooks = myBooks?.filter(myBook => 
    myBooksFilter === "all" || myBook.status === myBooksFilter
  ) || [];

  const stats = {
    booksRead: myBooks?.filter(mb => mb.status === "Read").length || 0,
    pagesRead: 3847, // This would be calculated from actual book pages
    averageRating: myBooks && myBooks.filter(mb => mb.rating).length > 0 
      ? myBooks.filter(mb => mb.rating).reduce((sum, mb) => sum + (mb.rating || 0), 0) / myBooks.filter(mb => mb.rating).length
      : 0,
    readingStreak: 23, // This would be calculated from reading dates
  };

  if (booksLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-book-brown to-book-chocolate text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Track Your Reading Journey</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">Discover, read, and rate thousands of books</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Track Your Reading Journey</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90">Discover, read, and rate thousands of books</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <span className="text-3xl font-bold">{books?.length || 0}</span>
                <span className="block text-sm opacity-80">Books Available</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <span className="text-3xl font-bold">892</span>
                <span className="block text-sm opacity-80">Active Readers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-wrap gap-3">
                {filterCategories.map((category) => (
                  <Button
                    key={category.value}
                    variant={activeFilter === category.value ? "default" : "outline"}
                    className={activeFilter === category.value ? "bg-book-brown hover:bg-book-brown/90" : ""}
                    onClick={() => setActiveFilter(category.value)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Sort by Popularity</SelectItem>
                  <SelectItem value="rating">Sort by Rating</SelectItem>
                  <SelectItem value="title">Sort by Title</SelectItem>
                  <SelectItem value="author">Sort by Author</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Books Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Discover Books</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books?.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>

        {/* My Books Section */}
        {isAuthenticated && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">My Books</h3>
              <div className="flex space-x-2">
                {myBookFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={myBooksFilter === filter.value ? "default" : "outline"}
                    className={`text-sm ${
                      myBooksFilter === filter.value ? "bg-book-brown hover:bg-book-brown/90" : ""
                    }`}
                    onClick={() => setMyBooksFilter(filter.value)}
                  >
                    {filter.label} ({filter.count})
                  </Button>
                ))}
              </div>
            </div>

            {myBooksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex space-x-4">
                      <Skeleton className="w-20 h-30" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredMyBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyBooks.map((myBook) => (
                  <MyBookCard key={myBook.id} myBook={myBook} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500">
                  {myBooksFilter === "all" 
                    ? "You haven't added any books to your library yet." 
                    : `No books with status "${myBooksFilter}".`
                  }
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Reading Stats */}
        {isAuthenticated && (
          <Card className="mb-12">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Reading Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-book-brown mb-2">{stats.booksRead}</div>
                  <div className="text-sm text-gray-600">Books Read This Year</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-book-orange mb-2">{stats.pagesRead}</div>
                  <div className="text-sm text-gray-600">Pages Read</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-book-green mb-2">{stats.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700 mb-2">{stats.readingStreak}</div>
                  <div className="text-sm text-gray-600">Day Reading Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
