import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, keywords, papers, Keyword, InsertKeyword, Paper, InsertPaper, favorites, Favorite, InsertFavorite } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User functions
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Keyword functions
export async function getAllKeywords(): Promise<Keyword[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(keywords).orderBy(desc(keywords.createdAt));
}

export async function getActiveKeywords(): Promise<Keyword[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(keywords).where(eq(keywords.isActive, true));
}

export async function addKeyword(keyword: string): Promise<Keyword | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    await db.insert(keywords).values({ keyword: keyword.trim() });
    const result = await db.select().from(keywords).where(eq(keywords.keyword, keyword.trim())).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to add keyword:", error);
    return null;
  }
}

export async function deleteKeyword(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(keywords).where(eq(keywords.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete keyword:", error);
    return false;
  }
}

export async function toggleKeyword(id: number): Promise<Keyword | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const existing = await db.select().from(keywords).where(eq(keywords.id, id)).limit(1);
    if (!existing[0]) return null;
    
    await db.update(keywords).set({ isActive: !existing[0].isActive }).where(eq(keywords.id, id));
    const result = await db.select().from(keywords).where(eq(keywords.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to toggle keyword:", error);
    return null;
  }
}

// Paper functions
export async function getAllPapers(sortBy: 'createdAt' | 'publishedAt' | 'journal' = 'createdAt'): Promise<Paper[]> {
  const db = await getDb();
  if (!db) return [];
  
  let orderByClause;
  switch (sortBy) {
    case 'publishedAt':
      orderByClause = desc(papers.publishedAt);
      break;
    case 'journal':
      orderByClause = asc(papers.journal);
      break;
    default:
      orderByClause = desc(papers.createdAt);
  }
  
  return await db.select().from(papers).orderBy(orderByClause);
}

export async function getPaperByArxivId(arxivId: string): Promise<Paper | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1);
  return result[0] || null;
}

export async function getPaperById(id: number): Promise<Paper | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(papers).where(eq(papers.id, id)).limit(1);
  return result[0] || null;
}

export async function addPaper(paper: InsertPaper): Promise<Paper | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Check for duplicate
    const existing = await getPaperByArxivId(paper.arxivId);
    if (existing) {
      console.log(`[Database] Paper ${paper.arxivId} already exists, skipping`);
      return null;
    }
    
    await db.insert(papers).values(paper);
    return await getPaperByArxivId(paper.arxivId);
  } catch (error) {
    console.error("[Database] Failed to add paper:", error);
    return null;
  }
}

export async function updatePaperTranslation(arxivId: string, titleJa: string, abstractJa: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.update(papers).set({ titleJa, abstractJa }).where(eq(papers.arxivId, arxivId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update paper translation:", error);
    return false;
  }
}

export async function deletePaper(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(papers).where(eq(papers.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete paper:", error);
    return false;
  }
}

// Calculate relevance score for search results
function calculateRelevanceScore(paper: Paper, query: string): number {
  if (!query) return 0;
  
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  const titleJa = (paper.titleJa || '').toLowerCase();
  const titleEn = paper.title.toLowerCase();
  if (titleJa.includes(queryLower)) score += 100;
  if (titleEn.includes(queryLower)) score += 100;
  
  // Abstract match (medium weight)
  const abstractJa = (paper.abstractJa || '').toLowerCase();
  const abstractEn = paper.abstract.toLowerCase();
  const titleMatches = (titleJa.match(new RegExp(queryLower, 'g')) || []).length;
  const abstractMatches = (abstractJa.match(new RegExp(queryLower, 'g')) || []).length +
                          (abstractEn.match(new RegExp(queryLower, 'g')) || []).length;
  score += titleMatches * 50;
  score += abstractMatches * 10;
  
  // Author match (low weight)
  if (paper.authors.toLowerCase().includes(queryLower)) score += 30;
  
  return score;
}

// Search and filter papers
export async function searchPapers(
  query?: string,
  filters?: {
    author?: string;
    startDate?: number; // Unix timestamp
    endDate?: number; // Unix timestamp
    category?: string;
  },
  sortBy: 'createdAt' | 'publishedAt' | 'journal' | 'relevance' | 'citations' = 'createdAt'
): Promise<Paper[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    // For relevance and citations sorting, we'll sort manually
    const initialSortBy = (sortBy === 'relevance' || sortBy === 'citations') ? 'createdAt' : sortBy;
    let allPapers = await getAllPapers(initialSortBy as 'createdAt' | 'publishedAt' | 'journal');
    
    // Filter by search query (title, abstract, authors)
    if (query && query.trim()) {
      const searchLower = query.toLowerCase();
      allPapers = allPapers.filter(paper => {
        const titleMatch = (paper.titleJa || paper.title).toLowerCase().includes(searchLower);
        const abstractMatch = (paper.abstractJa || paper.abstract).toLowerCase().includes(searchLower);
        const authorsMatch = paper.authors.toLowerCase().includes(searchLower);
        return titleMatch || abstractMatch || authorsMatch;
      });
    }
    
    // Filter by author
    if (filters?.author && filters.author.trim()) {
      const authorLower = filters.author.toLowerCase();
      allPapers = allPapers.filter(paper => 
        paper.authors.toLowerCase().includes(authorLower)
      );
    }
    
    // Filter by date range
    if (filters?.startDate) {
      allPapers = allPapers.filter(paper => (paper.publishedAt || 0) >= filters.startDate!);
    }
    if (filters?.endDate) {
      allPapers = allPapers.filter(paper => (paper.publishedAt || 0) <= filters.endDate!);
    }
    
    // Filter by category
    if (filters?.category && filters.category.trim()) {
      allPapers = allPapers.filter(paper => 
        (paper.journal || '').toLowerCase() === filters.category!.toLowerCase()
      );
    }
    
    // Sort results (manual sorting for relevance and citations)
    if (sortBy === 'relevance' && query) {
      // Sort by relevance score
      allPapers.sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, query);
        const scoreB = calculateRelevanceScore(b, query);
        return scoreB - scoreA; // Descending order
      });
    } else if (sortBy === 'citations') {
      // Sort by citation count (descending)
      allPapers.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
    } else if (sortBy === 'publishedAt') {
      // Sort by published date (descending)
      allPapers.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
    } else if (sortBy === 'journal') {
      // Sort by journal (ascending)
      allPapers.sort((a, b) => (a.journal || '').localeCompare(b.journal || ''));
    } else {
      // Sort by creation date (descending)
      allPapers.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }
    
    return allPapers;
  } catch (error) {
    console.error('[Database] Failed to search papers:', error);
    return [];
  }
}

