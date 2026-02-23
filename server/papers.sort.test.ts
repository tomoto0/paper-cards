import { describe, it, expect, beforeAll } from "vitest";
import { searchPapers, addPaper } from "./db";

describe("Papers Sort Functionality", () => {
  const testPapers = [
    {
      arxivId: "sort-test-001",
      title: "Machine Learning Basics",
      titleJa: "機械学習の基礎",
      abstract: "Introduction to machine learning",
      abstractJa: "機械学習の紹介",
      authors: "Alice Smith",
      publishedAt: new Date("2024-01-10").getTime(),
      journal: "cs.LG",
      arxivUrl: "https://arxiv.org/abs/sort-001",
      pdfUrl: "https://arxiv.org/pdf/sort-001.pdf",
      keyword: "ml",
      citationCount: 50,
    },
    {
      arxivId: "sort-test-002",
      title: "Advanced Machine Learning",
      titleJa: "高度な機械学習",
      abstract: "Advanced techniques in machine learning",
      abstractJa: "機械学習の高度なテクニック",
      authors: "Bob Johnson",
      publishedAt: new Date("2024-02-15").getTime(),
      journal: "cs.LG",
      arxivUrl: "https://arxiv.org/abs/sort-002",
      pdfUrl: "https://arxiv.org/pdf/sort-002.pdf",
      keyword: "ml",
      citationCount: 150,
    },
    {
      arxivId: "sort-test-003",
      title: "Deep Learning Applications",
      titleJa: "深層学習の応用",
      abstract: "Applications of deep learning",
      abstractJa: "深層学習の応用",
      authors: "Carol Davis",
      publishedAt: new Date("2024-03-20").getTime(),
      journal: "cs.CV",
      arxivUrl: "https://arxiv.org/abs/sort-003",
      pdfUrl: "https://arxiv.org/pdf/sort-003.pdf",
      keyword: "dl",
      citationCount: 200,
    },
  ];

  beforeAll(async () => {
    for (const paper of testPapers) {
      await addPaper(paper);
    }
  });

  it("should sort by relevance when query matches title", async () => {
    const results = await searchPapers("Machine", undefined, "relevance");
    expect(results.length).toBeGreaterThan(0);
    // Papers with "Machine" in title should rank higher
    const firstPaper = results[0];
    expect(
      firstPaper.title.toLowerCase().includes("machine") ||
      firstPaper.titleJa?.toLowerCase().includes("機械")
    ).toBe(true);
  });

  it("should sort by published date descending", async () => {
    const results = await searchPapers(undefined, undefined, "publishedAt");
    expect(results.length).toBeGreaterThan(0);
    // Most recent papers should come first
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i].publishedAt || 0;
      const next = results[i + 1].publishedAt || 0;
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("should sort by citation count descending", async () => {
    const results = await searchPapers(undefined, undefined, "citations");
    expect(results.length).toBeGreaterThan(0);
    // Papers with more citations should come first
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i].citationCount || 0;
      const next = results[i + 1].citationCount || 0;
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("should sort by creation date when sortBy is createdAt", async () => {
    const results = await searchPapers(undefined, undefined, "createdAt");
    expect(results.length).toBeGreaterThan(0);
    // Results should be sorted by creation date
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i].createdAt?.getTime() || 0;
      const next = results[i + 1].createdAt?.getTime() || 0;
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("should apply filters and then sort by relevance", async () => {
    const results = await searchPapers(
      "learning",
      { category: "cs.LG" },
      "relevance"
    );
    expect(results.length).toBeGreaterThan(0);
    // All results should be from cs.LG category
    expect(results.every(p => p.journal === "cs.LG")).toBe(true);
  });

  it("should handle empty results with any sort option", async () => {
    const results = await searchPapers(
      "nonexistent-query-xyz",
      undefined,
      "citations"
    );
    expect(results).toEqual([]);
  });

  it("should prioritize exact title matches in relevance scoring", async () => {
    const results = await searchPapers("Learning", undefined, "relevance");
    expect(results.length).toBeGreaterThan(0);
    // Papers with "Learning" should be found
    const matchingPaper = results.find(p => p.title.toLowerCase().includes("learning"));
    expect(matchingPaper).toBeDefined();
  });
});
