 import React from "react";
import { History } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-12 text-center">
          <History className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Claim History
          </h3>
          <p className="text-gray-400">
            View your complete food claiming history and statistics
          </p>
        </CardContent>
      </Card>
    </div>
  );
}