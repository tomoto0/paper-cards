import { useState } from "react";
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
  Loader2
} from "lucide-react";

type SortBy = 'createdAt' | 'publishedAt' | 'journal';

export default function Home() {
  const [newKeyword, setNewKeyword] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [selectedPaper, setSelectedPaper] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<any>({});
  
  const utils = trpc.useUtils();
  
  const { data: keywords = [], isLoading: keywordsLoading } = trpc.keywords.list.useQuery();
  const { data: papers = [], isLoading: papersLoading } = trpc.papers.list.useQuery({ sortBy });
  const { data: categories = [], isLoading: categoriesLoading } = trpc.papers.categories.useQuery();
  const { data: searchResults = [], isLoading: searchLoading } = trpc.papers.search.useQuery(
    { query: searchQuery, ...filters, sortBy },
    { enabled: !!searchQuery || Object.keys(filters).length > 0 }
  );
  
  const displayedPapers = (searchQuery || Object.keys(filters).length > 0) ? searchResults : papers;
  const isSearching = searchQuery || Object.keys(filters).length > 0;
  
  const addKeywordMutation = trpc.keywords.add.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("キーワードを追加しました");
        utils.keywords.list.invalidate();
        setNewKeyword("");
      } else {
        toast.error("キーワードの追加に失敗しました");
      }
    },
    onError: () => toast.error("キーワードの追加に失敗しました"),
  });
  
  const deleteKeywordMutation = trpc.keywords.delete.useMutation({
    onSuccess: () => {
      toast.success("キーワードを削除しました");
      utils.keywords.list.invalidate();
    },
    onError: () => toast.error("キーワードの削除に失敗しました"),
  });
  
  const toggleKeywordMutation = trpc.keywords.toggle.useMutation({
    onSuccess: () => {
      utils.keywords.list.invalidate();
    },
    onError: () => toast.error("キーワードの切り替えに失敗しました"),
  });
  
  const fetchPapersMutation = trpc.papers.fetch.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        utils.papers.list.invalidate();
      } else {
        toast.error(data.message);
      }
    },
    onError: () => toast.error("論文の取得に失敗しました"),
  });
  
  const deletePaperMutation = trpc.papers.delete.useMutation({
    onSuccess: () => {
      toast.success("論文を削除しました");
      utils.papers.list.invalidate();
    },
    onError: () => toast.error("論文の削除に失敗しました"),
  });
  
  const retranslateMutation = trpc.papers.retranslate.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        utils.papers.list.invalidate();
        setSelectedPaper(null);
      } else {
        toast.error(data.message);
      }
    },
    onError: () => toast.error("翻訳に失敗しました"),
  });
  
  const retranslateAllMutation = trpc.papers.retranslateAll.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        utils.papers.list.invalidate();
      } else {
        toast.error(data.message);
      }
    },
    onError: () => toast.error("翻訳に失敗しました"),
  });
  
  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeywordMutation.mutate({ keyword: newKeyword.trim() });
    }
  };
  
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "不明";
    const date = new Date(timestamp);
    const now = new Date();
    if (date > now) return "本日";
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const getAbstractPreview = (paper: any) => {
    const text = paper.abstractJa || paper.abstract;
    const cleaned = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > 150 ? cleaned.substring(0, 150) + "..." : cleaned;
  };
  
  const shareOnX = (paper: any) => {
    const title = paper.titleJa || paper.title;
    const text = encodeURIComponent(`📄 ${title}\n${paper.arxivUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const sortLabels: Record<SortBy, string> = {
    createdAt: '登録順',
    publishedAt: '発行日順',
    journal: 'ジャーナル順'
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Paper Catcher
                </h1>
                <p className="text-xs text-slate-500">学術論文自動収集・翻訳システム</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                onClick={() => fetchPapersMutation.mutate()}
                disabled={fetchPapersMutation.isPending}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {fetchPapersMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                論文を取得
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* SEO H2 heading - hidden visually but accessible to search engines */}
        <h2 className="sr-only">arXiv論文の自動収集とAI翻訳機能</h2>
        
        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6 border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  キーワード管理
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="新しいキーワードを入力..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddKeyword();
                    }
                  }}
                  disabled={addKeywordMutation.isPending}
                />
                <Button
                  onClick={handleAddKeyword}
                  disabled={addKeywordMutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </div>

              {keywords.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">登録済みキーワード:</p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((kw) => (
                        <div
                          key={kw.id}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <Switch
                            checked={kw.isActive}
                            onCheckedChange={() =>
                              toggleKeywordMutation.mutate({ id: kw.id })
                            }
                            disabled={toggleKeywordMutation.isPending}
                          />
                          <span className={`text-sm ${!kw.isActive ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {kw.keyword}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              deleteKeywordMutation.mutate({ id: kw.id })
                            }
                            disabled={deleteKeywordMutation.isPending}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => retranslateAllMutation.mutate()}
                  disabled={retranslateAllMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {retranslateAllMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  全て再翻訳
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter Bar */}
        <SearchFilterBar
          onSearch={setSearchQuery}
          onFilter={setFilters}
          categories={categories}
          isLoading={searchLoading}
        />

        {/* Papers Count and Sort */}
        <div className="flex items-center justify-between my-6">
          <div className="text-sm text-slate-600">
            {isSearching ? (
              <>
                検索結果: <span className="font-semibold text-slate-900">{displayedPapers.length}</span>件
              </>
            ) : (
              <>
                保存済み論文: <span className="font-semibold text-slate-900">{papers.length}</span>件
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">ソート:</span>
            <div className="flex gap-1">
              {(Object.keys(sortLabels) as SortBy[]).map((sort) => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                  className={`gap-1 ${sortBy === sort ? "bg-indigo-600 text-white" : ""}`}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortLabels[sort]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {(searchLoading || papersLoading) && displayedPapers.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-slate-600">読み込み中...</p>
              </div>
            </div>
          ) : displayedPapers.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">
                  {isSearching ? "検索結果がありません" : "論文がまだ保存されていません"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {isSearching ? "別の検索条件をお試しください" : "「論文を取得」ボタンをクリックして論文を取得してください"}
                </p>
              </div>
            </div>
          ) : (
            displayedPapers.map((paper: any) => (
              <Card
                key={paper.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedPaper(paper)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="bg-indigo-600 text-white flex-shrink-0">
                      {paper.journal || "arXiv"}
                    </Badge>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {formatDate(paper.publishedAt)}
                    </span>
                  </div>
                  <CardTitle className="text-base leading-tight mt-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {paper.titleJa || paper.title}
                  </CardTitle>
                  {paper.titleJa && paper.title && (
                    <CardDescription className="text-xs italic line-clamp-1">
                      {paper.title}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-600 line-clamp-1">{paper.authors}</p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {getAbstractPreview(paper)}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(paper.arxivUrl, "_blank");
                      }}
                      className="flex-1 gap-1 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      arXiv
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareOnX(paper);
                      }}
                      className="flex-1 gap-1 text-xs"
                    >
                      <Search className="h-3 w-3" />
                      X
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePaperMutation.mutate({ id: paper.id });
                      }}
                      disabled={deletePaperMutation.isPending}
                      className="flex-1 gap-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Paper Detail Dialog */}
      <PaperDetailDialog
        paper={selectedPaper}
        open={!!selectedPaper}
        onOpenChange={(open) => !open && setSelectedPaper(null)}
        onRetranslate={(id) => retranslateMutation.mutate({ id })}
        onDelete={(id) => deletePaperMutation.mutate({ id })}
        onShare={() => {}}
        onSelectPaper={setSelectedPaper}
        isRetranslating={retranslateMutation.isPending}
      />
    </div>
  );
}
