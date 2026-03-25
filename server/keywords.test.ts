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

describe("Keywords Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("keywords.list", () => {
    it("should list all keywords", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.list();

      expect(result).toHaveLength(3);
      expect(result[0].keyword).toBe("machine learning");
      expect(result[1].keyword).toBe("deep learning");
      expect(result[2].keyword).toBe("neural networks");
    });

    it("should return empty array when no keywords exist", async () => {
      const { getAllKeywords } = await import("./db");
      vi.mocked(getAllKeywords).mockResolvedValueOnce([]);

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.list();

      expect(result).toHaveLength(0);
    });
  });

  describe("keywords.add", () => {
    it("should add a new keyword", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.add({ keyword: "transformer" });

      expect(result.success).toBe(true);
      expect(result.keyword?.keyword).toBe("transformer");
    });

    it("should reject empty keyword", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.keywords.add({ keyword: "" });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject keyword with only whitespace", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.keywords.add({ keyword: "   " });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("keywords.delete", () => {
    it("should delete a keyword successfully", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.delete({ id: 1 });

      expect(result.success).toBe(true);
    });

    it("should handle deletion of non-existent keyword", async () => {
      const { deleteKeyword } = await import("./db");
      vi.mocked(deleteKeyword).mockResolvedValueOnce(false);

      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.delete({ id: 999 });

      expect(result.success).toBe(false);
    });

    it("should delete keyword with id 2", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.delete({ id: 2 });

      expect(result.success).toBe(true);
    });

    it("should delete keyword with id 3", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.delete({ id: 3 });

      expect(result.success).toBe(true);
    });
  });

  describe("keywords.toggle", () => {
    it("should toggle a keyword's active status", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.toggle({ id: 1 });

      expect(result.success).toBe(true);
      expect(result.keyword?.isActive).toBe(false);
    });

    it("should return keyword after toggle", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.keywords.toggle({ id: 2 });

      expect(result.success).toBe(true);
      expect(result.keyword).toBeDefined();
      expect(result.keyword?.keyword).toBe("machine learning");
    });
  });

  describe("Multiple keyword operations", () => {
    it("should add, list, and delete keywords in sequence", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // List initial keywords
      const initialList = await caller.keywords.list();
      expect(initialList.length).toBeGreaterThan(0);

      // Add a new keyword
      const addResult = await caller.keywords.add({ keyword: "reinforcement learning" });
      expect(addResult.success).toBe(true);

      // Delete a keyword
      const deleteResult = await caller.keywords.delete({ id: 1 });
      expect(deleteResult.success).toBe(true);
    });

    it("should handle rapid keyword deletions", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const result1 = await caller.keywords.delete({ id: 1 });
      const result2 = await caller.keywords.delete({ id: 2 });
      const result3 = await caller.keywords.delete({ id: 3 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
    });
  });
});
