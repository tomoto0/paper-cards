import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllKeywords, 
  addKeyword, 
  deleteKeyword, 
  toggleKeyword,
  getAllPapers,
  addPaper,
  deletePaper,
  getActiveKeywords,
  getPaperByArxivId,
  getPaperById,
  updatePaperTranslation,
  findRelatedPapers,
  searchPapers,
  getCategories,
  addFavorite,
  removeFavorite,
  getFavorites,
  isFavorite
} from "./db";
import { invokeLLM } from "./_core/llm";

// arXiv API helper with timeout and retry logic
async function fetchPapersFromArxiv(keyword: string, maxResults: number = 10): Promise<any[]> {
  const query = encodeURIComponent(keyword);
  const url = `https://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
  
  const maxRetries = 3;
  const timeout = 15000; // 15 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[arXiv] Fetching papers for "${keyword}" (attempt ${attempt}/${maxRetries})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Paper-Catcher/1.0 (academic research tool)'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Check HTTP status
      if (!response.ok) {
        console.error(`[arXiv] HTTP ${response.status}: ${response.statusText}`);
        if (response.status === 429 || response.status === 503) {
          // Rate limited or service unavailable - wait and retry
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`[arXiv] Rate limited/unavailable. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      // Check if response is valid XML
      if (!text.includes('<?xml') && !text.includes('<feed')) {
        console.error('[arXiv] Invalid response format - not XML');
        throw new Error('Invalid arXiv API response format');
      }
      
      // Parse XML response
      const papers: any[] = [];
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;
      
      while ((match = entryRegex.exec(text)) !== null) {
        const entry = match[1];
        
        const getId = (str: string) => {
          const m = str.match(/<id>([\s\S]*?)<\/id>/);
          return m ? m[1].trim() : '';
        };
        const getTitle = (str: string) => {
          const m = str.match(/<title>([\s\S]*?)<\/title>/);
          return m ? m[1].replace(/\s+/g, ' ').trim() : '';
        };
        const getSummary = (str: string) => {
          const m = str.match(/<summary>([\s\S]*?)<\/summary>/);
          return m ? m[1].replace(/\s+/g, ' ').trim() : '';
        };
        const getPublished = (str: string) => {
          const m = str.match(/<published>([\s\S]*?)<\/published>/);
          return m ? m[1].trim() : '';
        };
        const getAuthors = (str: string) => {
          const authors: string[] = [];
          const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
          let am;
          while ((am = authorRegex.exec(str)) !== null) {
            authors.push(am[1].trim());
          }
          return authors.join(', ');
        };
        const getCategory = (str: string) => {
          const m = str.match(/<arxiv:primary_category[^>]*term="([^"]+)"/);
          return m ? m[1] : 'arXiv';
        };
        
        const idUrl = getId(entry);
        const arxivId = idUrl.split('/abs/')[1]?.split('v')[0] || idUrl.split('/').pop()?.split('v')[0] || '';
        
        if (arxivId) {
          papers.push({
            arxivId,
            title: getTitle(entry),
            authors: getAuthors(entry),
            abstract: getSummary(entry),
            publishedAt: new Date(getPublished(entry)).getTime(),
            arxivUrl: idUrl.replace('http://', 'https://'),
            pdfUrl: idUrl.replace('/abs/', '/pdf/').replace('http://', 'https://') + '.pdf',
            journal: getCategory(entry),
            keyword,
          });
        }
      }
      
      console.log(`[arXiv] Successfully fetched ${papers.length} papers for "${keyword}"`);
      return papers;
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn(`[arXiv] Request timeout for "${keyword}" (attempt ${attempt}/${maxRetries})`);
        } else {
          console.error(`[arXiv] Error on attempt ${attempt}/${maxRetries}:`, error.message);
        }
      }
      
      // If last attempt, give up
      if (attempt === maxRetries) {
        console.error(`[arXiv] Failed to fetch papers after ${maxRetries} attempts`);
        return [];
      }
      
      // Wait before retry with exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[arXiv] Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return [];
}

