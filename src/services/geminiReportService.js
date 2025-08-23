// Gemini AI service for generating intelligent reports
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiReportService {
  constructor() {
    this.isEnabled = !!process.env.GOOGLE_GEMINI_API_KEY;

    if (this.isEnabled) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      console.warn('⚠️ GOOGLE_GEMINI_API_KEY not found. Gemini AI features will be disabled.');
      this.genAI = null;
      this.model = null;
    }
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Generate a provider analytics report using AI
   */
  async generateProviderReport(analyticsData, reportType = 'weekly') {
    if (!this.isAvailable()) {
      console.log('Gemini AI not available. Using fallback report generation.');
      return this.generateFallbackProviderReport(analyticsData, reportType);
    }

    const prompt = this.buildProviderPrompt(analyticsData, reportType);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error for provider report:', error);

      // Check if it's a quota/rate limit error
      if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log('Gemini API quota exceeded. Using fallback report generation.');
        return this.generateFallbackProviderReport(analyticsData, reportType);
      }

      throw new Error(`Failed to generate provider report: ${error.message}`);
    }
  }

  /**
   * Generate a recipient impact report using AI
   */
  async generateRecipientReport(impactData, reportType = 'weekly') {
    if (!this.isAvailable()) {
      console.log('Gemini AI not available. Using fallback report generation.');
      return this.generateFallbackRecipientReport(impactData, reportType);
    }

    const prompt = this.buildRecipientPrompt(impactData, reportType);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error for recipient report:', error);

      // Check if it's a quota/rate limit error
      if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.log('Gemini API quota exceeded. Using fallback report generation.');
        return this.generateFallbackRecipientReport(impactData, reportType);
      }

      throw new Error(`Failed to generate recipient report: ${error.message}`);
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
    if (!this.isAvailable()) {
      console.log('Gemini AI not available. Using fallback summary report generation.');
      return this.generateFallbackSummaryReport(aggregatedData, reportType);
    }

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
  /**
   * Generate fallback provider report when Gemini API is unavailable
   */
  generateFallbackProviderReport(data, reportType) {
    const { kpis, provider, period } = data;
    const periodName = reportType.charAt(0).toUpperCase() + reportType.slice(1);

    return `# ${periodName} Analytics Report for ${provider.name}

## 📊 Performance Summary

Great work this ${reportType}! Here's your food waste reduction impact:

### Key Achievements
- **${kpis.totalFoodListed} items** listed on SaveServe
- **${kpis.totalFoodCollected} items** successfully collected by recipients
- **${kpis.carbonSaved}kg CO₂** saved from the environment
- **${kpis.waterSaved} liters** of water conserved

### Environmental Impact
Your efforts this ${reportType} prevented **${kpis.totalFoodWasted} items** from going to waste, achieving a **${100 - parseFloat(kpis.wastePercentage)}%** success rate in food rescue operations.

## 💡 Recommendations

### Continue Your Great Work
- Your current waste reduction rate of **${100 - parseFloat(kpis.wastePercentage)}%** shows excellent food management
- Keep listing surplus food promptly to maximize rescue opportunities
- Consider partnering with local NGOs for bulk donations

### Areas for Growth
- List food items earlier in the day for better visibility
- Provide detailed descriptions to attract more recipients
- Optimize pickup time windows for recipient convenience

## 🌱 Community Impact

Every item you list helps build a more sustainable food system. Your **${kpis.totalFoodCollected} rescued items** this ${reportType} made a real difference in reducing food waste and supporting community members.

**Thank you for being a SaveServe champion!** 🌟

---
*This report was generated automatically by SaveServe. Continue your amazing work in fighting food waste!*`;
  }

  /**
   * Generate fallback recipient report when Gemini API is unavailable
   */
  generateFallbackRecipientReport(data, reportType) {
    const { impact, activity, recipient, period } = data;
    const periodName = reportType.charAt(0).toUpperCase() + reportType.slice(1);

    return `# ${periodName} Impact Report for ${recipient.name}

## 🌟 Your Food Rescue Impact

Amazing work this ${reportType}! You're making a real difference in fighting food waste.

### Your Achievements
- **${impact.mealsSaved} meals** successfully rescued and collected
- **${impact.carbonSaved}kg CO₂** prevented from entering the atmosphere
- **${impact.waterSaved} liters** of water saved through food rescue
- **${impact.wasteReduced}kg** of food waste prevented

### Activity Summary
- **${activity.totalCompleted}** successful food collections out of **${activity.totalBooked}** bookings
- **${activity.successRate}%** completion rate - ${activity.successRate >= 80 ? 'Excellent!' : activity.successRate >= 60 ? 'Good work!' : 'Room for improvement!'}
- Impact Score: **${impact.impactScore}** points

## 🌍 Environmental Impact

Your **${impact.mealsSaved} rescued meals** this ${reportType} represent real environmental action:

- **Carbon Footprint**: You prevented ${impact.carbonSaved}kg of CO₂ emissions
- **Water Conservation**: Your actions saved ${impact.waterSaved} liters of precious water
- **Waste Reduction**: ${impact.wasteReduced}kg of food was rescued instead of wasted

## 💪 Keep Up the Great Work!

### Your Impact Matters
Every meal you rescue helps create a more sustainable food system. Your ${activity.successRate}% completion rate shows your commitment to the cause.

### Tips for Even Greater Impact
- Complete your bookings to maximize food rescue
- Share SaveServe with friends to multiply the impact
- Try different food categories to diversify your rescue efforts

## 🏆 Community Recognition

You're part of a growing community of food waste fighters. Your **${impact.mealsSaved} meals rescued** this ${reportType} contribute to our collective mission of building a world without food waste.

**Thank you for being a SaveServe hero!** 🦸‍♀️🦸‍♂️

---
*This report was generated automatically by SaveServe. Every meal you rescue makes a difference!*`;
  }

  /**
   * Generate fallback summary report when Gemini AI is unavailable
   */
  generateFallbackSummaryReport(aggregatedData, reportType) {
    const periodName = reportType.charAt(0).toUpperCase() + reportType.slice(1);

    return `# SaveServe Platform ${periodName} Summary Report

## Executive Summary

This ${reportType} summary provides an overview of platform activity and impact.

### Platform Metrics
- **Total Data Points**: ${Object.keys(aggregatedData).length}
- **Report Period**: ${periodName}
- **Generated**: ${new Date().toLocaleDateString()}

### Key Highlights
- Platform continues to facilitate food rescue operations
- Multiple stakeholders actively participating
- Environmental impact through food waste reduction

### Recommendations
- Continue monitoring platform usage patterns
- Encourage provider and recipient engagement
- Focus on expanding community reach

---
*This report was generated automatically by SaveServe. AI-enhanced insights are currently unavailable.*`;
  }
}

// Export singleton instance
const geminiReportService = new GeminiReportService();
export default geminiReportService;
