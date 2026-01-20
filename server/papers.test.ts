import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getAllKeywords: vi.fn().mockResolvedValue([
    { id: 1, keyword: "machine learning", isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, keyword: "deep learning", isActive: false, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getActiveKeywords: vi.fn().mockResolvedValue([
    { id: 1, keyword: "machine learning", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  addKeyword: vi.fn().mockResolvedValue({ id: 3, keyword: "neural networks", isActive: true }),
  deleteKeyword: vi.fn().mockResolvedValue(true),
  toggleKeyword: vi.fn().mockResolvedValue({ id: 1, keyword: "machine learning", isActive: false }),
  getAllPapers: vi.fn().mockResolvedValue([
    {
      id: 1,
      arxivId: "2401.00001",
      title: "Test Paper",
      titleJa: "テスト論文",
      authors: "Test Author",
      abstract: "Test abstract",
      abstractJa: "テスト要旨",
      journal: "cs.AI",
      publishedAt: Date.now(),
      arxivUrl: "https://arxiv.org/abs/2401.00001",
      pdfUrl: "https://arxiv.org/pdf/2401.00001.pdf",
      keyword: "machine learning",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getPaperByArxivId: vi.fn().mockResolvedValue(null),
  addPaper: vi.fn().mockResolvedValue({ id: 1 }),
  deletePaper: vi.fn().mockResolvedValue(true),
  updatePaperTranslation: vi.fn().mockResolvedValue(true),
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

describe("keywords router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all keywords", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.keywords.list();

    expect(result).toHaveLength(2);
    expect(result[0].keyword).toBe("machine learning");
  });

  it("adds a new keyword", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.keywords.add({ keyword: "neural networks" });

    expect(result.success).toBe(true);
    expect(result.keyword?.keyword).toBe("neural networks");
  });

  it("deletes a keyword", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.keywords.delete({ id: 1 });

    expect(result.success).toBe(true);
  });

  it("toggles a keyword", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.keywords.toggle({ id: 1 });

    expect(result.success).toBe(true);
    expect(result.keyword?.isActive).toBe(false);
  });
});

describe("papers router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists all papers", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.papers.list({});

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Paper");
    expect(result[0].titleJa).toBe("テスト論文");
  });

  it("lists papers with sort option", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.papers.list({ sortBy: "publishedAt" });

    expect(result).toHaveLength(1);
  });

  it("deletes a paper", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.papers.delete({ id: 1 });

    expect(result.success).toBe(true);
  });
});
