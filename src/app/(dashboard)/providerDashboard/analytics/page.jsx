'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import React from 'react'

const AnalyticsPage = () => {
  return (
    <div>
        <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Analytics
            </h2>
            <p className="text-gray-400">
              View your food redistribution analytics
            </p>
        </div>

        <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-400 mb-4">
                  View your food redistribution analytics, impact, and
                  community connections
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  View Analytics
                </Button>
              </div>
            </CardContent>
        </Card>
    </div>
  )
}

export default AnalyticsPage