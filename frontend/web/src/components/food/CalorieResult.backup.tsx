import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Beef, Wheat, Droplet, Trash2 } from 'lucide-react';
import { FoodAnalysisResult } from '@/services/geminiService';

interface CalorieResultProps {
  results: FoodAnalysisResult[];
  onClear: () => void;
}

export default function CalorieResult({ results, onClear }: CalorieResultProps) {
  const totalCalories = results.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = results.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = results.reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = results.reduce((sum, item) => sum + item.fat, 0);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Nutritional Summary
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-orange-600">{totalCalories}</p>
              <p className="text-sm text-gray-600">Calories</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Beef className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-600">{totalProtein.toFixed(1)}g</p>
              <p className="text-sm text-gray-600">Protein</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Wheat className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-amber-600">{totalCarbs.toFixed(1)}g</p>
              <p className="text-sm text-gray-600">Carbs</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Droplet className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-yellow-600">{totalFat.toFixed(1)}g</p>
              <p className="text-sm text-gray-600">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Items */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Food Items ({results.length})</h3>
        {results.map((result, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{result.foodName}</h4>
                  <p className="text-sm text-gray-600">Serving: {result.servingSize}</p>
                  {result.confidence && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        result.confidence === 'high'
                          ? 'bg-green-100 text-green-700'
                          : result.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {result.confidence} confidence
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{result.calories}</p>
                  <p className="text-xs text-gray-500">calories</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-red-50 p-2 rounded text-center">
                  <p className="font-semibold text-red-600">{result.protein}g</p>
                  <p className="text-xs text-gray-600">Protein</p>
                </div>
                <div className="bg-amber-50 p-2 rounded text-center">
                  <p className="font-semibold text-amber-600">{result.carbs}g</p>
                  <p className="text-xs text-gray-600">Carbs</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded text-center">
                  <p className="font-semibold text-yellow-600">{result.fat}g</p>
                  <p className="text-xs text-gray-600">Fat</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
