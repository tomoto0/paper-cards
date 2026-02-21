import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  ExternalLink,
  BookOpen,
  Users,
  Calendar,
  RefreshCw,
  Trash2,
  Loader2,
  Link2,
  Share2,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface PaperDetailDialogProps {
  paper: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetranslate: (id: number) => void;
  onDelete: (id: number) => void;
  onShare: (paper: any) => void;
  onSelectPaper: (paper: any) => void;
  isRetranslating: boolean;
}

export function PaperDetailDialog({
  paper,
  open,
  onOpenChange,
  onRetranslate,
  onDelete,
  onShare,
  onSelectPaper,
  isRetranslating,
}: PaperDetailDialogProps) {
  const [relatedPapers, setRelatedPapers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  if (!paper) return null;

  // Related papers feature temporarily disabled to fix error
  const isLoadingRelated = false;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(paper.arxivUrl);
      setCopied(true);
      // Show visual feedback
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {paper.titleJa || paper.title}
        </DialogTitle>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white">
                {paper.journal || "arXiv"}
              </Badge>
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(paper.publishedAt)}
              </span>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Title Section */}
          <div className="space-y-2">
            {paper.titleJa && (
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {paper.titleJa}
              </h2>
            )}
            {paper.titleJa && paper.title && (
              <p className="text-sm text-slate-600 italic leading-relaxed">
                {paper.title}
              </p>
            )}
            {!paper.titleJa && (
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {paper.title}
              </h2>
            )}
          </div>

          {/* Authors */}
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-indigo-200">
            <Users className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-700 leading-relaxed">
              {paper.authors}
            </p>
          </div>
        </div>

        {/* Content Area with Scroll */}
        <ScrollArea className="flex-1 w-full h-full">
          <div className="w-full px-6 py-6 space-y-6">
            {/* Japanese Abstract */}
            {paper.abstractJa && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-lg font-bold text-slate-900">
                    要旨（日本語）
                  </h3>
                </div>
                <p className="text-base text-slate-700 leading-relaxed whitespace-normal">
                  {paper.abstractJa.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}
                </p>
              </section>
            )}

            {/* Divider */}
            {paper.abstractJa && paper.abstract && <Separator className="my-6" />}

            {/* English Abstract */}
            {paper.abstract && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Abstract (Original)
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-normal">
                  {paper.abstract.replace(/\n/g, " ").replace(/\s+/g, " ").trim()}
                </p>
              </section>
            )}

            {/* Related Papers Section */}
            {/* Related papers feature temporarily disabled */}

            {isLoadingRelated && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t px-6 py-4 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paper.arxivUrl, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                arXivで見る
              </Button>
              {paper.pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(paper.pdfUrl, "_blank")}
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  PDF
                </Button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex flex-wrap gap-2">
              {(!paper.titleJa || !paper.abstractJa) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetranslate(paper.id)}
                  disabled={isRetranslating}
                  className="gap-2"
                >
                  {isRetranslating ? (
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
                onClick={handleCopyUrl}
                className="gap-2"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {copied ? "コピーしました" : "共有"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(paper.id);
                  onOpenChange(false);
                }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
