"use client";
import React from "react";
import { Bookmark } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-12 text-center">
          <Bookmark className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Favorite Foods
          </h3>
          <p className="text-gray-400">
            Save your favorite food providers and get notified when they list new food
          </p>
        </CardContent>
      </Card>
    </div>
  );
}