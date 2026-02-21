import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  BookOpen,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState } from "react";

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
  const [relatedPapers] = useState<any[]>([]);

  if (!paper) return null;

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
      {/* max-h-[85vh] と flex flex-col で画面高さを超えないように制限 */}
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {paper.titleJa || paper.title}
        </DialogTitle>

        {/* Header Section */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {paper.titleJa || paper.title}
              </DialogTitle>
              {paper.titleJa && paper.title && (
                <p className="text-sm text-slate-600 italic mt-1">
                  {paper.title}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-indigo-600 text-white">
                {paper.journal || "arXiv"}
              </Badge>
              <span className="text-xs text-slate-600">
                {formatDate(paper.publishedAt)}
              </span>
            </div>

            {/* Authors */}
            <DialogDescription className="text-sm text-slate-700">
              {paper.authors}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* ScrollAreaに flex-1 を与え、残りの高さを全てスクロール領域にする */}
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6 text-sm leading-relaxed pr-4">
            {/* Japanese Abstract */}
            {paper.abstractJa && (
              <div>
                <h4 className="font-semibold text-base mb-2 text-slate-900">
                  要旨（日本語訳）
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {paper.abstractJa}
                </p>
              </div>
            )}

            {/* Divider */}
            {paper.abstractJa && paper.abstract && <Separator className="my-4" />}

            {/* English Abstract */}
            {paper.abstract && (
              <div>
                <h4 className="font-semibold text-base mb-2 text-slate-900">
                  Abstract (Original)
                </h4>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {paper.abstract}
                </p>
              </div>
            )}

            {/* Loading indicator for related papers */}
            {relatedPapers.length === 0 && (
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
                onClick={() => onShare(paper)}
                className="gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                共有
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
