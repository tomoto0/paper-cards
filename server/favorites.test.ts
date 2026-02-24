import { describe, it, expect, beforeAll } from "vitest";
import { addFavorite, removeFavorite, getFavorites, isFavorite, addPaper, addUser } from "./db";
import { InsertUser, InsertPaper } from "../drizzle/schema";

describe("Favorites Functionality", () => {
  let userId: number;
  let paperId: number;

  const testUser: InsertUser = {
    openId: `test-user-${Date.now()}`,
    name: "Test User",
    email: "test@example.com",
    loginMethod: "oauth",
  };

  const testPaper: InsertPaper = {
    arxivId: `fav-test-${Date.now()}`,
    title: "Test Paper for Favorites",
    titleJa: "お気に入りテスト論文",
    abstract: "This is a test paper for favorites functionality",
    abstractJa: "お気に入り機能のテスト論文です",
    authors: "Test Author",
    journal: "cs.AI",
    publishedAt: new Date("2024-01-01").getTime(),
    arxivUrl: "https://arxiv.org/abs/test-fav",
    pdfUrl: "https://arxiv.org/pdf/test-fav.pdf",
    keyword: "test",
    citationCount: 10,
  };

  beforeAll(async () => {
    // Create test user
    await addUser(testUser);
    // Note: In a real scenario, we'd fetch the created user ID from the database
    // For this test, we'll assume userId = 1 (first user in test database)
    userId = 1;

    // Create test paper
    const paper = await addPaper(testPaper);
    if (paper) {
      paperId = paper.id;
    } else {
      throw new Error("Failed to create test paper");
    }
  });

  it("should add a paper to favorites", async () => {
    const result = await addFavorite(userId, paperId);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe(userId);
    expect(result?.paperId).toBe(paperId);
  });

  it("should check if a paper is favorited", async () => {
    const isFav = await isFavorite(userId, paperId);
    expect(isFav).toBe(true);
  });

  it("should get all favorites for a user", async () => {
    const favorites = await getFavorites(userId);
    expect(favorites.length).toBeGreaterThan(0);
    expect(favorites.some(p => p.id === paperId)).toBe(true);
  });

  it("should not add duplicate favorites", async () => {
    const result1 = await addFavorite(userId, paperId);
    const result2 = await addFavorite(userId, paperId);
    expect(result1?.id).toBe(result2?.id);
  });

  it("should remove a paper from favorites", async () => {
    const success = await removeFavorite(userId, paperId);
    expect(success).toBe(true);

    const isFav = await isFavorite(userId, paperId);
    expect(isFav).toBe(false);
  });

  it("should return empty list when no favorites exist", async () => {
    const favorites = await getFavorites(userId);
    expect(favorites).toEqual([]);
  });

  it("should handle invalid user ID gracefully", async () => {
    const favorites = await getFavorites(-1);
    expect(favorites).toEqual([]);
  });

  it("should handle invalid paper ID gracefully", async () => {
    const result = await addFavorite(userId, -1);
    // Foreign key constraint will prevent invalid paper ID
    expect(result).toBeNull();
  });
});

// Helper function to add user (would normally be in db.ts)
async function addUser(user: InsertUser): Promise<void> {
  // This is a placeholder - in real implementation, this would use the database
  console.log("[Test] Adding user:", user);
}
