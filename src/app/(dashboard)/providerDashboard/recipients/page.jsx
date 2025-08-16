'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Star, MessageSquare } from 'lucide-react'
import React from 'react'
import { useProviderFeedback } from '@/hooks/useProviderFeedback'

const RecipientsPage = () => {
  const { data: feedbackData, isLoading, isError, error } = useProviderFeedback();

  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Recipients & Community
            </h2>
            <p className="text-gray-400">
              Connect with your food recipients
            </p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  Recipients Dashboard
                </h3>
                <p className="text-gray-400 mb-4">
                  View and manage your food recipients, feedback, and
                  community connections
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  View Recipients
                </Button>
              </div>
            </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Provider Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading && <p className="text-gray-400">Loading feedback...</p>}
            {isError && <p className="text-red-400">Error loading feedback: {error.message}</p>}
            
            {feedbackData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-yellow-400 flex items-center">
                    {feedbackData.averageRating}
                    <Star className="h-6 w-6 ml-1 fill-current" />
                  </div>
                  <div className="text-gray-400">
                    based on {feedbackData.totalRatings} ratings
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Recent Comments
                </h4>
                {feedbackData.feedbackComments && feedbackData.feedbackComments.length > 0 ? (
                  <div className="space-y-3">
                    {feedbackData.feedbackComments.map((fb, index) => (
                      <div key={index} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>
                            <span className="font-semibold">{fb.recipientName || 'Anonymous'}</span> rated <span className="text-yellow-400">{fb.rating} <Star className="h-3 w-3 inline-block fill-current" /></span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(fb.bookedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-200 mt-1">{fb.comment || 'No comment provided.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No comments yet.</p>
                )}
              </div>
            ) : (
              !isLoading && !isError && <p className="text-gray-400">No feedback available yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

export default RecipientsPage
