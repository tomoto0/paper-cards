import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";

type SortOption = 'relevance' | 'date' | 'citations';

interface SearchFilterBarProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    author?: string;
    startDate?: number;
    endDate?: number;
    category?: string;
  }) => void;
  onSort: (sortBy: 'createdAt' | 'publishedAt' | 'journal' | 'relevance' | 'citations') => void;
  categories: string[];
  isLoading?: boolean;
  currentSort?: SortOption;
}

export function SearchFilterBar({
  onSearch,
  onFilter,
  onSort,
  categories,
  isLoading = false,
  currentSort = 'relevance',
}: SearchFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const handleApplyFilters = useCallback(() => {
    onFilter({
      author: author || undefined,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      category: category || undefined,
    });
    setShowFilters(false);
  }, [author, startDate, endDate, category, onFilter]);

  const handleClearFilters = useCallback(() => {
    setAuthor("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    onFilter({});
  }, [onFilter]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    const sortMap: Record<SortOption, 'createdAt' | 'publishedAt' | 'journal' | 'relevance' | 'citations'> = {
      relevance: 'relevance',
      date: 'publishedAt',
      citations: 'citations',
    };
    onSort(sortMap[newSort]);
  }, [onSort]);

  const hasActiveFilters =
    author || startDate || endDate || category;

  const sortLabels: Record<SortOption, string> = {
    relevance: '関連性',
    date: '日付',
    citations: '引用数',
  };

  // Sync local sortBy state with currentSort prop
  const displaySort = currentSort;

  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="論文を検索（タイトル、著者、要旨）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            検索
          </Button>
        </div>

        {/* Filter Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 ${hasActiveFilters ? "bg-indigo-50 border-indigo-300" : ""}`}
            >
              <Filter className="h-4 w-4" />
              フィルタ
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {[author, startDate, endDate, category].filter(Boolean)
                    .length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  著者名
                </label>
                <Input
                  placeholder="著者名で検索..."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  公開日範囲
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  カテゴリ
                </label>
                <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleApplyFilters}
                  disabled={isLoading}
                  className="flex-1"
                >
                  適用
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    クリア
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {author && (
            <Badge variant="secondary" className="gap-1">
              著者: {author}
              <button
                onClick={() => setAuthor("")}
                className="ml-1 hover:text-slate-700"
              >
                ×
              </button>
            </Badge>
          )}
          {startDate && (
            <Badge variant="secondary" className="gap-1">
              開始: {new Date(startDate).toLocaleDateString("ja-JP")}
              <button
                onClick={() => setStartDate("")}
                className="ml-1 hover:text-slate-700"
              >
                ×
              </button>
            </Badge>
          )}
          {endDate && (
            <Badge variant="secondary" className="gap-1">
              終了: {new Date(endDate).toLocaleDateString("ja-JP")}
              <button
                onClick={() => setEndDate("")}
                className="ml-1 hover:text-slate-700"
              >
                ×
              </button>
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() => setCategory("")}
                className="ml-1 hover:text-slate-700"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4" />
          ソート:
        </span>
          <div className="flex gap-1">
            {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
              <Button
                key={sort}
                variant={displaySort === sort ? "default" : "outline"}
                size="sm"
                onClick={() => handleSortChange(sort)}
                disabled={isLoading}
              >
                {sortLabels[sort]}
              </Button>
            ))}
          </div>
      </div>
    </div>
  );
}
