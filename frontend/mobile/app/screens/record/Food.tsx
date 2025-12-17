import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeFood, analyzeIngredients, FoodAnalysisResult } from '../../services/geminiService';
import { useTheme } from '../../context/ThemeContext';
import { foodLogApi } from '../../api/foodLogApi';
import { useUser } from '../../context/UserContext';
import { getUserAllergies, getTodayCalorieBalance } from '../../api/userApi';

const COMMON_ALLERGENS = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy',
  'Fish', 'Shellfish', 'Sesame', 'Gluten'
];

export default function Food() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'analyze' | 'history'>('analyze');
  const [inputMode, setInputMode] = useState<'image' | 'manual'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  
  // Image mode states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState('');
  
  // Manual mode states
  const [ingredients, setIngredients] = useState('');
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // History states
  const [foodHistory, setFoodHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Calorie balance state
  const [calorieBalance, setCalorieBalance] = useState<{
    goal_kcal: number;
    consumed_kcal: number;
    burned_kcal: number;
    net_kcal: number;
    status: string;
  } | null>(null);
  const [allergiesLoaded, setAllergiesLoaded] = useState(false);

  // Load user allergies from profile on mount
  useEffect(() => {
    const loadUserAllergies = async () => {
      if (!user || allergiesLoaded) return;
      
      try {
        const response = await getUserAllergies();
        const userAllergies = response.allergies || [];
        
        // Map user allergies to common allergens format and set selected
        const mappedAllergies = userAllergies.map((allergy: string) => {
          // Capitalize first letter to match COMMON_ALLERGENS format
          return allergy.charAt(0).toUpperCase() + allergy.slice(1).toLowerCase();
        });
        
        // Set common allergens that match user's allergies
        const commonMatches = COMMON_ALLERGENS.filter(a => 
          mappedAllergies.some((ua: string) => ua.toLowerCase() === a.toLowerCase())
        );
        
        // Set custom allergies (ones not in COMMON_ALLERGENS)
        const customMatches = mappedAllergies.filter((ua: string) => 
          !COMMON_ALLERGENS.some(a => a.toLowerCase() === ua.toLowerCase())
        );
        
        if (commonMatches.length > 0) {
          setSelectedAllergies(commonMatches);
        }
        if (customMatches.length > 0) {
          setCustomAllergies(customMatches.join(', '));
        }
        
        setAllergiesLoaded(true);
        console.log('[Food] Loaded user allergies:', userAllergies);
      } catch (error) {
        console.error('[Food] Error loading user allergies:', error);
      }
    };

    loadUserAllergies();
  }, [user]);

  // Load today's calorie balance
  useEffect(() => {
    const loadCalorieBalance = async () => {
      if (!user) return;
      
      try {
        const response = await getTodayCalorieBalance();
        if (response.entry) {
          setCalorieBalance(response.entry);
        }
      } catch (error) {
        console.error('[Food] Error loading calorie balance:', error);
      }
    };

    loadCalorieBalance();
  }, [user]);

  // Refresh calorie balance when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshOnFocus = async () => {
        if (!user) return;
        try {
          const response = await getTodayCalorieBalance();
          if (response.entry) {
            setCalorieBalance(response.entry);
          }
        } catch (error) {
          console.error('[Food] Error refreshing calorie balance on focus:', error);
        }
      };
      refreshOnFocus();
    }, [user])
  );

  // Refresh calorie balance after food log is saved
  const refreshCalorieBalance = async () => {
    try {
      const response = await getTodayCalorieBalance();
      if (response.entry) {
        setCalorieBalance(response.entry);
      }
    } catch (error) {
      console.error('[Food] Error refreshing calorie balance:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!permission) {
      // Camera permissions are still loading
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }
    }

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo) {
        // Manipulate image to reduce size and get base64
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }], // Resize to max width of 1024px
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        setImageUri(manipulatedImage.uri);
        setShowCamera(false);
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const closeCamera = () => {
    setShowCamera(false);
  };

  const toggleAllergy = (allergen: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
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
      Alert.alert('Error', 'Failed to load food history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFoodHistory(1, searchQuery);
    setRefreshing(false);
  };

  // Load history when switching to history view
  useEffect(() => {
    if (viewMode === 'history' && user) {
      loadFoodHistory(1, searchQuery);
    }
  }, [viewMode, user]);

  // Save food log to backend
  const saveFoodLog = async (analysisResult: FoodAnalysisResult, imageBase64?: string) => {
    if (!user) {
      console.log('No user logged in, skipping food log save');
      return;
    }

    try {
      const allergyList = [...selectedAllergies];
      if (customAllergies.trim()) {
        allergyList.push(...customAllergies.split(',').map(a => a.trim()).filter(a => a));
      }

      console.log('Attempting to save food log...');
      console.log('API Base URL:', process.env.EXPO_PUBLIC_API_URL);
      
      // Don't send base64 image if it's too large (over 10MB)
      let imageToSend = imageBase64;
      if (imageBase64) {
        const sizeInBytes = imageBase64.length * 0.75; // Approximate size
        const sizeInMB = sizeInBytes / (1024 * 1024);
        console.log(`Image size: ${sizeInMB.toFixed(2)} MB`);
        
        if (sizeInMB > 10) {
          console.log('Image too large, skipping image upload');
          imageToSend = undefined;
          Alert.alert('Note', 'Image is too large and was not saved. Food data saved successfully.');
        }
      }

      const response = await foodLogApi.createFoodLog({
        ...analysisResult,
        inputMethod: inputMode,
        imageBase64: imageToSend,
        dishName: dishName || undefined,
        userAllergies: allergyList,
        ingredientsList: inputMode === 'manual' ? ingredients : undefined
      });
      
      console.log('Food log saved successfully:', response);
      
      // Refresh calorie balance after saving food log
      await refreshCalorieBalance();
    } catch (err: any) {
      console.error('Error saving food log:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Show error to user if it's a network or server issue
      if (err.message?.includes('Network Error') || err.message?.includes('timeout')) {
        Alert.alert('Save Failed', 'Could not save to history. Please check your connection.');
      } else if (err.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in again to save your food logs.');
      } else if (err.response?.status >= 500) {
        Alert.alert('Server Error', 'Could not save to history. The analysis is still available above.');
      }
      // Don't block the user experience with save errors - they still have their analysis
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('No image', 'Please select an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allergyList = [...selectedAllergies];
      if (customAllergies.trim()) {
        allergyList.push(...customAllergies.split(',').map(a => a.trim()).filter(a => a));
      }

      // Get base64 data from image
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const analysis = await analyzeFood(base64data, 'image/jpeg', dishName, allergyList);
          setResult(analysis);
          
          // Save to backend
          if (user) {
            await saveFoodLog(analysis, base64data);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to analyze the image.');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setError(err.message || 'Failed to process the image.');
      setLoading(false);
    }
  };

  const handleAnalyzeIngredients = async () => {
    if (!ingredients.trim()) {
      Alert.alert('No ingredients', 'Please enter some ingredients first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allergyList = [...selectedAllergies];
      if (customAllergies.trim()) {
        allergyList.push(...customAllergies.split(',').map(a => a.trim()).filter(a => a));
      }

      const analysis = await analyzeIngredients(ingredients, dishName, allergyList);
      setResult(analysis);
      
      // Save to backend
      if (user) {
        await saveFoodLog(analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze ingredients.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setImageUri(null);
    setDishName('');
    setIngredients('');
  };

  const getPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const NutrientBar = ({ label, value, unit, max, color = '#3b82f6' }: {
    label: string;
    value: number;
    unit: string;
    max: number;
    color?: string;
  }) => {
    const percentage = getPercentage(value, max);
    return (
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{label}</Text>
          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{value}{unit}</Text>
        </View>
        <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
          <View
            style={{ width: `${percentage}%`, backgroundColor: color }}
            className="h-full rounded-full"
          />
        </View>
      </View>
    );
  };

  if (result) {
    return (
      <>
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
        <View className="px-6 pt-3">
          <TouchableOpacity onPress={() => router.replace("/screens/record/Food")} className="flex-row items-center mb-4">
            <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
            <Text
              className="ml-2"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.xl,
                lineHeight: theme.fontSizes.xl * 1.2,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>
      <ScrollView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
        <View className="p-4">
          <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}>
            <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl, color: theme.colors.text }} className="mb-2">Analysis Results</Text>
            <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.lg, color: theme.colors.primary }}>{result.foodName}</Text>
            
            {result.brandedProduct?.isBranded && (
              <View className="mt-2 px-3 py-2 rounded-full inline-flex flex-row items-center" style={{ backgroundColor: theme.colors.accent + '33' }}>
                <Text className="text-lg mr-1">🏷️</Text>
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.accent }}>
                  {result.brandedProduct.brandName && result.brandedProduct.productName
                    ? `${result.brandedProduct.brandName} - ${result.brandedProduct.productName}`
                    : result.brandedProduct.brandName || result.brandedProduct.productName || 'Branded Product'}
                </Text>
              </View>
            )}
          </View>

          {imageUri && (
            <View className="mb-4 rounded-lg overflow-hidden" style={{ borderWidth: 2, borderColor: theme.colors.primary }}>
              <Image source={{ uri: imageUri }} className="w-full h-48" resizeMode="cover" />
            </View>
          )}

          {result.allergyWarnings?.detected?.length > 0 && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#fee2e2', borderLeftWidth: 4, borderLeftColor: '#ef4444' }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: '#b91c1c' }} className="mb-2">⚠️ Allergy Warning</Text>
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: '#7f1d1d' }} className="mb-2">{result.allergyWarnings.warning}</Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: '#991b1b' }} className="mb-1">Detected allergens:</Text>
              {result.allergyWarnings.detected.map((allergen, index) => (
                <Text key={index} style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: '#b91c1c' }} className="ml-2">• {allergen}</Text>
              ))}
            </View>
          )}

          <View className="rounded-lg p-6 mb-4 items-center" style={{ backgroundColor: theme.colors.surface }}>
            <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.lg, color: theme.colors.text }} className="mb-2">Calories</Text>
            <View className="w-32 h-32 rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.colors.background, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: 40, color: theme.colors.primary }}>{result.calories}</Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>kcal</Text>
            </View>
            {result.servingSize && (
              <View className="mt-2">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Serving Size</Text>
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.servingSize}</Text>
              </View>
            )}
          </View>

          {result.nutrients && Object.keys(result.nutrients).length > 0 && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }} className="mb-4">Nutrition Facts</Text>
              
              {result.nutrients.protein! > 0 && (
                <NutrientBar label="Protein" value={result.nutrients.protein!} unit="g" max={50} color="#3b82f6" />
              )}
              {result.nutrients.carbs! > 0 && (
                <NutrientBar label="Carbs" value={result.nutrients.carbs!} unit="g" max={300} color="#8b5cf6" />
              )}
              {result.nutrients.fat! > 0 && (
                <NutrientBar label="Fat" value={result.nutrients.fat!} unit="g" max={78} color="#ec4899" />
              )}
              {result.nutrients.fiber! > 0 && (
                <NutrientBar label="Fiber" value={result.nutrients.fiber!} unit="g" max={28} color="#10b981" />
              )}

              <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: theme.colors.secondary + '33' }}>
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="mb-3">Complete Nutritional Information</Text>
                {result.calories > 0 && (
                  <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Calories</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.calories} kcal</Text>
                  </View>
                )}
                {result.nutrients.fat! > 0 && (
                  <>
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Total Fat</Text>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.fat}g</Text>
                    </View>
                    {result.nutrients.saturatedFat! > 0 && (
                      <View className="flex-row justify-between py-2 pl-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Saturated Fat</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.saturatedFat}g</Text>
                      </View>
                    )}
                    {result.nutrients.transFat! > 0 && (
                      <View className="flex-row justify-between py-2 pl-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Trans Fat</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.transFat}g</Text>
                      </View>
                    )}
                  </>
                )}
                {result.nutrients.cholesterol! > 0 && (
                  <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Cholesterol</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.cholesterol}mg</Text>
                  </View>
                )}
                {result.nutrients.sodium! > 0 && (
                  <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Sodium</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.sodium}mg</Text>
                  </View>
                )}
                {result.nutrients.potassium! > 0 && (
                  <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Potassium</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.potassium}mg</Text>
                  </View>
                )}
                {result.nutrients.carbs! > 0 && (
                  <>
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Total Carbohydrate</Text>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.carbs}g</Text>
                    </View>
                    {result.nutrients.fiber! > 0 && (
                      <View className="flex-row justify-between py-2 pl-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Dietary Fiber</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.fiber}g</Text>
                      </View>
                    )}
                    {result.nutrients.sugar! > 0 && (
                      <View className="flex-row justify-between py-2 pl-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Total Sugars</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.sugar}g</Text>
                      </View>
                    )}
                  </>
                )}
                {result.nutrients.protein! > 0 && (
                  <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Protein</Text>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.protein}g</Text>
                  </View>
                )}
              </View>

              {(result.nutrients.vitaminA || result.nutrients.vitaminC || 
                result.nutrients.vitaminD || result.nutrients.calcium || 
                result.nutrients.iron) && (
                <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: theme.colors.secondary + '33' }}>
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="mb-3">Vitamins & Minerals (% Daily Value)</Text>
                  {result.nutrients.vitaminA! > 0 && (
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Vitamin A</Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.vitaminA}%</Text>
                    </View>
                  )}
                  {result.nutrients.vitaminC! > 0 && (
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Vitamin C</Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.vitaminC}%</Text>
                    </View>
                  )}
                  {result.nutrients.vitaminD! > 0 && (
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Vitamin D</Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.vitaminD}%</Text>
                    </View>
                  )}
                  {result.nutrients.calcium! > 0 && (
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Calcium</Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.calcium}%</Text>
                    </View>
                  )}
                  {result.nutrients.iron! > 0 && (
                    <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Iron</Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.iron}%</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {result.brandedProduct?.isBranded && result.brandedProduct?.ingredients && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }} className="mb-2">📋 Ingredients</Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.brandedProduct.ingredients}</Text>
            </View>
          )}

          {result.brandedProduct?.isBranded && result.brandedProduct?.purchaseLinks && (
            Object.values(result.brandedProduct.purchaseLinks).some(link => link) && (
              <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface }}>
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }} className="mb-3">🛒 Where to Buy</Text>
                <View className="space-y-2">
                  {result.brandedProduct.purchaseLinks.lazada && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(result.brandedProduct.purchaseLinks.lazada!)}
                      className="px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                      style={{ backgroundColor: '#ff6700' }}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>🛍️ Lazada</Text>
                      <Text style={{ color: '#FFFFFF' }}>→</Text>
                    </TouchableOpacity>
                  )}
                  {result.brandedProduct.purchaseLinks.shopee && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(result.brandedProduct.purchaseLinks.shopee!)}
                      className="px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                      style={{ backgroundColor: '#ee4d2d' }}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>🛍️ Shopee</Text>
                      <Text style={{ color: '#FFFFFF' }}>→</Text>
                    </TouchableOpacity>
                  )}
                  {result.brandedProduct.purchaseLinks.puregold && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(result.brandedProduct.purchaseLinks.puregold!)}
                      className="px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                      style={{ backgroundColor: '#16a34a' }}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>🛍️ Puregold</Text>
                      <Text style={{ color: '#FFFFFF' }}>→</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          )}

          {result.recipeLinks?.length > 0 && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }} className="mb-3">👨‍🍳 Recipe Ideas</Text>
              {result.recipeLinks.map((recipe, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(recipe.url)}
                  className="px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                  style={{ backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.secondary + '33' }}
                >
                  <View className="flex-1">
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{recipe.title}</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.secondary }}>{recipe.source}</Text>
                  </View>
                  <Text style={{ color: theme.colors.primary }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {result.nutritionSources?.length > 0 && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }} className="mb-2">🔍 Nutrition Data Sources</Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.secondary }} className="mb-3">Cross-referenced from:</Text>
              {result.nutritionSources.map((source, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(source.url)}
                  className="px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                  style={{ backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.secondary + '33' }}
                >
                  <View className="flex-1">
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{source.source}</Text>
                    <Text className="text-xs mt-1" style={{
                      color: source.reliability === 'high' ? '#16a34a' :
                             source.reliability === 'medium' ? '#ca8a04' :
                             theme.colors.secondary
                    }}>
                      {source.reliability === 'high' ? '✓ High' :
                       source.reliability === 'medium' ? '◐ Medium' :
                       '○ Low'} Reliability
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.primary }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {result.allergyWarnings?.mayContain?.length > 0 && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#fef3c7' }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: '#92400e' }} className="mb-2">⚠️ May Contain</Text>
              <View className="flex-row flex-wrap">
                {result.allergyWarnings.mayContain.map((allergen, index) => (
                  <View key={index} className="px-3 py-1 rounded-full mr-2 mb-2" style={{ backgroundColor: '#fde68a' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: '#92400e' }}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {result.healthyAlternatives?.length > 0 && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#dcfce7' }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: '#166534' }} className="mb-3">💡 Healthier Alternatives</Text>
              {result.healthyAlternatives.map((alt, index) => (
                <View key={index} className="rounded-lg p-3 mb-3" style={{ backgroundColor: theme.colors.background, borderWidth: 1, borderColor: '#86efac' }}>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="flex-1">{alt.name}</Text>
                    {alt.caloriesSaved > 0 && (
                      <View className="px-2 py-1 rounded" style={{ backgroundColor: '#bbf7d0' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: '#166534' }}>-{alt.caloriesSaved} kcal</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{alt.reason}</Text>
                </View>
              ))}
            </View>
          )}

          {result.confidence && (
            <View className="mb-4">
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
                Confidence: <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.text }}>{result.confidence}</Text>
              </Text>
            </View>
          )}

          {result.notes && (
            <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.primary + '22' }}>
              <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.primary }} className="mb-2">ℹ️ Additional Notes</Text>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.notes}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleReset}
            className="py-4 rounded-lg items-center mb-6"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Analyze Another Food</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={closeCamera}
      >
        <View className="flex-1 bg-black">
          <CameraView
            ref={cameraRef}
            className="flex-1"
            facing={facing}
          >
            {/* Top controls */}
            <View className="absolute top-0 left-0 right-0 p-4 flex-row justify-between items-center">
              <TouchableOpacity
                onPress={closeCamera}
                className="bg-black/50 rounded-full p-3"
              >
                <Text className="text-white text-lg font-bold">✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleCameraFacing}
                className="bg-black/50 rounded-full p-3"
              >
                <Text className="text-white text-lg">🔄</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom capture button */}
            <View className="absolute bottom-0 left-0 right-0 p-8 items-center">
              <TouchableOpacity
                onPress={capturePhoto}
                className="bg-white rounded-full w-20 h-20 border-4 border-gray-300 items-center justify-center"
              >
                <View className="bg-white rounded-full w-16 h-16" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
      </SafeAreaView>
      </>
    );
  }

  return (
    <>
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="px-6 pt-3">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
          <Text
            className="ml-2"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              lineHeight: theme.fontSizes.xl * 1.2,
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
      </View>
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: theme.colors.background }}
      refreshControl={
        viewMode === 'history' ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <View className="rounded-b-2xl p-6">
        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 28, color: theme.colors.primary }} className="mb-2">Food Calorie Tracker</Text>
        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, color: theme.colors.text + 'CC' }} className="mb-4">
          {viewMode === 'analyze' ? 'Upload a food image or enter ingredients manually' : 'View your food tracking history'}
        </Text>
        
        {/* Daily Calorie Balance Display */}
        {calorieBalance && viewMode === 'analyze' && (
          <View className="rounded-lg p-4 mb-4" style={{ 
            backgroundColor: theme.colors.surface, 
            borderLeftWidth: 4, 
            borderLeftColor: calorieBalance.status === 'under' ? '#22c55e' : 
                            calorieBalance.status === 'over' ? '#ef4444' : theme.colors.primary 
          }}>
            <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="mb-2">
              Today's Calorie Balance
            </Text>
            <View className="flex-row justify-between items-center">
              <View className="items-center flex-1">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '99' }}>Goal</Text>
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }}>
                  {calorieBalance.goal_kcal}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '99' }}>Consumed</Text>
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: '#f97316' }}>
                  +{calorieBalance.consumed_kcal}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '99' }}>Burned</Text>
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: '#22c55e' }}>
                  -{calorieBalance.burned_kcal}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '99' }}>Remaining</Text>
                <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: 
                  calorieBalance.goal_kcal - calorieBalance.net_kcal > 0 ? '#22c55e' : '#ef4444' 
                }}>
                  {calorieBalance.goal_kcal - calorieBalance.net_kcal}
                </Text>
              </View>
            </View>
            {/* Progress bar */}
            <View className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
              <View 
                style={{ 
                  width: `${Math.min((calorieBalance.net_kcal / calorieBalance.goal_kcal) * 100, 100)}%`,
                  backgroundColor: calorieBalance.status === 'under' ? '#22c55e' : 
                                  calorieBalance.status === 'over' ? '#ef4444' : theme.colors.primary
                }} 
                className="h-full rounded-full"
              />
            </View>
            <Text className="mt-2 text-center" style={{ 
              fontFamily: theme.fonts.body, 
              fontSize: theme.fontSizes.xs, 
              color: calorieBalance.status === 'under' ? '#22c55e' : 
                    calorieBalance.status === 'over' ? '#ef4444' : theme.colors.primary 
            }}>
              {calorieBalance.status === 'under' ? '✓ Under budget' : 
               calorieBalance.status === 'over' ? '⚠ Over budget' : '✓ On target'}
            </Text>
          </View>
        )}
        
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setViewMode('analyze')}
            className="flex-1 py-3 rounded-lg"
            style={{ backgroundColor: viewMode === 'analyze' ? theme.colors.primary : theme.colors.secondary + '66' }}
          >
            <Text className="text-center" style={{
              fontFamily: theme.fonts.bodyBold,
              fontSize: theme.fontSizes.base,
              color: viewMode === 'analyze' ? '#FFFFFF' : '#FFFFFF'
            }}>
              Analyze Food
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('history')}
            className="flex-1 py-3 rounded-lg"
            style={{ backgroundColor: viewMode === 'history' ? theme.colors.primary : theme.colors.secondary + '66' }}
          >
            <Text className="text-center" style={{
              fontFamily: theme.fonts.bodyBold,
              fontSize: theme.fontSizes.base,
              color: viewMode === 'history' ? '#FFFFFF' : '#FFFFFF'
            }}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'analyze' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setInputMode('image')}
              className="flex-1 py-3 rounded-lg"
              style={{ backgroundColor: inputMode === 'image' ? theme.colors.primary : theme.colors.secondary + '66' }}
            >
              <Text className="text-center" style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.base,
                color: inputMode === 'image' ? '#FFFFFF' : '#FFFFFF'
              }}>
                Upload Image
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setInputMode('manual')}
              className="flex-1 py-3 rounded-lg"
              style={{ backgroundColor: inputMode === 'manual' ? theme.colors.primary : theme.colors.secondary + '66' }}
            >
              <Text className="text-center" style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.base,
                color: inputMode === 'manual' ? '#FFFFFF' : '#FFFFFF'
              }}>
                Manual Input
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="p-4">
        {viewMode === 'history' ? (
          // History View
          <>
            <View className="mb-4">
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.length === 0 || text.length >= 3) {
                    loadFoodHistory(1, text);
                  }
                }}
                placeholder="Search by food name..."
                placeholderTextColor={theme.colors.text + '77'}
                className="rounded-lg px-4 py-3"
                style={{ 
                  borderWidth: 1, 
                  borderColor: theme.colors.secondary + '55', 
                  color: theme.colors.text, 
                  fontFamily: theme.fonts.body, 
                  fontSize: theme.fontSizes.base, 
                  backgroundColor: theme.colors.input 
                }}
              />
            </View>

            {historyLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : foodHistory.length === 0 ? (
              <View className="items-center py-8">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, color: theme.colors.text }}>
                  No food logs yet. Start by analyzing your first meal!
                </Text>
              </View>
            ) : (
              <>
                {foodHistory.map((log) => (
                  <TouchableOpacity
                    key={log._id}
                    onPress={() => {
                      setResult(log);
                      setViewMode('analyze');
                    }}
                    className="rounded-lg p-4 mb-3"
                    style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.secondary + '33' }}
                  >
                    <View className="flex-row">
                      {log.imageUrl && (
                        <Image 
                          source={{ uri: log.imageUrl }} 
                          className="w-20 h-20 rounded-lg mr-3" 
                          resizeMode="cover"
                        />
                      )}
                      <View className="flex-1">
                        <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg, color: theme.colors.text }} numberOfLines={1}>
                          {log.dishName || log.foodName}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + "CC"}} className="mt-1">
                          {log.calories} kcal • {log.servingSize}
                        </Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + "CC"}} className="mt-1">
                          {new Date(log.analyzedAt).toLocaleDateString()} {new Date(log.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    {log.allergyWarnings?.detected?.length > 0 && (
                      <View className="mt-2 px-2 py-1 rounded" style={{ backgroundColor: '#fee2e2' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: '#991b1b' }}>
                          ⚠️ Contains: {log.allergyWarnings.detected.join(', ')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {totalPages > 1 && (
                  <View className="flex-row justify-center items-center gap-2 mt-4">
                    <TouchableOpacity
                      onPress={() => loadFoodHistory(currentPage - 1, searchQuery)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: currentPage === 1 ? theme.colors.secondary + '33' : theme.colors.primary,
                        opacity: currentPage === 1 ? 0.5 : 1
                      }}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: '#FFFFFF' }}>
                        Previous
                      </Text>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <TouchableOpacity
                      onPress={() => loadFoodHistory(currentPage + 1, searchQuery)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: currentPage === totalPages ? theme.colors.secondary + '33' : theme.colors.primary,
                        opacity: currentPage === totalPages ? 0.5 : 1
                      }}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: '#FFFFFF' }}>
                        Next
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          // Analysis View (existing code)
          <>
        {error && (
          <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' }}>
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: '#991b1b' }}>{error}</Text>
          </View>
        )}

        <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.secondary + '33' }}>
          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="mb-3">
            {inputMode === 'image' ? 'Upload Food Image' : 'Enter Ingredients'}
          </Text>

          <View className="mb-4">
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }} className="mb-2">Dish Name (Optional)</Text>
            <TextInput
              value={dishName}
              onChangeText={setDishName}
              placeholder="e.g., Grilled Chicken Salad"
              placeholderTextColor={theme.colors.text + '77'}
              className="rounded-lg px-4 py-3"
              style={{ borderWidth: 1, borderColor: theme.colors.secondary + '55', color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, backgroundColor: theme.colors.input }}
              editable={!loading}
            />
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.secondary }} className="mt-1">Help AI identify your food more accurately</Text>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Allergies & Dietary Restrictions (Optional)</Text>
              {allergiesLoaded && selectedAllergies.length > 0 && (
                <View className="px-2 py-1 rounded" style={{ backgroundColor: theme.colors.primary + '22' }}>
                  <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.primary }}>
                    From profile
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row flex-wrap mb-2">
              {COMMON_ALLERGENS.map(allergen => (
                <TouchableOpacity
                  key={allergen}
                  onPress={() => toggleAllergy(allergen)}
                  disabled={loading}
                  className="px-3 py-2 rounded-full mr-2 mb-2"
                  style={{
                    backgroundColor: selectedAllergies.includes(allergen)
                      ? theme.colors.primary
                      : theme.colors.background
                  }}
                >
                  <Text style={{
                    fontFamily: selectedAllergies.includes(allergen) ? theme.fonts.bodyBold : theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: selectedAllergies.includes(allergen) ? '#FFFFFF' : theme.colors.text
                  }}>
                    {allergen}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={customAllergies}
              onChangeText={setCustomAllergies}
              placeholder="Other allergies (comma-separated)"
              placeholderTextColor={theme.colors.text + '77'}
              className="rounded-lg px-4 py-3"
              style={{ borderWidth: 1, borderColor: theme.colors.secondary + '55', color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, backgroundColor: theme.colors.input }}
              editable={!loading}
            />
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.secondary }} className="mt-1">We'll check for allergens and warn you</Text>
          </View>

          {inputMode === 'image' ? (
            <>
              {imageUri ? (
                <View className="mb-4">
                  <Image source={{ uri: imageUri }} className="w-full h-64 rounded-lg mb-3" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setImageUri(null)}
                    className="py-2 rounded-lg"
                    style={{ backgroundColor: theme.colors.background }}
                    disabled={loading}
                  >
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="text-center">Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="rounded-lg p-8 items-center mb-4" style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: theme.colors.secondary + '66' }}>
                  <Text className="text-6xl mb-3">📷</Text>
                  <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, color: theme.colors.text }} className="mb-4 text-center">Take a photo or choose from gallery</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={takePhoto}
                      className="px-6 py-3 rounded-lg"
                      style={{ backgroundColor: theme.colors.primary }}
                      disabled={loading}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={pickImage}
                      className="px-6 py-3 rounded-lg"
                      style={{ backgroundColor: theme.colors.primary }}
                      disabled={loading}
                    >
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Choose Image</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.secondary }} className="mt-3">Supports: JPG, PNG (Max 10MB)</Text>
                </View>
              )}

              {imageUri && (
                <TouchableOpacity
                  onPress={handleAnalyzeImage}
                  disabled={loading}
                  className="py-4 rounded-lg items-center"
                  style={{ backgroundColor: loading ? theme.colors.primary + '77' : theme.colors.primary }}
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="white" className="mr-2" />
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Analyzing...</Text>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Analyze Image</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View className="mb-4">
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }} className="mb-2">Ingredients & Quantities</Text>
                <TextInput
                  value={ingredients}
                  onChangeText={setIngredients}
                  placeholder={'Example:\n2 eggs\n1 cup rice\n100g chicken breast\n1 tablespoon olive oil\n1/2 avocado'}
                  placeholderTextColor={theme.colors.text + '77'}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  className="rounded-lg px-4 py-3 h-40"
                  style={{ borderWidth: 1, borderColor: theme.colors.secondary + '55', color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base, backgroundColor: theme.colors.input }}
                  editable={!loading}
                />
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.secondary }} className="mt-1">Be specific with quantities for accurate estimates</Text>
              </View>

              <TouchableOpacity
                onPress={handleAnalyzeIngredients}
                disabled={loading || !ingredients.trim()}
                className="py-4 rounded-lg items-center"
                style={{ backgroundColor: (loading || !ingredients.trim()) ? theme.colors.primary + '77' : theme.colors.primary }}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="white" className="mr-2" />
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Analyzing...</Text>
                  </View>
                ) : (
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>Analyze Ingredients</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="items-center py-4">
          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.secondary }}>Powered by Google Gemini AI</Text>
        </View>
          </>
        )}
      </View>
    </ScrollView>

    {/* Camera Modal */}
    <Modal
      visible={showCamera}
      animationType="slide"
      onRequestClose={closeCamera}
    >
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing={facing}
        />
        
        {/* Top controls */}
        <View className="absolute top-0 left-0 right-0 p-4 flex-row justify-between items-center" style={{ zIndex: 1 }}>
          <TouchableOpacity
            onPress={closeCamera}
            className="bg-black/50 rounded-full p-3"
          >
            <Text className="text-white text-lg font-bold">✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleCameraFacing}
            className="bg-black/50 rounded-full p-3"
          >
            <Text className="text-white text-lg">🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom capture button */}
        <View className="absolute bottom-0 left-0 right-0 p-8 items-center" style={{ zIndex: 1 }}>
          <TouchableOpacity
            onPress={capturePhoto}
            className="bg-white rounded-full w-20 h-20 border-4 border-gray-300 items-center justify-center"
          >
            <View className="bg-white rounded-full w-16 h-16" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
    </>
  );
}