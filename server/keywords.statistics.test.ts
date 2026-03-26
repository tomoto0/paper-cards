import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getAllKeywords: vi.fn().mockResolvedValue([
    { id: 1, keyword: "machine learning", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, keyword: "deep learning", isActive: false, createdAt: new Date(), updatedAt: new Date() },
    { id: 3, keyword: "neural networks", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getActiveKeywords: vi.fn().mockResolvedValue([
    { id: 1, keyword: "machine learning", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 3, keyword: "neural networks", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  addKeyword: vi.fn().mockResolvedValue({ id: 4, keyword: "transformer", isActive: true, createdAt: new Date(), updatedAt: new Date() }),
  deleteKeyword: vi.fn().mockResolvedValue(true),
  toggleKeyword: vi.fn().mockResolvedValue({ id: 1, keyword: "machine learning", isActive: false, createdAt: new Date(), updatedAt: new Date() }),
  getAllPapers: vi.fn().mockResolvedValue([]),
  getPaperByArxivId: vi.fn().mockResolvedValue(null),
  addPaper: vi.fn().mockResolvedValue({ id: 1 }),
  deletePaper: vi.fn().mockResolvedValue(true),
  updatePaperTranslation: vi.fn().mockResolvedValue(true),
  findRelatedPapers: vi.fn().mockResolvedValue([]),
  searchPapers: vi.fn().mockResolvedValue([]),
  getCategories: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn().mockResolvedValue(true),
  removeFavorite: vi.fn().mockResolvedValue(true),
  getFavorites: vi.fn().mockResolvedValue([]),
  isFavorite: vi.fn().mockResolvedValue(false),
  getKeywordStatistics: vi.fn().mockResolvedValue([
    { keywordId: 1, keyword: "machine learning", count: 45, isActive: true },
    { keywordId: 3, keyword: "neural networks", count: 32, isActive: true },
    { keywordId: 2, keyword: "deep learning", count: 28, isActive: false },
  ]),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            titleJa: "テストタイトル",
            abstractJa: "テスト要旨",
          }),
        },
      },
    ],
  }),
}));

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Keyword Statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("keywords.statistics", () => {
    it("should return keyword statistics sorted by count", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();

      expect(result).toHaveLength(3);
      expect(result[0].keyword).toBe("machine learning");
      expect(result[0].count).toBe(45);
      expect(result[1].keyword).toBe("neural networks");
      expect(result[1].count).toBe(32);
      expect(result[2].keyword).toBe("deep learning");
      expect(result[2].count).toBe(28);
    });

    it("should include active status in statistics", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();

      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(true);
      expect(result[2].isActive).toBe(false);
    });

    it("should include keyword ID in statistics", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();

      expect(result[0].keywordId).toBe(1);
      expect(result[1].keywordId).toBe(3);
      expect(result[2].keywordId).toBe(2);
    });

    it("should return empty array when no statistics available", async () => {
      const { getKeywordStatistics } = await import("./db");
      vi.mocked(getKeywordStatistics).mockResolvedValueOnce([]);

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();

      expect(result).toHaveLength(0);
    });

    it("should calculate total papers correctly", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();
      const total = result.reduce((sum, stat) => sum + stat.count, 0);

      expect(total).toBe(105); // 45 + 32 + 28
    });

    it("should handle statistics with zero papers", async () => {
      const { getKeywordStatistics } = await import("./db");
      vi.mocked(getKeywordStatistics).mockResolvedValueOnce([
        { keywordId: 1, keyword: "test keyword", count: 0, isActive: true },
      ]);

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(0);
    });

    it("should maintain keyword order by count descending", async () => {
      const { getKeywordStatistics } = await import("./db");
      vi.mocked(getKeywordStatistics).mockResolvedValueOnce([
        { keywordId: 1, keyword: "first", count: 100, isActive: true },
        { keywordId: 2, keyword: "second", count: 50, isActive: true },
        { keywordId: 3, keyword: "third", count: 25, isActive: true },
        { keywordId: 4, keyword: "fourth", count: 10, isActive: true },
      ]);

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();

      expect(result[0].count).toBeGreaterThan(result[1].count);
      expect(result[1].count).toBeGreaterThan(result[2].count);
      expect(result[2].count).toBeGreaterThan(result[3].count);
    });

    it("should return statistics for both active and inactive keywords", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.statistics();
      const activeCount = result.filter(s => s.isActive).length;
      const inactiveCount = result.filter(s => !s.isActive).length;

      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);
    });
  });
});
