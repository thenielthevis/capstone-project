import { useState, useEffect } from 'react';
import { Camera, Edit3, History, BarChart3, Search, ChevronLeft, ChevronRight, Utensils } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import ImageUpload from '@/components/food/ImageUpload';
import ManualInput from '@/components/food/ManualInput';
import CalorieResult from '@/components/food/CalorieResult';
import MultiDishUpload, { DishEntry } from '@/components/food/MultiDishUpload';
import MultiDishResult from '@/components/food/MultiDishResult';
import { analyzeFood, analyzeIngredients, analyzeMultipleDishes, MultiDishAnalysisResult } from '@/services/geminiService';
import foodLogApi from '@/api/foodLogApi';
import { getUserAllergies } from '@/api/userApi';
import Header from '@/components/Header';

export default function FoodTracking() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'analyze' | 'history'>('analyze');
  const [activeTab, setActiveTab] = useState<'image' | 'manual' | 'multi'>('image');
  const [result, setResult] = useState<any>(null);
  const [multiDishResult, setMultiDishResult] = useState<MultiDishAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // History states
  const [foodHistory, setFoodHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDishName, setCurrentDishName] = useState('');
  const [currentAllergies, setCurrentAllergies] = useState<string[]>([]);

  // User allergies states (auto-populated from profile)
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userDietaryPreferences, setUserDietaryPreferences] = useState<string[]>([]);

  // Fetch user allergies on mount
  useEffect(() => {
    const loadUserAllergies = async () => {
      if (!user) return;
      try {
        const response = await getUserAllergies();
        setUserAllergies(response.allergies || []);
        setUserDietaryPreferences(response.dietaryPreferences || []);
        console.log('[FoodTracking] Loaded user allergies:', response.allergies);
      } catch (error) {
        console.error('[FoodTracking] Error loading user allergies:', error);
      }
    };
    loadUserAllergies();
  }, [user]);

  // Save food log to backend
  const saveFoodLog = async (analysisResult: any, imageBase64?: string, ingredientsList?: string) => {
    if (!user) {
      console.log('No user logged in, skipping food log save');
      return;
    }

    try {
      console.log('Attempting to save food log...');
      
      // Don't send base64 image if it's too large (over 10MB)
      let imageToSend = imageBase64;
      if (imageBase64) {
        const sizeInBytes = imageBase64.length * 0.75; // Approximate size
        const sizeInMB = sizeInBytes / (1024 * 1024);
        console.log(`Image size: ${sizeInMB.toFixed(2)} MB`);
        
        if (sizeInMB > 10) {
          console.log('Image too large, skipping image upload');
          imageToSend = undefined;
          alert('Note: Image is too large and was not saved. Food data saved successfully.');
        }
      }

      await foodLogApi.createFoodLog({
        ...analysisResult,
        inputMethod: activeTab,
        imageBase64: imageToSend,
        dishName: currentDishName || undefined,
        userAllergies: currentAllergies,
        ingredientsList: activeTab === 'manual' ? ingredientsList : undefined
      });
      
      console.log('Food log saved successfully');
    } catch (err: any) {
      console.error('Error saving food log:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Show error to user if it's a network or server issue
      if (err.message?.includes('Network Error') || err.message?.includes('timeout')) {
        alert('Save Failed: Could not save to history. Please check your connection.');
      } else if (err.response?.status === 401) {
        alert('Authentication Error: Please log in again to save your food logs.');
      } else if (err.response?.status >= 500) {
        alert('Server Error: Could not save to history. The analysis is still available above.');
      }
    }
  };

  const handleImageUpload = async (file: File, dishName: string, allergies: string[]) => {
    setIsLoading(true);
    setError(null);
    setCurrentDishName(dishName);
    setCurrentAllergies(allergies);

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    try {
      const analysisResult = await analyzeFood(file, dishName, allergies);
      setResult(analysisResult);
      
      // Convert file to base64 and save to backend
      if (user) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          await saveFoodLog(analysisResult, base64data);
        };
        reader.readAsDataURL(file);
      }
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
    setCurrentDishName(dishName);
    setCurrentAllergies(allergies);

    try {
      const analysisResult = await analyzeIngredients(ingredients, dishName, allergies);
      setResult(analysisResult);
      
      // Save to backend
      if (user) {
        await saveFoodLog(analysisResult, undefined, ingredients);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze ingredients');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle multi-dish analysis
  const handleMultiDishAnalyze = async (dishes: DishEntry[], allergies: string[]) => {
    setIsLoading(true);
    setError(null);
    setMultiDishResult(null);
    setResult(null);

    try {
      const analysisResult = await analyzeMultipleDishes(dishes, allergies);
      setMultiDishResult(analysisResult);
      
      // Save each dish to backend
      if (user) {
        for (const dish of analysisResult.dishes) {
          try {
            await foodLogApi.createFoodLog({
              foodName: dish.foodName,
              calories: dish.calories,
              servingSize: dish.servingSize,
              nutrients: dish.nutrients,
              allergyWarnings: dish.allergyWarnings,
              confidence: dish.confidence,
              inputMethod: 'multi-dish',
              dishName: dish.userProvidedName || undefined,
              userAllergies: allergies,
              notes: `${dish.cuisineType} cuisine. ${dish.notes}`,
              healthyAlternatives: dish.healthyAlternatives,
              recipeLinks: dish.recipeLinks
            });
          } catch (saveErr) {
            console.error('Error saving dish to log:', saveErr);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze dishes');
      console.error('Multi-dish analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load food history
  const loadFoodHistory = async (page: number = 1, search: string = '') => {
    if (!user) return;
    
    setHistoryLoading(true);
    try {
      const response = await foodLogApi.getUserFoodLogs({
        page,
        limit: 20,
        searchQuery: search || undefined,
        sortBy: 'analyzedAt',
        sortOrder: 'desc'
      });
      
      setFoodHistory(response.foodLogs);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      console.error('Error loading food history:', err);
      setError('Failed to load food history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when switching to history view
  useEffect(() => {
    if (viewMode === 'history' && user) {
      loadFoodHistory(1, searchQuery);
    }
  }, [viewMode, user]);

  const handleReset = () => {
    setResult(null);
    setMultiDishResult(null);
    setError(null);
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen" style={{ 
      background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`
    }}>
      {/* Header */}
      <Header 
        title="Food Tracker"
        showBackButton
        showHomeButton
      />

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title and View Toggle */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 
                className="text-3xl font-bold mb-2"
                style={{ 
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading
                }}
              >
                AI Food & Nutrition Analysis
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                {viewMode === 'analyze' 
                  ? 'Upload food images or enter ingredients for comprehensive nutritional analysis with allergy detection'
                  : 'View your food tracking history'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('analyze')}
                className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                style={{
                  backgroundColor: viewMode === 'analyze' ? theme.colors.primary : theme.colors.surface,
                  color: viewMode === 'analyze' ? '#FFFFFF' : theme.colors.text,
                }}
              >
                <BarChart3 className="w-5 h-5" />
                Analyze Food
              </button>
              <button
                onClick={() => setViewMode('history')}
                className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                style={{
                  backgroundColor: viewMode === 'history' ? theme.colors.primary : theme.colors.surface,
                  color: viewMode === 'history' ? '#FFFFFF' : theme.colors.text,
                }}
              >
                <History className="w-5 h-5" />
                History
              </button>
            </div>
          </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 border rounded-lg p-4"
            style={{
              backgroundColor: theme.colors.error + '10',
              borderColor: theme.colors.error + '40'
            }}
          >
            <div>
              <h3 
                className="font-semibold"
                style={{ color: theme.colors.error }}
              >
                Error
              </h3>
              <p 
                className="text-sm mt-1"
                style={{ color: theme.colors.error }}
              >
                {error}
              </p>
              {error.includes('API key') && (
                <p 
                  className="text-xs mt-2"
                  style={{ color: theme.colors.error }}
                >
                  Add <code 
                    className="px-1 rounded"
                    style={{ backgroundColor: theme.colors.error + '20' }}
                  >VITE_GEMINI_API_KEY</code> to your .env file
                </p>
              )}
            </div>
          </div>
        )}

        {!result ? (
          <>
          {viewMode === 'history' ? (
            // History View
            <div 
              className="rounded-xl shadow-lg overflow-hidden border"
              style={{ 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border
              }}
            >
              {/* Search Bar */}
              <div className="p-6 border-b" style={{ borderColor: theme.colors.border }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.textSecondary }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      loadFoodHistory(1, e.target.value);
                    }}
                    placeholder="Search by food name..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    }}
                  />
                </div>
              </div>

              {/* History Content */}
              <div className="p-6">
                {historyLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
                  </div>
                ) : foodHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto mb-4" style={{ color: theme.colors.textSecondary }} />
                    <p style={{ color: theme.colors.textSecondary }}>
                      {searchQuery ? 'No food logs found matching your search.' : 'No food logs yet. Start analyzing food to build your history!'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Food History Items */}
                    <div className="space-y-4">
                      {foodHistory.map((log) => (
                        <div
                          key={log._id}
                          onClick={() => {
                            setResult(log);
                            setUploadedImage(log.imageUrl || null);
                            setViewMode('analyze');
                          }}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 
                                  className="text-lg font-bold"
                                  style={{ color: theme.colors.text }}
                                >
                                  {log.foodName}
                                </h3>
                                {log.inputMethod === 'multi-dish' && (
                                  <span 
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                                  >
                                    Multi-Dish
                                  </span>
                                )}
                              </div>
                              {log.dishName && (
                                <p 
                                  className="text-sm mb-2"
                                  style={{ color: theme.colors.textSecondary }}
                                >
                                  {log.dishName}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm">
                                <span style={{ color: theme.colors.primary }}>
                                  <strong>{log.calories}</strong> kcal
                                </span>
                                {log.nutrients?.protein > 0 && (
                                  <span style={{ color: theme.colors.text }}>
                                    Protein: {log.nutrients.protein}g
                                  </span>
                                )}
                                {log.nutrients?.carbs > 0 && (
                                  <span style={{ color: theme.colors.text }}>
                                    Carbs: {log.nutrients.carbs}g
                                  </span>
                                )}
                                {log.nutrients?.fat > 0 && (
                                  <span style={{ color: theme.colors.text }}>
                                    Fat: {log.nutrients.fat}g
                                  </span>
                                )}
                              </div>
                              {/* Allergy Warnings */}
                              {log.allergyWarnings?.detected?.length > 0 && (
                                <div 
                                  className="flex items-center gap-2 mt-2 px-2 py-1 rounded-md text-xs"
                                  style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                                >
                                  <span>⚠️ Contains: {log.allergyWarnings.detected.join(', ')}</span>
                                </div>
                              )}
                              <p 
                                className="text-xs mt-2"
                                style={{ color: theme.colors.textSecondary }}
                              >
                                {new Date(log.analyzedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {log.imageUrl && (
                              <img
                                src={log.imageUrl}
                                alt={log.foodName}
                                className="w-24 h-24 object-cover rounded-lg ml-4"
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-end mt-2">
                            <span 
                              className="text-xs flex items-center gap-1"
                              style={{ color: theme.colors.primary }}
                            >
                              View Details →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() => loadFoodHistory(currentPage - 1, searchQuery)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: currentPage === 1 ? theme.colors.surface : theme.colors.primary,
                            color: currentPage === 1 ? theme.colors.textSecondary : '#FFFFFF',
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <span style={{ color: theme.colors.text }}>
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => loadFoodHistory(currentPage + 1, searchQuery)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: currentPage === totalPages ? theme.colors.surface : theme.colors.primary,
                            color: currentPage === totalPages ? theme.colors.textSecondary : '#FFFFFF',
                          }}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            // Analysis View
          <div 
            className="rounded-xl shadow-lg overflow-hidden border"
            style={{ 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }}
          >
            {/* Tab Navigation */}
            <div 
              className="flex border-b"
              style={{ 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }}
            >
              <button
                onClick={() => setActiveTab('image')}
                className="flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === 'image' ? theme.colors.card : 'transparent',
                  color: activeTab === 'image' ? theme.colors.primary : theme.colors.textSecondary,
                  borderBottom: activeTab === 'image' ? `2px solid ${theme.colors.primary}` : 'none',
                  fontFamily: theme.fonts.heading
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'image') {
                    e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'image') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Camera className="w-5 h-5" />
                <span className="hidden sm:inline">Image Upload</span>
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className="flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === 'manual' ? theme.colors.card : 'transparent',
                  color: activeTab === 'manual' ? theme.colors.success : theme.colors.textSecondary,
                  borderBottom: activeTab === 'manual' ? `2px solid ${theme.colors.success}` : 'none',
                  fontFamily: theme.fonts.heading
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'manual') {
                    e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'manual') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Edit3 className="w-5 h-5" />
                <span className="hidden sm:inline">Manual Entry</span>
              </button>
              <button
                onClick={() => setActiveTab('multi')}
                className="flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === 'multi' ? theme.colors.card : 'transparent',
                  color: activeTab === 'multi' ? '#f59e0b' : theme.colors.textSecondary,
                  borderBottom: activeTab === 'multi' ? `2px solid #f59e0b` : 'none',
                  fontFamily: theme.fonts.heading
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'multi') {
                    e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'multi') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Utensils className="w-5 h-5" />
                <span className="hidden sm:inline">Multi-Dish</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'image' ? (
                <ImageUpload 
                  onImageUpload={handleImageUpload} 
                  loading={isLoading}
                  userAllergies={userAllergies}
                  userDietaryPreferences={userDietaryPreferences}
                />
              ) : activeTab === 'manual' ? (
                <ManualInput onAnalyze={handleManualAnalyze} loading={isLoading} />
              ) : (
                <MultiDishUpload 
                  onAnalyze={handleMultiDishAnalyze} 
                  loading={isLoading}
                  userAllergies={userAllergies}
                  userDietaryPreferences={userDietaryPreferences}
                />
              )}
            </div>
          </div>
          )}
          </>
        ) : multiDishResult ? (
          <div>
            <button
              onClick={handleReset}
              className="mb-6 px-6 py-3 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`
              }}
            >
              ← Analyze More Food
            </button>
            <MultiDishResult result={multiDishResult} />
          </div>
        ) : (
          <CalorieResult 
            result={result} 
            onReset={handleReset} 
            uploadedImage={uploadedImage}
          />
        )}

        {/* Info Card */}
        {!result && !multiDishResult && viewMode === 'analyze' && (
          <div 
            className="mt-8 rounded-xl shadow-lg p-6 border-t-4"
            style={{ 
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.primary
            }}
          >
            <h3 
              className="font-bold mb-4 flex items-center gap-2"
              style={{ 
                color: theme.colors.text,
                fontFamily: theme.fonts.heading
              }}
            >
              <span className="text-2xl">✨</span>
              <span>Enhanced Features</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Allergy Detection
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Select your allergies and get instant warnings
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Where to Buy
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Philippine stores (Lazada, Shopee, Puregold)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Full Nutrition Facts
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    15+ data points including vitamins and minerals
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">👨‍🍳</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Recipe Ideas
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Get recipe links and cooking suggestions
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Healthier Alternatives
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Discover better options with calorie savings
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Verified Data
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Cross-referenced with FatSecret API and USDA
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🇵🇭</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Filipino & Asian Cuisine
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Optimized for Adobo, Sinigang, Kare-Kare & more
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">📸</span>
                <div>
                  <h4 
                    className="font-semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Multi-Dish Analysis
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Upload multiple dishes with multiple angles for accuracy
                  </p>
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
