/**
 * WordstatSeoService - SEO Auto-Updater with AI Integration
 * 
 * This service handles:
 * 1. Fetching relevant keywords (mock implementation for Wordstat)
 * 2. Generating optimized SEO tags using Gemini AI
 * 3. Caching results for performance
 */

interface SeoData {
  title: string;
  description: string;
  keywords: string[];
  jsonLd: object;
  updatedAt: string;
}

interface KeywordData {
  keyword: string;
  frequency: number;
  competition: number;
}

// Mock Wordstat data - in production, this would fetch from Yandex.Wordstat API
const MOCK_KEYWORD_DATA: KeywordData[] = [
  { keyword: 'devsecops engineer', frequency: 1200, competition: 0.7 },
  { keyword: 'react developer', frequency: 5400, competition: 0.8 },
  { keyword: 'next.js developer', frequency: 3200, competition: 0.6 },
  { keyword: 'three.js developer', frequency: 1800, competition: 0.5 },
  { keyword: 'full-stack developer', frequency: 8900, competition: 0.9 },
  { keyword: 'web security engineer', frequency: 950, competition: 0.6 },
  { keyword: 'kubernetes specialist', frequency: 1400, competition: 0.7 },
  { keyword: 'gsap animation', frequency: 1100, competition: 0.4 },
  { keyword: 'portfolio developer', frequency: 2200, competition: 0.5 },
  { keyword: 'interactive web', frequency: 1750, competition: 0.5 },
];

class WordstatSeoService {
  private cache: Map<string, SeoData> = new Map();
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Fetch relevant keywords from Wordstat (mock implementation)
   * In production, integrate with Yandex.Wordstat API
   */
  async fetchKeywords(baseQueries: string[]): Promise<KeywordData[]> {
    // Mock implementation - filter and sort by relevance
    const relevantKeywords = MOCK_KEYWORD_DATA.filter(kw =>
      baseQueries.some(query => 
        kw.keyword.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(kw.keyword.toLowerCase())
      )
    );

    // Sort by frequency * (1 - competition) for relevance score
    return relevantKeywords.sort((a, b) => {
      const scoreA = a.frequency * (1 - a.competition);
      const scoreB = b.frequency * (1 - b.competition);
      return scoreB - scoreA;
    }).slice(0, 10);
  }

  /**
   * Generate SEO tags using Gemini AI
   */
  async generateSeoWithAI(
    siteContent: string,
    keywords: KeywordData[],
    apiKey: string
  ): Promise<SeoData> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const topKeywords = keywords.slice(0, 5).map(k => k.keyword).join(', ');
    const allKeywords = keywords.map(k => k.keyword).join(', ');

    const prompt = `
You are an SEO expert. Generate optimized SEO metadata for a portfolio website.

Site Content:
${siteContent.substring(0, 2000)}

Top Keywords (by relevance): ${topKeywords}
All Keywords: ${allKeywords}

Generate and return ONLY a valid JSON object with this exact structure:
{
  "title": "Optimized title (50-60 characters, includes main keyword)",
  "description": "Compelling description (150-160 characters, includes keywords)",
  "keywords": ["array", "of", "relevant", "keywords"],
  "jsonLd": {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Dmitry Volkov",
    "jobTitle": "Full-Stack Developer & DevSecOps Engineer",
    "url": "https://github.com/LoveBitterMuffin",
    "sameAs": ["https://github.com/LoveBitterMuffin", "https://linkedin.com/in/dmitry-volkov-dev"],
    "knowsAbout": ["React", "Next.js", "DevSecOps", "Three.js", "GSAP"]
  }
}

Ensure the JSON is valid and properly formatted. Return ONLY the JSON, no additional text.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const seoData = JSON.parse(jsonMatch[0]);

      return {
        ...seoData,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating SEO with AI:', error);
      // Fallback to basic SEO data
      return this.getFallbackSeo(keywords);
    }
  }

  /**
   * Fallback SEO data when AI fails
   */
  private getFallbackSeo(keywords: KeywordData[]): SeoData {
    const topKeywords = keywords.slice(0, 5).map(k => k.keyword);
    
    return {
      title: 'Дмитрий Волков — Full-Stack Developer & DevSecOps Engineer',
      description: `Эксперт в ${topKeywords.join(', ')}. Интерактивное портфолио с Next.js, Three.js, GSAP.`,
      keywords: topKeywords,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Dmitry Volkov',
        jobTitle: 'Full-Stack Developer & DevSecOps Engineer',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Cache SEO data
   */
  setCache(key: string, data: SeoData): void {
    this.cache.set(key, data);
  }

  /**
   * Get cached SEO data
   */
  getCache(key: string): SeoData | null {
    const data = this.cache.get(key);
    if (!data) return null;

    // Check if cache is expired
    const age = Date.now() - new Date(data.updatedAt).getTime();
    if (age > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Main method to update SEO
   */
  async updateSeo(
    siteContent: string,
    baseQueries: string[],
    apiKey?: string
  ): Promise<SeoData> {
    const cacheKey = baseQueries.join('-');
    
    // Check cache first
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch keywords
    const keywords = await this.fetchKeywords(baseQueries);

    // Generate SEO with AI if API key is provided
    let seoData: SeoData;
    if (apiKey) {
      seoData = await this.generateSeoWithAI(siteContent, keywords, apiKey);
    } else {
      seoData = this.getFallbackSeo(keywords);
    }

    // Cache the result
    this.setCache(cacheKey, seoData);

    return seoData;
  }
}

// Singleton instance
export const wordstatSeoService = new WordstatSeoService();
