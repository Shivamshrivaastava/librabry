import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from "@/components/star-rating";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, Heart } from "lucide-react";
import type { BookWithUserData } from "@shared/schema";

interface BookCardProps {
  book: BookWithUserData;
}

export default function BookCard({ book }: BookCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToMyBooksMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await apiRequest("POST", `/api/mybooks/${bookId}`, {
        status: "Want to Read",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mybooks"] });
      toast({
        title: "Book added!",
        description: `${book.title} has been added to your library.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add book",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToMyBooks = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add books to your library.",
        variant: "destructive",
      });
      return;
    }

    if (book.isInMyBooks) {
      toast({
        title: "Book already in library",
        description: "This book is already in your library.",
      });
      return;
    }

    addToMyBooksMutation.mutate(book.id);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={book.coverImage || "https://via.placeholder.com/300x400?text=No+Cover"}
          alt={`${book.title} cover`}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 cursor-pointer" />
        </div>
      </div>

      <CardContent className="p-4">
        <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">{book.title}</h4>
        <p className="text-sm text-gray-600 mb-2">{book.author}</p>

        <div className="flex items-center mb-3">
          <StarRating value={book.averageRating || 0} readonly size="sm" />
          <span className="text-sm text-gray-500 ml-2">{book.averageRating || 0}</span>
          <span className="text-sm text-gray-400 ml-1">({book.reviewCount || 0})</span>
        </div>

        <Button
          onClick={handleAddToMyBooks}
          disabled={addToMyBooksMutation.isPending || book.isInMyBooks}
          className={`w-full font-medium transition-colors ${
            book.isInMyBooks
              ? "bg-book-green hover:bg-book-green/90"
              : "bg-book-orange hover:bg-book-orange/90"
          }`}
        >
          {addToMyBooksMutation.isPending ? (
            "Adding..."
          ) : book.isInMyBooks ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Added to My Books
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Want to Read
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
