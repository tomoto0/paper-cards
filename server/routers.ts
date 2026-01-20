import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
  updatePaperTranslation
} from "./db";
import { invokeLLM } from "./_core/llm";

// arXiv API helper
async function fetchPapersFromArxiv(keyword: string, maxResults: number = 10): Promise<any[]> {
  const query = encodeURIComponent(keyword);
  const url = `http://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
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
    
    return papers;
  } catch (error) {
    console.error('[arXiv] Failed to fetch papers:', error);
    return [];
  }
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
      .input(z.object({ sortBy: z.enum(['createdAt', 'publishedAt', 'journal']).optional() }).optional())
      .query(async ({ input }) => {
        return await getAllPapers(input?.sortBy || 'createdAt');
      }),
    
    fetch: publicProcedure.mutation(async () => {
      const activeKeywords = await getActiveKeywords();
      if (activeKeywords.length === 0) {
        return { success: false, message: 'No active keywords', count: 0 };
      }
      
      let totalAdded = 0;
      
      for (const kw of activeKeywords) {
        const arxivPapers = await fetchPapersFromArxiv(kw.keyword, 10);
        
        for (const paper of arxivPapers) {
          // Check if already exists
          const existing = await getPaperByArxivId(paper.arxivId);
          if (existing) continue;
          
          // Translate using LLM
          const { titleJa, abstractJa } = await translateToJapanese(paper.title, paper.abstract);
          
          // Add to database
          const added = await addPaper({
            ...paper,
            titleJa,
            abstractJa,
          });
          
          if (added) totalAdded++;
        }
      }
      
      return { success: true, message: `${totalAdded}件の新しい論文を保存しました`, count: totalAdded };
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
        const { titleJa, abstractJa } = await translateToJapanese(paper.title, paper.abstract);
        if (titleJa || abstractJa) {
          await updatePaperTranslation(paper.arxivId, titleJa, abstractJa);
          translated++;
        }
      }
      
      return { success: true, message: `${translated}件の論文を翻訳しました`, count: translated };
    }),
  }),
});

export type AppRouter = typeof appRouter;