// LLM translation helper
async function translateToJapanese(title: string, abstract: string): Promise<{ titleJa: string; abstractJa: string }> {
  console.log('[LLM] Starting translation for:', title.substring(0, 50) + '...');
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "あなたは学術論文の翻訳者です。与えられた英語の論文タイトルと要旨を、学術的で正確な日本語に翻訳してください。専門用語は適切に訳し、文体は学術論文にふさわしいものにしてください。JSON形式で回答してください。"
        },
        {
          role: "user",
          content: `以下の論文タイトルと要旨を日本語に翻訳してください。

タイトル: ${title}

要旨: ${abstract}

JSON形式で回答してください:
{
  "titleJa": "日本語タイトル",
  "abstractJa": "日本語要旨"
}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              titleJa: { type: "string", description: "日本語タイトル" },
              abstractJa: { type: "string", description: "日本語要旨" }
            },
            required: ["titleJa", "abstractJa"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    const contentStr = typeof content === 'string' ? content : '';
    console.log('[LLM] Response content:', contentStr.substring(0, 100) + '...');
    if (content && typeof content === 'string') {
      const parsed = JSON.parse(content);
      console.log('[LLM] Translation successful:', parsed.titleJa?.substring(0, 50) + '...');
      return parsed;
    }
    console.warn('[LLM] No content in response');
  } catch (error) {
    console.error('[LLM] Translation failed:', error);
  }
  
  return { titleJa: '', abstractJa: '' };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  keywords: router({
    list: publicProcedure.query(async () => {
      return await getAllKeywords();
    }),
    
    add: publicProcedure
      .input(z.object({ keyword: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const result = await addKeyword(input.keyword);
        return { success: !!result, keyword: result };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await deleteKeyword(input.id);
        return { success };
      }),
    
    toggle: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const result = await toggleKeyword(input.id);
        return { success: !!result, keyword: result };
      }),
  }),

  papers: router({
    list: publicProcedure
      .input(z.object({ sortBy: z.enum(['createdAt', 'publishedAt', 'journal', 'relevance', 'citations']).optional() }).optional())
      .query(async ({ input }) => {
        const sortBy = input?.sortBy || 'createdAt';
        const baseSortBy = (sortBy === 'relevance' || sortBy === 'citations') ? 'createdAt' : sortBy;
        return await getAllPapers(baseSortBy as 'createdAt' | 'publishedAt' | 'journal');
      }),
    
    related: publicProcedure
      .input(z.object({ paperId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        if (!input.paperId || input.paperId <= 0) {
          return [];
        }
        try {
          return await findRelatedPapers(input.paperId, input.limit || 5);
        } catch (error) {
          console.error('[tRPC] Error fetching related papers:', error);
          return [];
        }
      }),
    
    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        author: z.string().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        category: z.string().optional(),
        sortBy: z.enum(['createdAt', 'publishedAt', 'journal', 'relevance', 'citations']).optional()
      }))
      .query(async ({ input }) => {
        try {
          return await searchPapers(
            input.query,
            {
              author: input.author,
              startDate: input.startDate,
              endDate: input.endDate,
              category: input.category
            },
            input.sortBy || 'createdAt'
          );
        } catch (error) {
          console.error('[tRPC] Error searching papers:', error);
          return [];
        }
      }),
    
    categories: publicProcedure.query(async () => {
      try {
        return await getCategories();
      } catch (error) {
        console.error('[tRPC] Error fetching categories:', error);
        return [];
      }
    }),
    
    fetch: publicProcedure.mutation(async () => {
      const activeKeywords = await getActiveKeywords();
      if (activeKeywords.length === 0) {
        return { success: false, message: 'No active keywords', count: 0 };
      }
      
      let totalAdded = 0;
      const errors: string[] = [];
      
      for (const kw of activeKeywords) {
        try {
          const arxivPapers = await fetchPapersFromArxiv(kw.keyword, 10);
          
          for (const paper of arxivPapers) {
            try {
              // Check if already exists
              const existing = await getPaperByArxivId(paper.arxivId);
              if (existing) continue;
              
              // Translate using LLM (non-blocking - continue even if translation fails)
              let titleJa = '';
              let abstractJa = '';
              try {
                const translation = await translateToJapanese(paper.title, paper.abstract);
                titleJa = translation.titleJa || '';
                abstractJa = translation.abstractJa || '';
              } catch (translationError) {
                console.warn('[Paper] Translation skipped for arxivId:', paper.arxivId);
                // Continue without translation
              }
              
              // Add to database
              const added = await addPaper({
                ...paper,
                titleJa,
                abstractJa,
              });
              
              if (added) totalAdded++;
            } catch (paperError) {
              console.error('[Paper] Failed to add paper:', paperError);
              errors.push(`Failed to add paper: ${paper.arxivId}`);
            }
          }
        } catch (keywordError) {
          console.error('[Keyword] Failed to fetch papers for keyword:', kw.keyword, keywordError);
          errors.push(`Failed to fetch papers for keyword: ${kw.keyword}`);
        }
      }
      
      const message = errors.length > 0 
        ? `${totalAdded}件の新しい論文を保存しました（${errors.length}件のエラー）`
        : `${totalAdded}件の新しい論文を保存しました`;
      
      return { success: true, message, count: totalAdded };
    }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await deletePaper(input.id);
        return { success };
      }),
    
    retranslate: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const paper = await getPaperById(input.id);
        if (!paper) {
          return { success: false, message: '論文が見つかりません' };
        }
        
        const { titleJa, abstractJa } = await translateToJapanese(paper.title, paper.abstract);
        
        if (titleJa || abstractJa) {
          await updatePaperTranslation(paper.arxivId, titleJa, abstractJa);
          return { success: true, message: '翻訳が完了しました' };
        }
        
        return { success: false, message: '翻訳に失敗しました' };
      }),
    
    retranslateAll: publicProcedure.mutation(async () => {
      const papers = await getAllPapers('createdAt');
      const untranslated = papers.filter(p => !p.titleJa || !p.abstractJa);
      
      let translated = 0;
      for (const paper of untranslated) {
        try {
          const { titleJa, abstractJa } = await translateToJapanese(paper.title, paper.abstract);
          if (titleJa || abstractJa) {
            await updatePaperTranslation(paper.arxivId, titleJa, abstractJa);
            translated++;
          }
        } catch (error) {
          console.error('[Retranslate] Failed for paper:', paper.arxivId, error);
        }
      }
      
      return { success: true, message: `${translated}件の論文を翻訳しました`, count: translated };
    }),
  }),

  favorites: router({
    add: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await addFavorite(ctx.user.id, input.paperId);
        return { success: !!result, favorite: result };
      }),
    
    remove: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const success = await removeFavorite(ctx.user.id, input.paperId);
        return { success };
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getFavorites(ctx.user.id);
    }),
    
    check: protectedProcedure
      .input(z.object({ paperId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await isFavorite(ctx.user.id, input.paperId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
