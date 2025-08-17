import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MyBookCard from "@/components/my-book-card";
import type { MyBookWithBook } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function MyBooks() {
  const queryClient = useQueryClient();

  // Fetch my books
  const {
    data: myBooks = [],
    isLoading,
    error,
  } = useQuery<MyBookWithBook[]>({
    queryKey: ["/api/mybooks"],
    queryFn: async () => {
      const res = await fetch("/api/mybooks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch my books");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Update book status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "Want to Read" | "Currently Reading" | "Read";
    }) => {
      const res = await fetch(`/api/mybooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      // Refresh after updating
      queryClient.invalidateQueries({ queryKey: ["/api/mybooks"] });
    },
  });

  if (isLoading) return <div>Loading my books...</div>;
  if (error) return <div>Failed to load my books</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
      {myBooks.map((myBook) => (
        <div key={myBook.id} className="space-y-4">
          {/* Show book details */}
          <MyBookCard myBook={myBook} />

          {/* Status update buttons */}
          <div className="flex space-x-2">
            {["Want to Read", "Currently Reading", "Read"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={myBook.status === status ? "default" : "outline"}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: myBook.id,
                    status: status as "Want to Read" | "Currently Reading" | "Read",
                  })
                }
                disabled={updateStatusMutation.isPending}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
