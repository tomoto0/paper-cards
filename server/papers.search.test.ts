import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { searchPapers, getCategories, addPaper, getAllPapers } from "./db";

describe("Papers Search & Filtering", () => {
  const testPapers = [
    {
      arxivId: "test-2401-001",
      title: "Machine Learning Fundamentals",
      titleJa: "機械学習の基礎",
      abstract: "An introduction to machine learning concepts and algorithms",
      abstractJa: "機械学習の概念とアルゴリズムの紹介",
      authors: "John Smith, Jane Doe",
      publishedAt: new Date("2024-01-15").getTime(),
      journal: "cs.LG",
      arxivUrl: "https://arxiv.org/abs/2401.001",
      pdfUrl: "https://arxiv.org/pdf/2401.001.pdf",
      keyword: "machine learning",
    },
    {
      arxivId: "test-2401-002",
      title: "Deep Learning Applications",
      titleJa: "深層学習の応用",
      abstract: "Practical applications of deep learning in computer vision",
      abstractJa: "コンピュータビジョンにおける深層学習の実用的応用",
      authors: "Alice Johnson, Bob Wilson",
      publishedAt: new Date("2024-02-10").getTime(),
      journal: "cs.CV",
      arxivUrl: "https://arxiv.org/abs/2401.002",
      pdfUrl: "https://arxiv.org/pdf/2401.002.pdf",
      keyword: "deep learning",
    },
    {
      arxivId: "test-2401-003",
      title: "Natural Language Processing",
      titleJa: "自然言語処理",
      abstract: "Recent advances in NLP using transformer models",
      abstractJa: "トランスフォーマーモデルを使用したNLPの最近の進歩",
      authors: "John Smith, Carol Davis",
      publishedAt: new Date("2024-03-05").getTime(),
      journal: "cs.CL",
      arxivUrl: "https://arxiv.org/abs/2401.003",
      pdfUrl: "https://arxiv.org/pdf/2401.003.pdf",
      keyword: "nlp",
    },
  ];

  beforeAll(async () => {
    // Add test papers to database
    for (const paper of testPapers) {
      await addPaper(paper);
    }
  });

  it("should search papers by title", async () => {
    const results = await searchPapers("Machine");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.title.toLowerCase().includes("machine"))).toBe(true);
  });

  it("should search papers by Japanese title", async () => {
    const results = await searchPapers("機械学習");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.titleJa?.includes("機械学習"))).toBe(true);
  });

  it("should search papers by author", async () => {
    const results = await searchPapers("John Smith");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.authors.includes("John Smith"))).toBe(true);
  });

  it("should filter papers by author", async () => {
    const results = await searchPapers(undefined, {
      author: "Alice Johnson",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(p => p.authors.includes("Alice Johnson"))).toBe(true);
  });

  it("should filter papers by date range", async () => {
    const startDate = new Date("2024-02-01").getTime();
    const endDate = new Date("2024-02-28").getTime();
    const results = await searchPapers(undefined, {
      startDate,
      endDate,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        p => (p.publishedAt || 0) >= startDate && (p.publishedAt || 0) <= endDate
      )
    ).toBe(true);
  });

  it("should filter papers by category", async () => {
    const results = await searchPapers(undefined, {
      category: "cs.LG",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(p => p.journal === "cs.LG")).toBe(true);
  });

  it("should combine multiple filters", async () => {
    const results = await searchPapers(undefined, {
      author: "John Smith",
      category: "cs.LG",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        p =>
          p.authors.includes("John Smith") &&
          p.journal === "cs.LG"
      )
    ).toBe(true);
  });

  it("should get unique categories", async () => {
    const categories = await getCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toContain("cs.LG");
    expect(categories).toContain("cs.CV");
    expect(categories).toContain("cs.CL");
  });

  it("should handle empty search results", async () => {
    const results = await searchPapers("nonexistent-paper-title-xyz");
    expect(results).toEqual([]);
  });

  it("should sort results by creation date", async () => {
    const results = await searchPapers(undefined, undefined, "createdAt");
    expect(results.length).toBeGreaterThan(0);
    // Results should be in descending order of creation date
    for (let i = 0; i < results.length - 1; i++) {
      expect((results[i].createdAt || 0) >= (results[i + 1].createdAt || 0)).toBe(true);
    }
  });

  it("should sort results by published date", async () => {
    const results = await searchPapers(undefined, undefined, "publishedAt");
    expect(results.length).toBeGreaterThan(0);
    // Results should be in descending order of published date
    for (let i = 0; i < results.length - 1; i++) {
      expect((results[i].publishedAt || 0) >= (results[i + 1].publishedAt || 0)).toBe(true);
    }
  });
});
