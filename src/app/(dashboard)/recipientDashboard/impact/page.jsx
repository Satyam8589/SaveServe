"use client";
import React from "react";
import {
  Utensils,
  Globe,
  Droplet,
  Award,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Sample impact data
const impactData = {
  totalImpact: {
    mealsSaved: 52,
    carbonSaved: 12.5,
    waterSaved: 650,
    wasteReduced: 8.2,
  },
  stats: {
    impactScore: 850,
  },
};

export default function ImpactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">
          My Impact
        </h2>
        <p className="text-gray-400">
          See how you're helping reduce food waste
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <Utensils className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-emerald-400">
              {impactData.totalImpact.mealsSaved}
            </div>
            <div className="text-sm text-gray-400">Meals Saved</div>
            <div className="text-xs text-gray-500 mt-1">
              This month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-blue-400">
              {impactData.totalImpact.carbonSaved}kg
            </div>
            <div className="text-sm text-gray-400">CO₂ Saved</div>
            <div className="text-xs text-gray-500 mt-1">
              Carbon footprint
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <Droplet className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-cyan-400">
              {impactData.totalImpact.waterSaved}L
            </div>
            <div className="text-sm text-gray-400">Water Saved</div>
            <div className="text-xs text-gray-500 mt-1">
              Virtual water
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-yellow-400">
              {impactData.stats.impactScore}
            </div>
            <div className="text-sm text-gray-400">
              Impact Score
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Keep it up!
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">
            Weekly Activity
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your food claiming patterns this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Weekly activity chart</p>
              <p className="text-sm text-gray-500">
                Integration with charting library
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Environmental Impact</CardTitle>
            <CardDescription className="text-gray-400">
              Your contribution to sustainability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Waste Reduced</span>
              <span className="text-emerald-400 font-semibold">
                {impactData.totalImpact.wasteReduced}kg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Carbon Footprint</span>
              <span className="text-blue-400 font-semibold">
                -{impactData.totalImpact.carbonSaved}kg CO₂
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Water Conservation</span>
              <span className="text-cyan-400 font-semibold">
                {impactData.totalImpact.waterSaved}L saved
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Achievement Badges</CardTitle>
            <CardDescription className="text-gray-400">
              Milestones you've reached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Award className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300 font-medium">First Claim</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="text-center">
                <Award className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300 font-medium">10 Meals</p>
                <p className="text-xs text-gray-500">Achieved</p>
              </div>
              <div className="text-center opacity-50">
                <Award className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">50 Meals</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
              <div className="text-center opacity-50">
                <Award className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Eco Hero</p>
                <p className="text-xs text-gray-500">Locked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}