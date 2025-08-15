'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell } from 'lucide-react'
import React from 'react'

const NotificationsPage = () => {
  return (
    <div>
        <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Notifications
            </h2>
            <p className="text-gray-400">
              Manage your notification preferences
            </p>
        </div>

        <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="text-gray-100">
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you want to be notified about food claims and
                updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Food Claimed</Label>
                  <p className="text-sm text-gray-400">
                    Get notified when someone claims your food
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">
                    Expiration Warnings
                  </Label>
                  <p className="text-sm text-gray-400">
                    Alert when food is about to expire
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Daily Summary</Label>
                  <p className="text-sm text-gray-400">
                    Daily report of your impact
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">New Features</Label>
                  <p className="text-sm text-gray-400">
                    Updates about new platform features
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="text-gray-100">
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      Your "Vegetable Biryani" was claimed by Student A
                    </p>
                    <p className="text-xs text-gray-500">
                      2 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      Your "Mixed Fruit Salad" expires in 45 minutes
                    </p>
                    <p className="text-xs text-gray-500">
                      15 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      Weekly impact report: You've saved 15kg of food!
                    </p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
        </Card>
    </div>
  )
}

export default NotificationsPage