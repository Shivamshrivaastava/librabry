import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import BookCard from "@/components/book-card";
import type { BookWithUserData } from "@shared/schema";

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [filterBy, setFilterBy] = useState("all");

  const { data: books, isLoading } = useQuery<BookWithUserData[]>({
    queryKey: ["/api/books"],
  });

  // Filter and sort books based on search and filters
  const filteredBooks = books?.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === "available") return matchesSearch && book.availability;
    if (filterBy === "unavailable") return matchesSearch && !book.availability;
    
    return matchesSearch;
  });

  const sortedBooks = filteredBooks?.sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.author.localeCompare(b.author);
      case "rating":
        return (b.averageRating || 0) - (a.averageRating || 0);
      case "reviews":
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-book-brown mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading books...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Browse Books</h1>
          <p className="text-lg text-gray-600">
            Discover your next great read from our collection of {books?.length || 0} books
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>

            {/* Sort Control */}
            <div className="w-full lg:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="author">Author A-Z</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Control */}
            <div className="w-full lg:w-48">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {searchQuery || filterBy !== "all" 
              ? `Showing ${sortedBooks?.length || 0} of ${books?.length || 0} books`
              : `Showing all ${books?.length || 0} books`
            }
          </p>
        </div>

        {/* Books Grid */}
        {sortedBooks && sortedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? `No books match "${searchQuery}". Try a different search term.`
                : "No books match your current filters."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}