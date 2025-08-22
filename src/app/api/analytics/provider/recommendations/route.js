// File: /app/api/analytics/provider/recommendations/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import FoodListing from '@/models/FoodListing';
import Booking from '@/models/Booking';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Generate AI-powered recommendations using Gemini
async function generateAIRecommendations(analyticsData) {
  try {
    const prompt = `
You are an AI assistant specializing in food waste reduction for food providers. Analyze the following data and provide actionable recommendations to help reduce food waste and improve efficiency.

PROVIDER DATA ANALYSIS:
- Total food listed: ${analyticsData.totalListed} servings
- Total food collected: ${analyticsData.totalCollected} servings
- Overall waste rate: ${analyticsData.overallWasteRate.toFixed(1)}%
- Analysis period: Last 60 days
- Total listings: ${analyticsData.totalListings}

CATEGORY BREAKDOWN:
${Object.entries(analyticsData.categoryAnalysis).map(([category, data]) =>
  `- ${category}: ${data.totalListed} listed, ${data.totalCollected} collected (${((data.totalListed - data.totalCollected) / data.totalListed * 100).toFixed(1)}% waste rate)`
).join('\n')}

DAY OF WEEK PATTERNS:
${Object.entries(analyticsData.dayOfWeekAnalysis).map(([day, data]) =>
  `- ${day}: ${data.totalListed} listed, ${data.totalCollected} collected (${((data.totalListed - data.totalCollected) / data.totalListed * 100).toFixed(1)}% waste rate)`
).join('\n')}

Please provide:
1. A brief summary of the provider's performance (2-3 sentences)
2. 4-6 specific, actionable recommendations to reduce waste
3. Each recommendation should include:
   - A clear title (max 4 words)
   - Priority level (high/medium/low)
   - Specific description with actionable steps
   - Expected impact

Format your response as JSON:
{
  "summary": "Brief performance summary",
  "recommendations": [
    {
      "title": "Recommendation Title",
      "priority": "high|medium|low",
      "type": "category|timing|portion|strategy",
      "description": "Detailed actionable description",
      "expectedImpact": "Expected improvement percentage or outcome"
    }
  ]
}

Focus on practical, implementable suggestions that can measurably reduce food waste.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      summary: "AI analysis completed. Review the recommendations below for waste reduction strategies.",
      recommendations: []
    };

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    // Return fallback recommendations
    return {
      summary: "Unable to generate AI recommendations at this time. Using standard analysis.",
      recommendations: []
    };
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get data for the last 60 days for better pattern analysis
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const listings = await FoodListing.find({
      providerId: userId,
      createdAt: { $gte: sixtyDaysAgo }
    });

    if (listings.length === 0) {
      return NextResponse.json({
        summary: "Not enough data available for recommendations.",
        recommendations: []
      });
    }

    // Calculate collection rates by category and day of week
    const categoryAnalysis = {};
    const dayOfWeekAnalysis = {};
    
    for (const listing of listings) {
      const collectedBookings = await Booking.find({
        listingId: listing._id,
        status: 'collected'
      });

      const collected = collectedBookings.reduce((sum, booking) => sum + booking.approvedQuantity, 0);
      const wasteRate = listing.quantity > 0 ? ((listing.quantity - collected) / listing.quantity) * 100 : 0;
      
      // Category analysis
      if (!categoryAnalysis[listing.category]) {
        categoryAnalysis[listing.category] = {
          totalListed: 0,
          totalCollected: 0,
          count: 0
        };
      }
      categoryAnalysis[listing.category].totalListed += listing.quantity;
      categoryAnalysis[listing.category].totalCollected += collected;
      categoryAnalysis[listing.category].count += 1;

      // Day of week analysis
      const dayOfWeek = new Date(listing.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayOfWeekAnalysis[dayOfWeek]) {
        dayOfWeekAnalysis[dayOfWeek] = {
          totalListed: 0,
          totalCollected: 0,
          count: 0
        };
      }
      dayOfWeekAnalysis[dayOfWeek].totalListed += listing.quantity;
      dayOfWeekAnalysis[dayOfWeek].totalCollected += collected;
      dayOfWeekAnalysis[dayOfWeek].count += 1;
    }

    // Calculate overall metrics for AI analysis
    const totalListed = listings.reduce((sum, l) => sum + l.quantity, 0);
    const allCollectedBookings = await Booking.find({
      providerId: userId,
      status: 'collected',
      collectedAt: { $gte: sixtyDaysAgo }
    });
    const totalCollected = allCollectedBookings.reduce((sum, b) => sum + b.approvedQuantity, 0);
    const overallWasteRate = totalListed > 0 ? ((totalListed - totalCollected) / totalListed) * 100 : 0;

    // Prepare data for AI analysis
    const analyticsData = {
      totalListed,
      totalCollected,
      overallWasteRate,
      totalListings: listings.length,
      categoryAnalysis,
      dayOfWeekAnalysis
    };

    // Generate AI-powered recommendations
    const aiResult = await generateAIRecommendations(analyticsData);

    // Use AI summary or fallback to basic summary
    let summary = aiResult.summary || `You've listed ${totalListed} servings in the last 60 days, with ${totalCollected} collected (${(100 - overallWasteRate).toFixed(1)}% efficiency).`;

    // Use AI recommendations or fallback to basic recommendations
    let recommendations = aiResult.recommendations || [];

    // If AI didn't provide recommendations, use fallback logic
    if (recommendations.length === 0) {
      // High waste alert
      if (overallWasteRate > 20) {
        recommendations.push({
          type: 'urgent',
          title: 'High Waste Alert',
          description: `Consider reducing overall cooking quantity by ${Math.min(30, Math.ceil(overallWasteRate * 0.7))}% to minimize waste.`,
          priority: 'high'
        });
      }

      // Category-specific recommendations
      Object.entries(categoryAnalysis).forEach(([category, data]) => {
        const categoryWasteRate = data.totalListed > 0 ? ((data.totalListed - data.totalCollected) / data.totalListed) * 100 : 0;

        if (categoryWasteRate > 25 && data.count >= 3) {
          recommendations.push({
            type: 'category',
            title: `${category} Optimization`,
            description: `${category} shows ${categoryWasteRate.toFixed(1)}% waste rate. Consider reducing portions by ${Math.ceil(categoryWasteRate * 0.6)}% or splitting into smaller batches.`,
            priority: categoryWasteRate > 40 ? 'high' : 'medium'
          });
        }
      });

      // Day-of-week patterns
      Object.entries(dayOfWeekAnalysis).forEach(([day, data]) => {
        const dayWasteRate = data.totalListed > 0 ? ((data.totalListed - data.totalCollected) / data.totalListed) * 100 : 0;

        if (dayWasteRate > 30 && data.count >= 2) {
          recommendations.push({
            type: 'timing',
            title: `${day} Pattern`,
            description: `${day}s show higher waste (${dayWasteRate.toFixed(1)}%). Consider cooking ${Math.ceil(dayWasteRate * 0.5)}% less on ${day}s.`,
            priority: 'medium'
          });
        }
      });

      // General best practices
      if (recommendations.length === 0) {
        recommendations.push({
          type: 'success',
          title: 'Great Job!',
          description: 'Your food sharing efficiency is excellent. Keep monitoring patterns to maintain this performance.',
          priority: 'low'
        });
      } else {
        recommendations.push({
          type: 'general',
          title: 'Best Practices',
          description: 'Track peak demand times, consider smaller frequent batches, and communicate with regular recipients about their needs.',
          priority: 'low'
        });
      }
    }

    // Sort by priority
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return NextResponse.json({
      summary,
      overallWasteRate: overallWasteRate.toFixed(1),
      totalListings: listings.length,
      totalListed,
      totalCollected,
      aiPowered: aiResult.recommendations && aiResult.recommendations.length > 0,
      recommendations: recommendations.slice(0, 8), // Increased limit for AI recommendations
      insights: {
        categoryBreakdown: Object.entries(categoryAnalysis).map(([category, data]) => ({
          category,
          wasteRate: data.totalListed > 0 ? ((data.totalListed - data.totalCollected) / data.totalListed * 100).toFixed(1) : '0',
          totalListed: data.totalListed,
          totalCollected: data.totalCollected
        })),
        dayOfWeekPatterns: Object.entries(dayOfWeekAnalysis).map(([day, data]) => ({
          day,
          wasteRate: data.totalListed > 0 ? ((data.totalListed - data.totalCollected) / data.totalListed * 100).toFixed(1) : '0',
          totalListed: data.totalListed,
          totalCollected: data.totalCollected
        }))
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}