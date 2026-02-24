import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FavoriteButtonProps {
  paperId: number;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ paperId, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if paper is favorited
  const { data: isFav } = trpc.favorites.check.useQuery(
    { paperId },
    { enabled: !!paperId }
  );

  useEffect(() => {
    if (isFav !== undefined) {
      setIsFavorite(isFav);
    }
  }, [isFav]);

  const addFavMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      setIsFavorite(true);
      toast.success("お気に入りに追加しました");
      onToggle?.(true);
    },
    onError: () => {
      toast.error("お気に入りの追加に失敗しました");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const removeFavMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      setIsFavorite(false);
      toast.success("お気に入りから削除しました");
      onToggle?.(false);
    },
    onError: () => {
      toast.error("お気に入りの削除に失敗しました");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleToggle = useCallback(async () => {
    setIsLoading(true);
    if (isFavorite) {
      removeFavMutation.mutate({ paperId });
    } else {
      addFavMutation.mutate({ paperId });
    }
  }, [isFavorite, paperId, addFavMutation, removeFavMutation]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={`gap-2 ${
        isFavorite
          ? "text-red-500 hover:text-red-600 hover:bg-red-50"
          : "text-slate-400 hover:text-red-500 hover:bg-red-50"
      }`}
    >
      <Heart
        className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
      />
      {isFavorite ? "お気に入り済み" : "お気に入り"}
    </Button>
  );
}
