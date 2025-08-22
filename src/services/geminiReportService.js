// Gemini AI service for generating intelligent reports
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiReportService {
  constructor() {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate a provider analytics report using AI
   */
  async generateProviderReport(analyticsData, reportType = 'weekly') {
    const prompt = this.buildProviderPrompt(analyticsData, reportType);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating provider report:', error);
      throw new Error('Failed to generate provider report');
    }
  }

  /**
   * Generate a recipient impact report using AI
   */
  async generateRecipientReport(impactData, reportType = 'weekly') {
    const prompt = this.buildRecipientPrompt(impactData, reportType);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating recipient report:', error);
      throw new Error('Failed to generate recipient report');
    }
  }

  /**
   * Build prompt for provider analytics report
   */
  buildProviderPrompt(data, reportType) {
    const timeframe = this.getTimeframeText(reportType);
    
    return `
You are an AI assistant helping to generate a ${reportType} food waste reduction report for a food provider on the SaveServe platform.

PROVIDER ANALYTICS DATA:
${JSON.stringify(data, null, 2)}

Please generate a comprehensive, professional, and actionable report that includes:

1. **Executive Summary** (2-3 sentences)
   - Key highlights of their ${timeframe} performance
   - Most significant achievement or concern

2. **Performance Metrics** 
   - Food listed vs collected analysis
   - Waste reduction percentage and trends
   - Environmental impact (CO2 and water saved)
   - Efficiency improvements or declines

3. **Key Insights**
   - Patterns in food category performance
   - Peak activity times and trends
   - Comparison to previous periods (if data available)

4. **Actionable Recommendations** (3-5 specific suggestions)
   - Ways to reduce food waste
   - Optimal timing for food listings
   - Category-specific improvements
   - Engagement strategies

5. **Environmental Impact Highlight**
   - Quantify the positive environmental impact
   - Put numbers in relatable context (e.g., "equivalent to X car miles")

6. **Next Steps**
   - Specific goals for the next ${reportType.toLowerCase()} period
   - Suggested actions to implement

Format the report in clean, professional markdown with appropriate headers and bullet points. 
Keep the tone encouraging and constructive, focusing on achievements while providing helpful guidance for improvement.
Use data-driven insights and avoid generic advice.

The report should be approximately 400-600 words and suitable for email delivery.
`;
  }

  /**
   * Build prompt for recipient impact report
   */
  buildRecipientPrompt(data, reportType) {
    const timeframe = this.getTimeframeText(reportType);
    
    return `
You are an AI assistant helping to generate a ${reportType} impact report for a food recipient on the SaveServe platform.

RECIPIENT IMPACT DATA:
${JSON.stringify(data, null, 2)}

Please generate a personalized, encouraging, and informative report that includes:

1. **Personal Impact Summary** (2-3 sentences)
   - Their ${timeframe} contribution to food waste reduction
   - Most significant achievement

2. **Your Numbers**
   - Meals saved/claimed
   - Environmental impact (CO2 saved, water conserved)
   - Waste reduction contribution
   - Success rate and activity trends

3. **Environmental Hero Status**
   - Put their impact in relatable terms
   - Compare to everyday activities (car miles, tree planting equivalent)
   - Show cumulative impact over time

4. **Activity Insights**
   - Booking patterns and trends
   - Most active days/times
   - Favorite food categories (if available)
   - Success rate analysis

5. **Community Impact**
   - How their actions contribute to the larger mission
   - Collective impact with other users
   - Progress toward sustainability goals

6. **Achievements & Milestones**
   - Badges earned or progress toward next milestone
   - Personal records or improvements
   - Recognition of consistent participation

7. **Encouragement & Next Steps**
   - Motivational message about their contribution
   - Suggestions for increased impact
   - Community challenges or goals

Format the report in clean, engaging markdown with appropriate headers and bullet points.
Keep the tone positive, personal, and motivating. Focus on celebrating their contribution while encouraging continued participation.
Use specific numbers and achievements to make the impact feel tangible and meaningful.

The report should be approximately 350-500 words and suitable for email delivery.
`;
  }

  /**
   * Get human-readable timeframe text
   */
  getTimeframeText(reportType) {
    switch (reportType.toLowerCase()) {
      case 'daily':
        return 'past 24 hours';
      case 'weekly':
        return 'past week';
      case 'monthly':
        return 'past month';
      default:
        return 'recent period';
    }
  }

  /**
   * Generate a summary report for multiple users
   */
  async generateSummaryReport(aggregatedData, reportType = 'weekly') {
    const prompt = `
You are generating a ${reportType} summary report for the SaveServe platform administrators.

AGGREGATED PLATFORM DATA:
${JSON.stringify(aggregatedData, null, 2)}

Create a concise executive summary (200-300 words) covering:
1. Platform-wide metrics and trends
2. Top performing providers and active recipients  
3. Environmental impact achievements
4. Key insights and recommendations for platform improvement
5. Notable patterns or concerns

Format in professional markdown suitable for stakeholder communication.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary report:', error);
      throw new Error('Failed to generate summary report');
    }
  }
}

// Export singleton instance
const geminiReportService = new GeminiReportService();
export default geminiReportService;
