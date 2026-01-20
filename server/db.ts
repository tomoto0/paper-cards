import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, keywords, papers, Keyword, InsertKeyword, Paper, InsertPaper } from "../drizzle/schema";
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
