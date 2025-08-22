# AI-Powered Smart Recommendations

## Overview

The Smart Recommendations feature in the Provider Analytics page now uses Google's Gemini AI to provide intelligent, personalized recommendations to help food providers reduce waste and improve efficiency.

## Features

### 🧠 AI-Powered Analysis
- Uses Google Gemini 1.5 Flash model for intelligent analysis
- Analyzes 60 days of historical data
- Provides contextual recommendations based on patterns

### 📊 Data Analysis
The AI analyzes:
- **Overall Performance**: Total food listed vs collected, waste rates
- **Category Patterns**: Performance by food category (e.g., Main Course, Dessert, etc.)
- **Weekly Patterns**: Day-of-week trends and waste patterns
- **Efficiency Metrics**: Collection rates and optimization opportunities

### 💡 Smart Recommendations
AI-generated recommendations include:
- **Priority Levels**: High, Medium, Low based on impact potential
- **Actionable Insights**: Specific steps to reduce waste
- **Expected Impact**: Quantified improvement predictions
- **Category-Specific**: Tailored advice for different food types
- **Timing Optimization**: Best practices for different days of the week

### 🎨 Enhanced UI
- **AI Indicators**: Visual badges showing AI-powered recommendations
- **Priority Color Coding**: Red (high), Orange (medium), Blue (low)
- **Expected Impact Display**: Shows predicted improvements
- **Detailed Insights**: Category and weekly pattern breakdowns

## Technical Implementation

### API Endpoint
- **Route**: `/api/analytics/provider/recommendations`
- **Method**: GET
- **Authentication**: Clerk user authentication required

### AI Integration
```javascript
// Uses Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### Response Format
```json
{
  "summary": "AI-generated performance summary",
  "overallWasteRate": "15.2",
  "totalListings": 45,
  "totalListed": 1250,
  "totalCollected": 1060,
  "aiPowered": true,
  "recommendations": [
    {
      "title": "Portion Control",
      "priority": "high",
      "type": "strategy",
      "description": "Reduce main course portions by 15% during weekdays",
      "expectedImpact": "10-15% waste reduction"
    }
  ],
  "insights": {
    "categoryBreakdown": [...],
    "dayOfWeekPatterns": [...]
  }
}
```

## Environment Setup

Ensure the following environment variable is set:
```bash
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Fallback System

If AI generation fails, the system automatically falls back to rule-based recommendations:
- High waste alerts (>20% waste rate)
- Category-specific recommendations (>25% waste rate)
- Day-of-week pattern recommendations (>30% waste rate)
- General best practices

## UI Components

### RecommendationCard
Enhanced with:
- AI-powered indicators (sparkles icon)
- Expected impact display
- Priority color coding
- Improved visual hierarchy

### Smart Recommendations Section
- Dynamic header showing AI status
- Refresh functionality
- Scrollable recommendation list
- Loading and error states

### AI Insights Section
- Category performance breakdown
- Weekly pattern analysis
- Color-coded waste rate indicators
- Detailed metrics display

## Usage

1. **Access**: Navigate to Provider Dashboard → Analytics
2. **View**: Scroll to "Smart Recommendations" section
3. **Identify**: Look for AI-powered badge and sparkles icons
4. **Act**: Follow the specific recommendations provided
5. **Monitor**: Use the refresh button to get updated recommendations

## Benefits

- **Personalized**: Tailored to individual provider patterns
- **Actionable**: Specific steps rather than generic advice
- **Quantified**: Expected impact measurements
- **Intelligent**: Learns from historical patterns
- **Comprehensive**: Covers multiple aspects of food waste reduction

## Testing

Use the test page at `/test-ai` to verify AI recommendations functionality without needing to navigate through the full dashboard.

## Future Enhancements

- Real-time recommendation updates
- Seasonal pattern analysis
- Recipient feedback integration
- Predictive waste modeling
- Multi-language support
