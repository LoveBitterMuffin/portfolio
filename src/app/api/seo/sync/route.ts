import { NextRequest, NextResponse } from 'next/server';
import { wordstatSeoService } from '../../../../services/WordstatSeoService';
import contentData from '../../../../data/content.json';

/**
 * API Route: /api/seo/sync
 * 
 * Triggers SEO update using Wordstat keyword data and AI generation.
 * Can be called manually or via cron job (Vercel Cron, GitHub Actions, etc.)
 * 
 * Methods:
 * - POST: Trigger SEO update
 * 
 * Environment Variables:
 * - GEMINI_API_KEY: Optional - for AI-powered SEO generation
 * 
 * Example curl:
 * curl -X POST http://localhost:3000/api/seo/sync
 */

const BASE_QUERIES = [
  'devsecops engineer',
  'react developer',
  'next.js developer',
  'three.js developer',
  'full-stack developer',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { apiKey = process.env.GEMINI_API_KEY, force = false } = body;

    // Prepare site content from content.json
    const siteContent = JSON.stringify(contentData, null, 2);

    // Update SEO
    const seoData = await wordstatSeoService.updateSeo(
      siteContent,
      BASE_QUERIES,
      apiKey
    );

    // In a real implementation, you would save this to a database or file
    // For this example, we'll return the data and let the frontend handle caching
    
    return NextResponse.json({
      success: true,
      data: seoData,
      message: 'SEO data updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SEO sync error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update SEO data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve current SEO data
 */
export async function GET() {
  try {
    const siteContent = JSON.stringify(contentData, null, 2);
    const seoData = await wordstatSeoService.updateSeo(
      siteContent,
      BASE_QUERIES,
      process.env.GEMINI_API_KEY
    );

    return NextResponse.json({
      success: true,
      data: seoData,
    });
  } catch (error) {
    console.error('SEO get error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve SEO data',
      },
      { status: 500 }
    );
  }
}
