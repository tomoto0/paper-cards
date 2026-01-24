import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  
  const utils = trpc.useUtils();
  
  const { data: keywords = [], isLoading: keywordsLoading } = trpc.keywords.list.useQuery();
  const { data: papers = [], isLoading: papersLoading } = trpc.papers.list.useQuery({ sortBy });
  
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
                  <Search className="h-5 w-5 text-indigo-500" />
                  キーワード設定
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                論文検索に使用するキーワードを管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="新しいキーワードを入力..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddKeyword}
                  disabled={addKeywordMutation.isPending || !newKeyword.trim()}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </div>
              
              {keywordsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : keywords.length === 0 ? (
                <p className="text-center text-slate-500 py-4">
                  キーワードがありません。上のフォームから追加してください。
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <div
                      key={kw.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        kw.isActive 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <Switch
                        checked={kw.isActive}
                        onCheckedChange={() => toggleKeywordMutation.mutate({ id: kw.id })}
                        className="data-[state=checked]:bg-indigo-500"
                      />
                      <span className={kw.isActive ? 'text-slate-700' : 'text-slate-400'}>
                        {kw.keyword}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKeywordMutation.mutate({ id: kw.id })}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">並び替え:</span>
            {(['createdAt', 'publishedAt', 'journal'] as SortBy[]).map((sort) => (
              <Button
                key={sort}
                variant={sortBy === sort ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(sort)}
                className={sortBy === sort ? "bg-indigo-500 hover:bg-indigo-600" : ""}
              >
                {sortLabels[sort]}
              </Button>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            {papers.length}件の論文
          </p>
        </div>

        {/* Papers Grid */}
        {papersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : papers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 text-center">
                論文がありません。<br />
                キーワードを設定して「論文を取得」ボタンをクリックしてください。
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <Card 
                key={paper.id} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 hover:border-indigo-300"
                onClick={() => setSelectedPaper(paper)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
                      {paper.journal || 'arXiv'}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(paper.publishedAt)}
                    </div>
                  </div>
                  <CardTitle className="text-base leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {paper.titleJa || paper.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                    <Users className="h-3 w-3" />
                    <span className="line-clamp-1">{paper.authors}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {getAbstractPreview(paper)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Paper Detail Dialog */}
      <Dialog open={!!selectedPaper} onOpenChange={() => setSelectedPaper(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedPaper && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {selectedPaper.journal || 'arXiv'}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {formatDate(selectedPaper.publishedAt)}
                  </span>
                </div>
                <DialogTitle className="text-xl leading-tight">
                  {selectedPaper.titleJa || selectedPaper.title}
                </DialogTitle>
                {selectedPaper.titleJa && (
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedPaper.title}
                  </p>
                )}
                <DialogDescription className="flex items-center gap-1 mt-2">
                  <Users className="h-4 w-4" />
                  {selectedPaper.authors}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {selectedPaper.abstractJa && (
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                        要旨（日本語）
                      </h4>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {selectedPaper.abstractJa.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-slate-400 rounded-full"></span>
                      Abstract（原文）
                    </h4>
                    <p className="text-slate-500 leading-relaxed whitespace-pre-wrap text-sm">
                      {selectedPaper.abstract.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}
                    </p>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedPaper.arxivUrl, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    arXivで見る
                  </Button>
                  {selectedPaper.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedPaper.pdfUrl, '_blank')}
                      className="gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      PDF
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {(!selectedPaper.titleJa || !selectedPaper.abstractJa) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retranslateMutation.mutate({ id: selectedPaper.id })}
                      disabled={retranslateMutation.isPending}
                      className="gap-2"
                    >
                      {retranslateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      翻訳
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareOnX(selectedPaper)}
                    className="gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    共有
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      deletePaperMutation.mutate({ id: selectedPaper.id });
                      setSelectedPaper(null);
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    削除
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
