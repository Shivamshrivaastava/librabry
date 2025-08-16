import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/star-rating";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MyBookWithBook } from "@shared/schema";
import { format } from "date-fns";

interface MyBookCardProps {
  myBook: MyBookWithBook;
}

export default function MyBookCard({ myBook }: MyBookCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/mybooks/${myBook.bookId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mybooks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const response = await apiRequest("PATCH", `/api/mybooks/${myBook.bookId}/rating`, { rating });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mybooks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update rating",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const handleRatingChange = (rating: number) => {
    updateRatingMutation.mutate(rating);
  };

  const getStatusBadge = () => {
    const statusMap = {
      "Want to Read": { color: "bg-book-orange text-white", label: "Planned" },
      "Currently Reading": { color: "bg-blue-500 text-white", label: "Reading" },
      "Read": { color: "bg-book-green text-white", label: "Completed" },
    };
    
    const status = statusMap[myBook.status as keyof typeof statusMap];
    return (
      <Badge className={status?.color || "bg-gray-500 text-white"}>
        {status?.label || myBook.status}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex space-x-4">
        <img
          src={myBook.book.coverImage || "https://via.placeholder.com/80x120?text=No+Cover"}
          alt={`${myBook.book.title} cover`}
          className="w-20 h-30 object-cover rounded"
        />
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{myBook.book.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{myBook.book.author}</p>
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reading Status:
            </label>
            <Select
              value={myBook.status}
              onValueChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-full text-sm focus:ring-2 focus:ring-book-brown">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Want to Read">Want to Read</SelectItem>
                <SelectItem value="Currently Reading">Currently Reading</SelectItem>
                <SelectItem value="Read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Your Rating:
            </label>
            <StarRating
              value={myBook.rating || 0}
              onChange={handleRatingChange}
              readonly={updateRatingMutation.isPending}
            />
          </div>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>
              {myBook.startedAt && format(new Date(myBook.startedAt), "MMM d, yyyy")}
              {myBook.finishedAt && format(new Date(myBook.finishedAt), "MMM d, yyyy")}
              {!myBook.startedAt && !myBook.finishedAt && myBook.addedAt && 
                `Added: ${format(new Date(myBook.addedAt), "MMM d, yyyy")}`
              }
            </span>
            {getStatusBadge()}
          </div>
        </div>
      </div>
    </Card>
  );
}
