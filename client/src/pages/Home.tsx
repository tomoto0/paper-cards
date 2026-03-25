import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PaperDetailDialog } from "@/components/PaperDetailDialog";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Users, 
  BookOpen,
  Settings,
  RefreshCw,
  ArrowUpDown,
  X,
  Loader2,
  Heart
} from "lucide-react";

type SortBy = 'createdAt' | 'publishedAt' | 'journal' | 'relevance' | 'citations';

export default function Home() {
  const [newKeyword, setNewKeyword] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<any>({});
  
  // Compute currentSort from sortBy
  const sortMap: Record<SortBy, 'relevance' | 'date' | 'citations'> = {
    'createdAt': 'relevance',
    'publishedAt': 'date',
    'journal': 'relevance',
    'relevance': 'relevance',
    'citations': 'citations',
  };
  const currentSort = sortMap[sortBy];
  
  const utils = trpc.useUtils();
  
  const { data: keywords = [], isLoading: keywordsLoading } = trpc.keywords.list.useQuery();
  const { data: papers = [], isLoading: papersLoading } = trpc.papers.list.useQuery({ sortBy });
  const { data: categories = [], isLoading: categoriesLoading } = trpc.papers.categories.useQuery();
  
  // Memoize search query input to prevent infinite loops
  const searchInput = useMemo(() => {
    return { query: searchQuery, ...filters, sortBy };
  }, [searchQuery, filters, sortBy]);
  
  const { data: searchResults = [], isLoading: searchLoading } = trpc.papers.search.useQuery(
    searchInput,
    { enabled: !!searchQuery || Object.keys(filters).length > 0 }
  );
  
  const displayedPapers = (searchQuery || Object.keys(filters).length > 0) ? searchResults : papers;
  const isSearching = searchQuery || Object.keys(filters).length > 0;
  
  const addKeywordMutation = trpc.keywords.add.useMutation({
    onSuccess: () => {
      setNewKeyword("");
      utils.keywords.list.invalidate();
      toast.success("キーワードを追加しました");
    },
    onError: () => {
      toast.error("キーワードの追加に失敗しました");
    },
  });

  const fetchPapersMutation = trpc.papers.fetch.useMutation({
    onSuccess: (result) => {
      utils.papers.list.invalidate();
      utils.keywords.list.invalidate();
      toast.success(`${result.count}件の論文を取得しました`);
    },
    onError: () => {
      toast.error("論文の取得に失敗しました");
    },
  });

  const deletePaperMutation = trpc.papers.delete.useMutation({
    onSuccess: () => {
      utils.papers.list.invalidate();
      utils.papers.search.invalidate();
      toast.success("論文を削除しました");
    },
    onError: () => {
      toast.error("論文の削除に失敗しました");
    },
  });

  const deleteKeywordMutation = trpc.keywords.delete.useMutation({
    onSuccess: () => {
      utils.keywords.list.invalidate();
      toast.success("キーワードを削除しました");
    },
    onError: () => {
      toast.error("キーワードの削除に失敗しました");
    },
  });

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      addKeywordMutation.mutate({ keyword: newKeyword });
    }
  };

  const handleDeleteKeyword = useCallback((id: number) => {
    if (confirm("このキーワードを削除してもよろしいですか？")) {
      deleteKeywordMutation.mutate({ id });
    }
  }, [deleteKeywordMutation]);

  const handleFetchPapers = useCallback(() => {
    if (keywords.length === 0) {
      toast.error("キーワードを追加してください");
      return;
    }
    fetchPapersMutation.mutate({ keywords: keywords.map(k => k.keyword) });
  }, [keywords, fetchPapersMutation]);

  const handleDeletePaper = (paperId: number) => {
    if (confirm("この論文を削除してもよろしいですか？")) {
      deletePaperMutation.mutate({ id: paperId });
    }
  };

  const handleSort = useCallback((newSort: 'relevance' | 'date' | 'citations') => {
    const sortByMap: Record<'relevance' | 'date' | 'citations', SortBy> = {
      'relevance': 'relevance',
      'date': 'publishedAt',
      'citations': 'citations',
    };
    setSortBy(sortByMap[newSort]);
  }, []);

  const sortLabels: Record<'relevance' | 'date' | 'citations', string> = {
    'relevance': '関連性',
    'date': '発行日',
    'citations': '引用数',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Paper Catcher</h1>
                <p className="text-sm text-slate-500">学術論文自動収集・閲覧システム</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                設定
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <a href="/favorites">
                  <Heart className="h-4 w-4" />
                  お気に入り
                </a>
              </Button>
              <Button
                onClick={handleFetchPapers}
                disabled={fetchPapersMutation.isPending || keywords.length === 0}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {fetchPapersMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    取得中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    論文を取得
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {showSettings && (
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">キーワード管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddKeyword} className="space-y-2">
                    <Input
                      placeholder="キーワードを入力..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      disabled={addKeywordMutation.isPending}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full"
                      disabled={addKeywordMutation.isPending || !newKeyword.trim()}
                    >
                      {addKeywordMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          追加中...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          追加
                        </>
                      )}
                    </Button>
                  </form>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-sm mb-2">登録済みキーワード</h3>
                    <ScrollArea className="h-64">
                      <div className="space-y-2 pr-4">
                        {keywordsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          </div>
                        ) : keywords.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">
                            キーワードなし
                          </p>
                        ) : (
                          keywords.map((keyword) => (
                            <div
                              key={keyword.id}
                              className="flex items-center justify-between p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                {keyword.keyword}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKeyword(keyword.id)}
                                disabled={deleteKeywordMutation.isPending}
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter Bar */}
            <SearchFilterBar
              onSearch={(query) => setSearchQuery(query)}
              onFilter={(newFilters) => setFilters(newFilters)}
              categories={categories}
              currentSort={currentSort}
              onSort={handleSort}
            />

            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isSearching ? "検索結果" : "全論文"}
                </h2>
                <p className="text-sm text-slate-500">
                  {displayedPapers.length}件の論文
                </p>
              </div>
              {isSearching && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    ソート: <span className="font-semibold">{sortLabels[currentSort]}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Papers Grid */}
            {papersLoading || searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-slate-600">
                    {papersLoading ? "論文を読み込み中..." : "検索中..."}
                  </p>
                </div>
              </div>
            ) : displayedPapers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    {isSearching ? "検索結果がありません" : "論文がありません"}
                  </h3>
                  <p className="text-slate-500">
                    {isSearching
                      ? "別のキーワードで検索してみてください"
                      : "キーワードを追加して「論文を取得」をクリックしてください"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedPapers.map((paper: any) => (
                  <Card
                    key={paper.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => setSelectedPaper(paper)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {paper.category && (
                            <Badge className="mb-2 bg-indigo-600 hover:bg-indigo-700">
                              {paper.category}
                            </Badge>
                          )}
                          <CardTitle className="text-base leading-tight">
                            {paper.titleJa || paper.title}
                          </CardTitle>
                        </div>
                        <FavoriteButton paperId={paper.id} />
                      </div>
                      {paper.abstractJa && (
                        <CardDescription className="text-xs mt-2 line-clamp-2">
                          {paper.abstractJa}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {paper.authors && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{paper.authors}</span>
                        </div>
                      )}
                      {paper.publishedAt && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {new Date(paper.publishedAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      )}
                      {paper.journal && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{paper.journal}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(paper.arxivUrl, "_blank");
                          }}
                          className="gap-2 flex-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          arXiv
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePaper(paper.id);
                          }}
                          disabled={deletePaperMutation.isPending}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paper Detail Dialog */}
      {selectedPaper && (
        <PaperDetailDialog
          paper={selectedPaper}
          open={!!selectedPaper}
          onOpenChange={() => setSelectedPaper(null)}
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