// Get unique categories from all papers
export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const allPapers = await getAllPapers();
    const categories = Array.from(new Set(allPapers.map(p => p.journal || '').filter(c => c)));
    return categories.sort();
  } catch (error) {
    console.error('[Database] Failed to get categories:', error);
    return [];
  }
}

// Find related papers based on keywords and title similarity
export async function findRelatedPapers(paperId: number, limit: number = 5): Promise<Paper[]> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot find related papers: database not available');
    return [];
  }
  
  if (!paperId || paperId <= 0) {
    console.warn('[Database] Invalid paperId for finding related papers:', paperId);
    return [];
  }
  
  try {
    // Get the current paper
    const currentPaper = await getPaperById(paperId);
    if (!currentPaper) {
      console.warn('[Database] Paper not found:', paperId);
      return [];
    }
    
    // Extract keywords from title and abstract
    const titleWords = (currentPaper.titleJa || currentPaper.title)
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3); // Only words longer than 3 chars
    
    // Get all papers
    const allPapers = await getAllPapers();
    
    // Score papers based on keyword matches
    const scoredPapers = allPapers
      .filter(p => p.id !== paperId) // Exclude current paper
      .map(paper => {
        let score = 0;
        
        // Check keyword match
        if (currentPaper.keyword && paper.keyword === currentPaper.keyword) {
          score += 10;
        }
        
        // Check title word matches
        const paperTitleWords = (paper.titleJa || paper.title)
          .toLowerCase()
          .split(/\s+/);
        titleWords.forEach(word => {
          if (paperTitleWords.some(tw => tw.includes(word) || word.includes(tw))) {
            score += 2;
          }
        });
        
        // Check author matches
        const currentAuthors = currentPaper.authors.split(',').map(a => a.trim().toLowerCase());
        const paperAuthors = paper.authors.split(',').map(a => a.trim().toLowerCase());
        const commonAuthors = currentAuthors.filter(a => paperAuthors.some(pa => pa.includes(a)));
        score += commonAuthors.length * 5;
        
        return { paper, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.paper);
    
    return scoredPapers;
  } catch (error) {
    console.error("[Database] Failed to find related papers:", error);
    return [];
  }
}


// Favorites functions
export async function addFavorite(userId: number, paperId: number): Promise<Favorite | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add favorite: database not available");
    return null;
  }

  try {
    // Check if favorite already exists
    const existing = await db
      .select()
      .from(favorites)
      .where(sql`${favorites.userId} = ${userId} AND ${favorites.paperId} = ${paperId}`)
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Insert new favorite
    const result = await db
      .insert(favorites)
      .values({
        userId,
        paperId,
      });

    // Fetch and return the inserted favorite
    const inserted = await db
      .select()
      .from(favorites)
      .where(sql`${favorites.userId} = ${userId} AND ${favorites.paperId} = ${paperId}`)
      .limit(1);

    return inserted[0] || null;
  } catch (error) {
    console.error("[Database] Failed to add favorite:", error);
    return null;
  }
}

export async function removeFavorite(userId: number, paperId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove favorite: database not available");
    return false;
  }

  try {
    const result = await db
      .delete(favorites)
      .where(sql`${favorites.userId} = ${userId} AND ${favorites.paperId} = ${paperId}`);

    return true;
  } catch (error) {
    console.error("[Database] Failed to remove favorite:", error);
    return false;
  }
}

export async function getFavorites(userId: number): Promise<Paper[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get favorites: database not available");
    return [];
  }

  try {
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));

    if (userFavorites.length === 0) {
      return [];
    }

    const paperIds = userFavorites.map(f => f.paperId);
    const favoritePapers = await db
      .select()
      .from(papers)
      .where(sql`${papers.id} IN (${sql.join(paperIds)})`);

    return favoritePapers;
  } catch (error) {
    console.error("[Database] Failed to get favorites:", error);
    return [];
  }
}

export async function isFavorite(userId: number, paperId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check favorite: database not available");
    return false;
  }

  try {
    const result = await db
      .select()
      .from(favorites)
      .where(sql`${favorites.userId} = ${userId} AND ${favorites.paperId} = ${paperId}`)
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check favorite:", error);
    return false;
  }
}
