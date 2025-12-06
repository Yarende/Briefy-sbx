import { GoogleGenAI } from "@google/genai";
import { NewsItem, NewsSource, Topic } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Map user-provided feeds to domains for search grounding
const SOURCE_DOMAINS: Record<string, string[]> = {
  GENERAL: [
    'newyorker.com', 'ft.com', 'restofworld.org', 'theonion.com',
    'defector.com', 'atlasobscura.com', 'kottke.org', 'nautil.us', 'aeon.co'
  ],
  TECH: [
    'theregister.com', 'arstechnica.com', 'theverge.com', 'wired.com',
    'techcrunch.com', '404media.co', 'daringfireball.net', 'news.ycombinator.com',
    'infoq.com', 'highscalability.com', 'servethehome.com'
  ],
  GAMING: [
    'rockpapershotgun.com', 'eurogamer.net', 'pcgamer.com', 'polygon.com',
    'kotaku.com', 'gamingonlinux.com', 'warpdoor.com', 'indiegamesplus.com'
  ]
};

// Map App Topics to Source Categories
const getDomainsForTopic = (topic: string): string[] => {
  switch (topic) {
    case Topic.TECH:
      return SOURCE_DOMAINS.TECH;
    case Topic.GAMING:
      return SOURCE_DOMAINS.GAMING;
    case Topic.BUSINESS:
      return ['ft.com', 'bloomberg.com', 'techcrunch.com', 'newyorker.com'];
    case Topic.SCIENCE:
      return ['nautil.us', 'aeon.co', 'wired.com', 'arstechnica.com', 'atlasobscura.com', 'nature.com'];
    case Topic.ENTERTAINMENT:
      return [...SOURCE_DOMAINS.GENERAL, ...SOURCE_DOMAINS.GAMING, 'vulture.com', 'variety.com'];
    case Topic.HEADLINES:
    default:
      // Mix of high quality general and tech sources
      return [...SOURCE_DOMAINS.GENERAL, 'bbc.com', 'reuters.com', 'npr.org'];
  }
};

export const fetchNewsByTopic = async (topic: string, customSources: string[] = []): Promise<NewsItem[]> => {
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const dateStr = twoWeeksAgo.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const defaultDomains = getDomainsForTopic(topic);
  // Merge default domains with custom sources (clean URLs to domains)
  const cleanedCustomDomains = customSources.map(url => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  });

  const allTargetDomains = Array.from(new Set([...defaultDomains, ...cleanedCustomDomains]));
  const domainListString = allTargetDomains.join(', ');

  // Construct a focused system instruction
  // OPTIMIZATION: Reduced Briefing to Top 10 and Detailed Articles to Top 5 for faster generation
  const systemInstruction = `
You are a high-quality news aggregator app called Briefly.
Your goal is to provide a briefing on the latest events for the topic: "${topic}".

STRICT CONSTRAINTS:
1. TIME WINDOW: ONLY include news stories published AFTER ${dateStr}.
2. SORTING: Sort everything in REVERSE CHRONOLOGICAL ORDER (Newest first).
3. SOURCES: Prioritize preferred sources: ${domainListString}.
4. CITATIONS: Use [1], [2] notation for detailed articles.

RESPONSE STRUCTURE (Strictly follow this order):

PART 1: THE BRIEFING
Start with "## Briefing".
Provide a bulleted list of the top 10 headlines/stories for this topic.
Each bullet point must be a SINGLE line summarizing the story.
Do not include dates or citations in this list.

PART 2: DETAILED ARTICLES
Start with "## [Headline]" for the top 5 most important stories from the list above.
Format:
## [Headline]
**Date:** [YYYY-MM-DD]
[Concise summary in 2-3 sentences. End with citations like [1] [2].]
`;

  // Construct a search query that nudges towards these domains
  let searchQuery = `top 10 news stories about "${topic}" after ${dateStr}`;
  
  // Add custom sources to the search query context if they exist
  if (cleanedCustomDomains.length > 0) {
      searchQuery += ` include sources from: ${cleanedCustomDomains.join(', ')}`;
  } else if (topic === Topic.TECH || topic === Topic.GAMING) {
     searchQuery += ` sources: ${defaultDomains.slice(0, 5).join(' ')}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: searchQuery,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return parseNewsResponse(text, groundingChunks);
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};

const parseNewsResponse = (text: string, chunks: any[]): NewsItem[] => {
  const items: NewsItem[] = [];
  // Split by markdown header level 2
  const rawItems = text.split(/^## /m).filter(item => item.trim().length > 0);

  rawItems.forEach((rawItem, index) => {
    const lines = rawItem.trim().split('\n');
    const headline = lines[0].trim();
    
    // Check if this is the Briefing card
    if (headline.toLowerCase() === 'briefing') {
        const summary = lines.slice(1).join('\n').trim();
        items.push({
            id: `briefing-${Date.now()}`,
            type: 'briefing',
            headline: 'Quick Briefing',
            summary: summary,
            sources: [],
            timestamp: 'Now'
        });
        return;
    }

    // Process Standard News Article
    let dateStr = 'Recent';
    let summaryLines: string[] = [];

    // Parse lines to find Date and separate Summary
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.toLowerCase().startsWith('**date:**')) {
            const rawDate = line.replace(/\*\*date:\*\*/i, '').trim();
            // Attempt to parse date for relative time
            try {
               const dateObj = new Date(rawDate);
               if (!isNaN(dateObj.getTime())) {
                   const now = new Date();
                   const diffMs = now.getTime() - dateObj.getTime();
                   const diffHours = diffMs / (1000 * 60 * 60);
                   const diffDays = Math.floor(diffHours / 24);
                   
                   if (diffHours < 24 && now.getDate() === dateObj.getDate()) {
                       dateStr = 'Today';
                   } else if (diffDays <= 1) {
                       dateStr = 'Yesterday';
                   } else {
                       dateStr = `${diffDays} days ago`;
                   }
               } else {
                   dateStr = rawDate;
               }
            } catch (e) {
                dateStr = rawDate;
            }
        } else {
            summaryLines.push(line);
        }
    }

    const summary = summaryLines.join(' ').trim();

    const sources: NewsSource[] = [];
    const citationRegex = /\[(\d+)\]/g;
    
    let m;
    while ((m = citationRegex.exec(rawItem)) !== null) {
        const val = parseInt(m[1], 10);
        // Grounding chunks index logic
        if (chunks[val] && chunks[val].web) {
             sources.push(chunks[val].web);
        } else if (chunks[val - 1] && chunks[val - 1].web) {
             sources.push(chunks[val - 1].web);
        }
    }

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    items.push({
      id: `news-${index}-${Date.now()}`,
      type: 'article',
      headline,
      summary: summary.replace(/\[\d+\]/g, '').trim(),
      sources: uniqueSources.slice(0, 5),
      timestamp: dateStr,
    });
  });

  return items;
};