import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import MyBookCard from "@/components/my-book-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { MyBookWithBook } from "@shared/schema";
import { useEffect } from "react";

export default function MyBooksPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: myBooks, isLoading } = useQuery<MyBookWithBook[]>({
    queryKey: ["/api/mybooks"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const statusFilters = [
    { value: "all", label: "All Books", count: myBooks?.length || 0 },
    { value: "Want to Read", label: "Want to Read", count: myBooks?.filter(mb => mb.status === "Want to Read").length || 0 },
    { value: "Currently Reading", label: "Currently Reading", count: myBooks?.filter(mb => mb.status === "Currently Reading").length || 0 },
    { value: "Read", label: "Read", count: myBooks?.filter(mb => mb.status === "Read").length || 0 },
  ];

  const filteredBooks = myBooks?.filter(book => 
    statusFilter === "all" || book.status === statusFilter
  ) || [];

  const stats = {
    total: myBooks?.length || 0,
    read: myBooks?.filter(mb => mb.status === "Read").length || 0,
    reading: myBooks?.filter(mb => mb.status === "Currently Reading").length || 0,
    wantToRead: myBooks?.filter(mb => mb.status === "Want to Read").length || 0,
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Books</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-book-brown mb-1">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Books</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-book-green mb-1">{stats.read}</div>
              <div className="text-sm text-gray-600">Read</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-500 mb-1">{stats.reading}</div>
              <div className="text-sm text-gray-600">Currently Reading</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-book-orange mb-1">{stats.wantToRead}</div>
              <div className="text-sm text-gray-600">Want to Read</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              className={statusFilter === filter.value ? "bg-book-brown hover:bg-book-brown/90" : ""}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex space-x-4">
                  <Skeleton className="w-20 h-30" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((myBook) => (
              <MyBookCard key={myBook.id} myBook={myBook} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {statusFilter === "all" ? "No books in your library" : `No books with status "${statusFilter}"`}
              </h3>
              <p className="text-gray-600 mb-6">
                {statusFilter === "all" 
                  ? "Start building your library by browsing and adding books you want to read."
                  : "Try changing the filter or add more books to your library."
                }
              </p>
              <Link href="/">
                <Button className="bg-book-brown hover:bg-book-brown/90">
                  Browse Books
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
