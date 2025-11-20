import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Camera, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/food/ImageUpload';
import ManualInput from '@/components/food/ManualInput';
import CalorieResult from '@/components/food/CalorieResult';
import { analyzeFood, analyzeIngredients } from '@/services/geminiService';
import logoImg from '@/assets/logo.png';

export default function FoodTracking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'image' | 'manual'>('image');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = async (file: File, dishName: string, allergies: string[]) => {
    setIsLoading(true);
    setError(null);

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    try {
      const analysisResult = await analyzeFood(file, dishName, allergies);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
      console.error('Analysis error:', err);
      setUploadedImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAnalyze = async (ingredients: string, dishName: string, allergies: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const analysisResult = await analyzeIngredients(ingredients, dishName, allergies);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze ingredients');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
                <h1 className="text-2xl font-bold text-gray-900">Food Tracker</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              AI Food & Nutrition Analysis
            </h2>
            <p className="text-gray-600">
              Upload food images or enter ingredients for comprehensive nutritional analysis with allergy detection
            </p>
          </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
              {error.includes('API key') && (
                <p className="text-red-600 text-xs mt-2">
                  Add <code className="bg-red-100 px-1 rounded">VITE_GEMINI_API_KEY</code> to your .env file
                </p>
              )}
            </div>
          </div>
        )}

        {!result ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'image'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Camera className="w-5 h-5" />
                Image Upload
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'manual'
                    ? 'bg-white text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit3 className="w-5 h-5" />
                Manual Entry
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'image' ? (
                <ImageUpload onImageUpload={handleImageUpload} loading={isLoading} />
              ) : (
                <ManualInput onAnalyze={handleManualAnalyze} loading={isLoading} />
              )}
            </div>
          </div>
        ) : (
          <CalorieResult 
            result={result} 
            onReset={handleReset} 
            uploadedImage={uploadedImage}
          />
        )}

        {/* Info Card */}
        {!result && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span>Enhanced Features</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Allergy Detection</h4>
                  <p className="text-sm text-gray-600">Select your allergies and get instant warnings</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Where to Buy</h4>
                  <p className="text-sm text-gray-600">Philippine stores (Lazada, Shopee, Puregold)</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Full Nutrition Facts</h4>
                  <p className="text-sm text-gray-600">15+ data points including vitamins and minerals</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">👨‍🍳</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Recipe Ideas</h4>
                  <p className="text-sm text-gray-600">Get recipe links and cooking suggestions</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Healthier Alternatives</h4>
                  <p className="text-sm text-gray-600">Discover better options with calorie savings</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Verified Data</h4>
                  <p className="text-sm text-gray-600">Cross-referenced with FatSecret API and USDA</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
