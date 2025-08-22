'use client';

import React, { useState } from 'react';
import { Brain, Sparkles, Loader2 } from 'lucide-react';

const AIRecommendationsTest = () => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const testAIRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analytics/provider/recommendations');
      const data = await response.json();
      
      if (response.ok) {
        setRecommendations(data);
      } else {
        setError(data.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 min-h-screen">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center mr-3">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">AI Recommendations Test</h2>
        </div>

        <button
          onClick={testAIRecommendations}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 mb-6"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Generating AI Recommendations...' : 'Test AI Recommendations'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {recommendations && (
          <div className="space-y-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                Summary
                {recommendations.aiPowered && (
                  <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30 flex items-center">
                    <Brain className="w-3 h-3 mr-1" />
                    AI-Powered
                  </span>
                )}
              </h3>
              <p className="text-gray-300">{recommendations.summary}</p>
              <div className="mt-2 text-sm text-gray-400">
                Waste Rate: {recommendations.overallWasteRate}% | 
                Total Listings: {recommendations.totalListings} |
                Listed: {recommendations.totalListed} |
                Collected: {recommendations.totalCollected}
              </div>
            </div>

            {recommendations.recommendations && recommendations.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {recommendations.recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{rec.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          rec.priority === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
                      {rec.expectedImpact && (
                        <p className="text-emerald-400 text-xs">Expected Impact: {rec.expectedImpact}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Type: {rec.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.insights && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.insights.categoryBreakdown && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Category Performance</h4>
                      <div className="space-y-2">
                        {recommendations.insights.categoryBreakdown.map((cat, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">{cat.category}</span>
                            <span className={`${
                              parseFloat(cat.wasteRate) > 25 ? 'text-red-400' : 
                              parseFloat(cat.wasteRate) > 15 ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {cat.wasteRate}% waste
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendations.insights.dayOfWeekPatterns && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Weekly Patterns</h4>
                      <div className="space-y-2">
                        {recommendations.insights.dayOfWeekPatterns.map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">{day.day}</span>
                            <span className={`${
                              parseFloat(day.wasteRate) > 30 ? 'text-red-400' : 
                              parseFloat(day.wasteRate) > 20 ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {day.wasteRate}% waste
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendationsTest;
