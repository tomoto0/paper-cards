import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaperDetailDialog } from "@/components/PaperDetailDialog";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  ExternalLink,
  Calendar,
  Users,
  BookOpen,
  Trash2,
  Heart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function Favorites() {
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: favorites = [], isLoading: favoritesLoading } =
    trpc.favorites.list.useQuery();

  const deletePaperMutation = trpc.papers.delete.useMutation({
    onSuccess: () => {
      toast.success("論文を削除しました");
      utils.favorites.list.invalidate();
    },
    onError: () => toast.error("論文の削除に失敗しました"),
  });

  const handleDeletePaper = (paperId: number) => {
    if (confirm("この論文を削除してもよろしいですか？")) {
      deletePaperMutation.mutate({ id: paperId });
    }
  };

  const shareOnX = (paper: any) => {
    const title = paper.titleJa || paper.title;
    const text = encodeURIComponent(`📄 ${title}\n${paper.arxivUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  if (favoritesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">お気に入りを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Favorites</h1>
              <p className="text-sm text-slate-500">
                {favorites.length}件のお気に入り論文
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {favorites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-4">
                お気に入りの論文がまだありません
              </p>
              <p className="text-slate-400 text-sm">
                論文カードのハートボタンをクリックして、お気に入りに追加してください
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((paper) => (
              <Card
                key={paper.id}
                className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {paper.journal && (
                      <Badge variant="secondary" className="text-xs">
                        {paper.journal}
                      </Badge>
                    )}
                    {paper.publishedAt && (
                      <span className="text-xs text-slate-500">
                        {new Date(paper.publishedAt).toLocaleDateString(
                          "ja-JP"
                        )}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-3">
                    {paper.titleJa || paper.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-3">
                  <div className="space-y-3">
                    {/* Authors */}
                    <div className="flex items-start gap-2 text-sm">
                      <Users className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-600 line-clamp-2">
                        {paper.authors}
                      </p>
                    </div>

                    {/* Abstract */}
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {paper.abstractJa || paper.abstract}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                      {paper.citationCount !== undefined && (
                        <span>引用数: {paper.citationCount}</span>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="border-t border-slate-200 pt-3 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPaper(paper)}
                    className="flex-1 gap-1 text-xs"
                  >
                    <BookOpen className="h-3 w-3" />
                    詳細
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(paper.arxivUrl, "_blank")}
                    className="flex-1 gap-1 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                    arXiv
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareOnX(paper)}
                    className="flex-1 gap-1 text-xs"
                  >
                    <span>𝕏</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePaper(paper.id)}
                    disabled={deletePaperMutation.isPending}
                    className="flex-1 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    削除
                  </Button>
                </div>

                {/* Favorite Button */}
                <div className="border-t border-slate-200 pt-2">
                  <FavoriteButton
                    paperId={paper.id}
                    onToggle={(isFav) => {
                      if (!isFav) {
                        utils.favorites.list.invalidate();
                      }
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Paper Detail Dialog */}
      {selectedPaper && (
        <PaperDetailDialog
          paper={selectedPaper}
          open={!!selectedPaper}
          onOpenChange={(open) => {
            if (!open) setSelectedPaper(null);
          }}
          onRetranslate={() => {}}
          onDelete={() => {}}
          onShare={() => {}}
          onSelectPaper={() => {}}
          isRetranslating={false}
        />
      )}
    </div>
  );
}
