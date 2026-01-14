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
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeFood, analyzeIngredients, analyzeMultipleDishes, FoodAnalysisResult, DishEntry, MultiDishAnalysisResult } from '../../services/geminiService';
import { useTheme } from '../../context/ThemeContext';
import { foodLogApi } from '../../api/foodLogApi';
import { useUser } from '../../context/UserContext';
import { getUserAllergies, getTodayCalorieBalance, getUserProfile } from '../../api/userApi';
import { sendCalorieReminder, configureNotifications } from '@/utils/calorieNotifications';
import BatteryAnimate from '../../components/animation/battery';
import GamificationLoading from '../../components/animation/gamification-loading';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced allergens list including Filipino and Asian cuisine-specific allergens
const COMMON_ALLERGENS = [
  // Standard allergens
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy',
  'Fish', 'Shellfish', 'Sesame', 'Gluten',
  // Filipino/Asian specific
  'Shrimp Paste (Bagoong)', 'Fish Sauce (Patis)', 'Coconut',
  'Crab', 'Squid', 'MSG', 'Oyster Sauce', 'Fermented Soy'
];

// Popular Filipino and Asian dishes for suggestions
const FILIPINO_DISHES = [
  'Adobo', 'Sinigang', 'Kare-Kare', 'Lechon', 'Lumpia', 'Pancit',
  'Sisig', 'Bulalo', 'Tinola', 'Bicol Express', 'Laing', 'Pinakbet',
  'Kaldereta', 'Bistek Tagalog', 'Palabok', 'Arroz Caldo', 'Halo-Halo'
];

const ASIAN_DISHES = [
  'Ramen', 'Sushi', 'Tempura', 'Bibimbap', 'Bulgogi', 'Kimchi',
  'Dim Sum', 'Fried Rice', 'Pad Thai', 'Tom Yum', 'Pho', 'Banh Mi'
];

// Serving sizes for multi-dish upload
const SERVING_SIZES = [
  'Small (1/2 cup / 100g)',
  'Regular (1 cup / 200g)',
  'Large (1.5 cups / 300g)',
  'Extra Large (2 cups / 400g)',
  'Sharing Size (3+ cups)',
  'Individual Pack',
  'Family Size'
];

// Mini Calorie Progress Component (Simplified)
const MiniCalorieProgress = ({
  calorieBalance,
  theme
}: {
  calorieBalance: { consumed_kcal: number; goal_kcal: number; burned_kcal: number; status: string } | null;
  theme: any;
}) => {
  if (!calorieBalance) return null;

  const percentage = Math.min((calorieBalance.consumed_kcal / calorieBalance.goal_kcal) * 100, 100);
  const statusColor = calorieBalance.status === 'under' ? '#22c55e' :
    calorieBalance.status === 'over' ? '#ef4444' : theme.colors.primary;
  const remaining = Math.max(0, calorieBalance.goal_kcal - calorieBalance.consumed_kcal + calorieBalance.burned_kcal);

  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }}>
      {/* Mini circular indicator */}
      <View style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: statusColor + '15',
        borderWidth: 4,
        borderColor: statusColor,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}>
        <Text style={{
          fontFamily: theme.fonts.heading,
          fontSize: 14,
          color: statusColor
        }}>
          {Math.round(percentage)}%
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontFamily: theme.fonts.bodyBold,
            fontSize: 14,
            color: theme.colors.text
          }}>
            {calorieBalance.consumed_kcal} / {calorieBalance.goal_kcal} kcal
          </Text>
          <View style={{
            backgroundColor: statusColor + '15',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
          }}>
            <Text style={{
              fontFamily: theme.fonts.body,
              fontSize: 10,
              color: statusColor
            }}>
              {calorieBalance.status === 'under' ? 'On Track' :
                calorieBalance.status === 'over' ? 'Over' : 'Perfect'}
            </Text>
          </View>
        </View>

        {/* Mini progress bar */}
        <View style={{
          height: 6,
          backgroundColor: theme.colors.background,
          borderRadius: 3,
          marginTop: 8,
          overflow: 'hidden',
        }}>
          <View style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: statusColor,
            borderRadius: 3,
          }} />
        </View>

        <Text style={{
          fontFamily: theme.fonts.body,
          fontSize: 11,
          color: theme.colors.text + '77',
          marginTop: 6,
        }}>
          {remaining} kcal remaining
        </Text>
      </View>
    </View>
  );
};

// Macro Stat Card Component (for results view)
const StatCard = ({
  icon,
  label,
  value,
  color,
  theme,
  suffix = '',
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  theme: any;
  suffix?: string;
}) => (
  <View style={{
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }}>
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: color + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    }}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
    </View>
    <Text style={{
      fontFamily: theme.fonts.heading,
      fontSize: theme.fontSizes.lg,
      color: theme.colors.text
    }}>
      {value}{suffix}
    </Text>
    <Text style={{
      fontFamily: theme.fonts.body,
      fontSize: theme.fontSizes.xs,
      color: theme.colors.text + '77',
      marginTop: 2,
      textAlign: 'center',
    }}>
      {label}
    </Text>
  </View>
);

// Quick Action Button Component
const QuickActionButton = ({
  icon,
  label,
  onPress,
  color,
  theme,
  disabled = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  theme: any;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={{
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 6,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: color + '30',
      opacity: disabled ? 0.5 : 1,
    }}
    activeOpacity={0.7}
  >
    <View style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: color + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    }}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    </View>
    <Text style={{
      fontFamily: theme.fonts.bodyBold,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.text,
      textAlign: 'center',
    }}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function Food() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'analyze' | 'history'>('analyze');
  const [inputMode, setInputMode] = useState<'image' | 'manual' | 'multi'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [isLogged, setIsLogged] = useState(false); // Track if current result is logged

  // Image mode states
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [showDishSuggestions, setShowDishSuggestions] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState('');

  // Manual mode states
  const [ingredients, setIngredients] = useState('');

  // Multi-dish mode states
  const [multiDishes, setMultiDishes] = useState<DishEntry[]>([
    { id: '1', uri: null, base64: null, dishName: '', servingSize: 'Regular (1 cup / 200g)', additionalImages: [] }
  ]);
  const [multiDishResult, setMultiDishResult] = useState<MultiDishAnalysisResult | null>(null);
  const [currentMultiDishId, setCurrentMultiDishId] = useState<string | null>(null);
  const [addingAdditionalImage, setAddingAdditionalImage] = useState(false);

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

  // Battery animation state
  const [showBatteryAnimation, setShowBatteryAnimation] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [batteryAnimationData, setBatteryAnimationData] = useState<{
    previousValue: number;
    newValue: number;
    label: string;
  }>({ previousValue: 0, newValue: 0, label: 'Nutrition' });

  // Configure notifications on component mount
  useEffect(() => {
    configureNotifications();
  }, []);

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
      console.log('[Food] Refreshing calorie balance...');
      const response = await getTodayCalorieBalance();
      console.log('[Food] Calorie balance response:', response);

      if (response.entry) {
        console.log('[Food] Setting calorie balance:', response.entry);
        setCalorieBalance(response.entry);

        // Send calorie reminder notification after refreshing
        console.log('[Food] Sending calorie reminder with data:', response.entry);
        await sendCalorieReminder(response.entry);
      } else {
        console.log('[Food] No entry in calorie balance response');
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
        base64: true,
      });

      if (photo) {
        // Manipulate image to reduce size and get base64
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1024 } }], // Resize to max width of 1024px
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        // Check if this is for multi-dish mode
        if (currentMultiDishId) {
          const dishId = currentMultiDishId;
          const isAdditional = addingAdditionalImage;
          
          if (isAdditional) {
            // Add as additional image
            const dish = multiDishes.find(d => d.id === dishId);
            if (dish && dish.additionalImages.length >= 4) {
              Alert.alert('Maximum Limit', 'Maximum 5 images per dish (1 main + 4 additional)');
            } else {
              setMultiDishes(multiDishes.map(d =>
                d.id === dishId
                  ? { ...d, additionalImages: [...d.additionalImages, { uri: manipulatedImage.uri, base64: manipulatedImage.base64 || '' }] }
                  : d
              ));
            }
          } else {
            // Set as main image
            setMultiDishes(multiDishes.map(d =>
              d.id === dishId
                ? { ...d, uri: manipulatedImage.uri, base64: manipulatedImage.base64 || '' }
                : d
            ));
          }
          
          // Reset multi-dish camera state
          setCurrentMultiDishId(null);
          setAddingAdditionalImage(false);
        } else {
          // Regular single image mode
          setImageUri(manipulatedImage.uri);
        }
        
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
    // Reset multi-dish camera state if closing without capturing
    setCurrentMultiDishId(null);
    setAddingAdditionalImage(false);
  };

  const toggleAllergy = (allergen: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  // Multi-dish helper functions
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addDish = () => {
    if (multiDishes.length >= 10) {
      Alert.alert('Maximum Limit', 'Maximum 10 dishes allowed per analysis');
      return;
    }
    setMultiDishes([...multiDishes, {
      id: generateId(),
      uri: null,
      base64: null,
      dishName: '',
      servingSize: 'Regular (1 cup / 200g)',
      additionalImages: []
    }]);
  };

  const removeDish = (id: string) => {
    if (multiDishes.length <= 1) return;
    setMultiDishes(multiDishes.filter(d => d.id !== id));
  };

  const updateMultiDishName = (id: string, name: string) => {
    setMultiDishes(multiDishes.map(d => d.id === id ? { ...d, dishName: name } : d));
  };

  const updateMultiDishServingSize = (id: string, size: string) => {
    setMultiDishes(multiDishes.map(d => d.id === id ? { ...d, servingSize: size } : d));
  };

  const takeMultiDishPhoto = async (dishId: string, isAdditional: boolean = false) => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }
    }

    // Store which dish we're capturing for
    setCurrentMultiDishId(dishId);
    setAddingAdditionalImage(isAdditional);
    setShowCamera(true);
  };

  const pickMultiDishImage = async (dishId: string, isAdditional: boolean = false) => {
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
      const { uri, base64 } = result.assets[0];
      
      if (isAdditional) {
        // Add as additional image
        const dish = multiDishes.find(d => d.id === dishId);
        if (dish && dish.additionalImages.length >= 4) {
          Alert.alert('Maximum Limit', 'Maximum 5 images per dish (1 main + 4 additional)');
          return;
        }
        setMultiDishes(multiDishes.map(d =>
          d.id === dishId
            ? { ...d, additionalImages: [...d.additionalImages, { uri, base64: base64 || '' }] }
            : d
        ));
      } else {
        // Set as main image
        setMultiDishes(multiDishes.map(d =>
          d.id === dishId
            ? { ...d, uri, base64: base64 || '' }
            : d
        ));
      }
    }
  };

  const removeMultiDishImage = (dishId: string, imageIndex?: number) => {
    if (imageIndex !== undefined) {
      // Remove additional image
      setMultiDishes(multiDishes.map(d =>
        d.id === dishId
          ? { ...d, additionalImages: d.additionalImages.filter((_, i) => i !== imageIndex) }
          : d
      ));
    } else {
      // Remove main image
      setMultiDishes(multiDishes.map(d =>
        d.id === dishId
          ? { ...d, uri: null, base64: null }
          : d
      ));
    }
  };

  const handleAnalyzeMultipleDishes = async () => {
    const dishesWithImages = multiDishes.filter(d => d.base64 !== null);
    if (dishesWithImages.length === 0) {
      Alert.alert('No Images', 'Please upload at least one food image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allergyList = [...selectedAllergies];
      if (customAllergies.trim()) {
        allergyList.push(...customAllergies.split(',').map(a => a.trim()).filter(a => a));
      }

      const analysisResult = await analyzeMultipleDishes(dishesWithImages, allergyList);
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
              userAllergies: allergyList,
              notes: `${dish.cuisineType} cuisine. ${dish.notes || ''}`,
              healthyAlternatives: dish.healthyAlternatives || [],
              recipeLinks: dish.recipeLinks || [],
              brandedProduct: { 
                isBranded: false, 
                brandName: null, 
                productName: null, 
                ingredients: null, 
                purchaseLinks: { lazada: null, shopee: null, puregold: null } 
              },
              nutritionSources: []
            });
          } catch (saveErr) {
            console.error('Error saving dish to log:', saveErr);
          }
        }
        await refreshCalorieBalance();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze dishes');
      console.error('Multi-dish analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetMultiDish = () => {
    setMultiDishes([{ id: '1', uri: null, base64: null, dishName: '', servingSize: 'Regular (1 cup / 200g)', additionalImages: [] }]);
    setMultiDishResult(null);
    setError(null);
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

      // Capture BEFORE nutrition battery value
      let previousNutritionValue = 0;
      try {
        const profileBefore = await getUserProfile();
        previousNutritionValue = profileBefore.profile?.gamification?.batteries?.[0]?.nutrition || 0;
        console.log('[Food] Previous nutrition battery:', previousNutritionValue);
      } catch (err) {
        console.warn('[Food] Could not fetch profile before save:', err);
      }

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
        inputMethod: inputMode === 'multi' ? 'multi-dish' : inputMode,
        imageBase64: imageToSend,
        dishName: dishName || undefined,
        userAllergies: allergyList,
        ingredientsList: inputMode === 'manual' ? ingredients : undefined
      });

      console.log('Food log saved successfully:', response);

      // Refresh calorie balance after saving food log
      await refreshCalorieBalance();

      // Wait a moment for backend gamification to process, then fetch updated profile
      setIsCalculating(true);
      setTimeout(async () => {
        try {
          const profileAfter = await getUserProfile();
          const newNutritionValue = profileAfter.profile?.gamification?.batteries?.[0]?.nutrition || 0;
          console.log('[Food] New nutrition battery:', newNutritionValue);

          // Show animation if value changed
          if (newNutritionValue !== previousNutritionValue) {
            setBatteryAnimationData({
              previousValue: previousNutritionValue,
              newValue: newNutritionValue,
              label: 'Nutrition',
            });
            setShowBatteryAnimation(true);
          }
        } catch (err) {
          console.warn('[Food] Could not fetch profile after save:', err);
        } finally {
          setIsCalculating(false);
        }
      }, 2000); // Wait 2 seconds for backend processing

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

  // Handler for manually logging analyzed food
  const handleLogFood = async () => {
    if (!result || !user) {
      Alert.alert('Error', 'No analysis result to log');
      return;
    }

    setLoading(true);
    try {
      // Get base64 image if available
      let imageBase64: string | undefined;
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            imageBase64 = reader.result as string;
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      }

      await saveFoodLog(result, imageBase64);
      setIsLogged(true);
    } catch (err: any) {
      console.error('Error logging food:', err);
      Alert.alert('Error', 'Failed to log food. Please try again.');
    } finally {
      setLoading(false);
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
          setIsLogged(false); // Mark as not logged yet
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
      setIsLogged(false); // Mark as not logged yet
    } catch (err: any) {
      setError(err.message || 'Failed to analyze ingredients.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setMultiDishResult(null);
    setError(null);
    setImageUri(null);
    setDishName('');
    setIngredients('');
    setIsLogged(false);
    resetMultiDish();
  };

  const getPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const NutrientBar = ({ label, value, unit, max, color = '#3b82f6', icon }: {
    label: string;
    value: number;
    unit: string;
    max: number;
    color?: string;
    icon?: string;
  }) => {
    const percentage = getPercentage(value, max);
    return (
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon && (
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: color + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}>
                <MaterialCommunityIcons name={icon as any} size={14} color={color} />
              </View>
            )}
            <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
              {label}
            </Text>
          </View>
          <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.sm, color }}>
            {value}{unit}
          </Text>
        </View>
        <View style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.background,
          overflow: 'hidden',
        }}>
          <View
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              height: '100%',
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    );
  };

  // Multi-dish result view
  if (multiDishResult) {
    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              onPress={handleReset}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                marginLeft: -8,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
              <Text style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.xl,
                marginLeft: 4,
              }}>
                Multi-Dish Results
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReset}
              style={{
                backgroundColor: '#f59e0b',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.sm,
                color: '#FFFFFF',
                marginLeft: 4,
              }}>
                New
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Meal Summary Card */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 8,
              backgroundColor: '#f59e0b15',
              borderRadius: 24,
              padding: 20,
              borderWidth: 2,
              borderColor: '#f59e0b',
            }}>
              <Text style={{
                fontFamily: theme.fonts.heading,
                fontSize: 22,
                color: theme.colors.text,
                marginBottom: 8,
              }}>
                Meal Analysis Complete
              </Text>
              <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text + '99',
              }}>
                {multiDishResult.mealSummary}
              </Text>
            </View>

            {/* Total Calories */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
            }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#f59e0b15',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 6,
                borderColor: '#f59e0b',
              }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 36,
                  color: '#f59e0b'
                }}>
                  {multiDishResult.totalCalories}
                </Text>
                <Text style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text + '77'
                }}>
                  total kcal
                </Text>
              </View>
            </View>

            {/* Total Macros */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 16,
              flexDirection: 'row',
            }}>
              <StatCard
                icon="arm-flex"
                label="Protein"
                value={multiDishResult.totalNutrients.protein || 0}
                suffix="g"
                color="#3b82f6"
                theme={theme}
              />
              <StatCard
                icon="bread-slice"
                label="Carbs"
                value={multiDishResult.totalNutrients.carbs || 0}
                suffix="g"
                color="#8b5cf6"
                theme={theme}
              />
              <StatCard
                icon="water"
                label="Fat"
                value={multiDishResult.totalNutrients.fat || 0}
                suffix="g"
                color="#ec4899"
                theme={theme}
              />
            </View>

            {/* Allergy Warnings */}
            {multiDishResult.allergyWarnings?.detected?.length > 0 && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: '#fee2e2',
                borderRadius: 20,
                padding: 16,
                flexDirection: 'row',
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#ef444420',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="warning" size={24} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.base,
                    color: '#991b1b',
                    marginBottom: 4,
                  }}>
                    Allergy Warning
                  </Text>
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: '#b91c1c'
                  }}>
                    Contains: {multiDishResult.allergyWarnings.detected.join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Individual Dishes */}
            <View style={{ marginHorizontal: 20, marginTop: 24 }}>
              <Text style={{
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.lg,
                color: theme.colors.text,
                marginBottom: 12,
              }}>
                Dish Breakdown
              </Text>

              {multiDishResult.dishes.map((dish, index) => (
                <View
                  key={dish.dishId}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: theme.fontSizes.base,
                        color: theme.colors.text,
                        marginBottom: 4,
                      }}>
                        {dish.foodName}
                      </Text>
                      {dish.userProvidedName && dish.userProvidedName !== dish.foodName && (
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.text + '77',
                        }}>
                          (Named: {dish.userProvidedName})
                        </Text>
                      )}
                    </View>
                    <View style={{
                      backgroundColor: '#f59e0b15',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}>
                      <Text style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: theme.fontSizes.base,
                        color: '#f59e0b',
                      }}>
                        {dish.calories} kcal
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
                    {dish.cuisineType && (
                      <View style={{
                        backgroundColor: theme.colors.primary + '15',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginRight: 8,
                        marginBottom: 4,
                      }}>
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.primary,
                        }}>
                          {dish.cuisineType}
                        </Text>
                      </View>
                    )}
                    <View style={{
                      backgroundColor: theme.colors.secondary + '15',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginRight: 8,
                      marginBottom: 4,
                    }}>
                      <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.text + '77',
                      }}>
                        {dish.servingSize}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: dish.confidence === 'high' ? '#22c55e15' : dish.confidence === 'medium' ? '#f59e0b15' : '#ef444415',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginBottom: 4,
                    }}>
                      <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: dish.confidence === 'high' ? '#22c55e' : dish.confidence === 'medium' ? '#f59e0b' : '#ef4444',
                      }}>
                        {dish.confidence} confidence
                      </Text>
                    </View>
                  </View>

                  {/* Macros for this dish */}
                  <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.sm, color: '#3b82f6' }}>
                        {dish.nutrients.protein || 0}g
                      </Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>
                        Protein
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.sm, color: '#8b5cf6' }}>
                        {dish.nutrients.carbs || 0}g
                      </Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>
                        Carbs
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.sm, color: '#ec4899' }}>
                        {dish.nutrients.fat || 0}g
                      </Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>
                        Fat
                      </Text>
                    </View>
                  </View>

                  {/* Allergy warning for this dish */}
                  {dish.allergyWarnings?.detected?.length > 0 && (
                    <View style={{
                      backgroundColor: '#fee2e2',
                      borderRadius: 8,
                      padding: 8,
                      marginTop: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <Ionicons name="warning" size={14} color="#ef4444" />
                      <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: '#991b1b',
                        marginLeft: 6,
                      }}>
                        Contains: {dish.allergyWarnings.detected.join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Notes */}
                  {dish.notes && (
                    <Text style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '77',
                      marginTop: 8,
                      fontStyle: 'italic',
                    }}>
                      {dish.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Logged Success Badge */}
            <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 32 }}>
              <View style={{
                backgroundColor: '#22c55e20',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#22c55e',
              }}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#22c55e' }}>
                  All dishes logged to your history!
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Battery Animation Overlay */}
        <BatteryAnimate
          visible={showBatteryAnimation}
          previousValue={batteryAnimationData.previousValue}
          newValue={batteryAnimationData.newValue}
          label={batteryAnimationData.label}
          onComplete={() => setShowBatteryAnimation(false)}
        />
      </>
    );
  }

  if (result) {
    return (
      <>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <TouchableOpacity
              onPress={handleReset}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 8,
                marginLeft: -8,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
              <Text style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.xl,
                marginLeft: 4,
              }}>
                Results
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {result && !isLogged && (
                <TouchableOpacity
                  onPress={handleLogFood}
                  style={{
                    backgroundColor: theme.colors.success,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.sm,
                    color: '#FFFFFF',
                    marginLeft: 4,
                  }}>
                    Log Food
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleReset}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                <Text style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: theme.fontSizes.sm,
                  color: '#FFFFFF',
                  marginLeft: 4,
                }}>
                  New
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Food Name Header Card */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 8,
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}>
              {imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 180 }}
                  resizeMode="cover"
                />
              )}
              <View style={{ padding: 20 }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 22,
                  color: theme.colors.text,
                  marginBottom: 8,
                }}>
                  {result.foodName}
                </Text>

                {result.brandedProduct?.isBranded && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.accent + '20',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    alignSelf: 'flex-start',
                  }}>
                    <MaterialCommunityIcons name="tag" size={14} color={theme.colors.accent} />
                    <Text style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.accent,
                      marginLeft: 6,
                    }}>
                      {result.brandedProduct.brandName && result.brandedProduct.productName
                        ? `${result.brandedProduct.brandName} - ${result.brandedProduct.productName}`
                        : result.brandedProduct.brandName || result.brandedProduct.productName || 'Branded Product'}
                    </Text>
                  </View>
                )}

                {result.servingSize && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <MaterialCommunityIcons name="scale" size={16} color={theme.colors.text + '77'} />
                    <Text style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.text + '77',
                      marginLeft: 6,
                    }}>
                      Serving: {result.servingSize}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Allergy Warning */}
            {result.allergyWarnings?.detected?.length > 0 && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: '#fee2e2',
                borderRadius: 20,
                padding: 16,
                flexDirection: 'row',
              }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#ef444420',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="warning" size={24} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.base,
                    color: '#991b1b',
                    marginBottom: 4,
                  }}>
                    Allergy Warning
                  </Text>
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: '#b91c1c'
                  }}>
                    Contains: {result.allergyWarnings.detected.join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Calorie Display */}
            <View style={{
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 6,
                borderColor: theme.colors.primary,
              }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 36,
                  color: theme.colors.primary
                }}>
                  {result.calories}
                </Text>
                <Text style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text + '77'
                }}>
                  kcal
                </Text>
              </View>
            </View>

            {/* Macros */}
            {result.nutrients && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                flexDirection: 'row',
              }}>
                {result.nutrients.protein! > 0 && (
                  <StatCard
                    icon="arm-flex"
                    label="Protein"
                    value={result.nutrients.protein!}
                    suffix="g"
                    color="#3b82f6"
                    theme={theme}
                  />
                )}
                {result.nutrients.carbs! > 0 && (
                  <StatCard
                    icon="bread-slice"
                    label="Carbs"
                    value={result.nutrients.carbs!}
                    suffix="g"
                    color="#8b5cf6"
                    theme={theme}
                  />
                )}
                {result.nutrients.fat! > 0 && (
                  <StatCard
                    icon="water"
                    label="Fat"
                    value={result.nutrients.fat!}
                    suffix="g"
                    color="#ec4899"
                    theme={theme}
                  />
                )}
              </View>
            )}

            {/* Detailed Nutrition */}
            {result.nutrients && Object.keys(result.nutrients).length > 0 && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: theme.fontSizes.lg,
                  color: theme.colors.text,
                  marginBottom: 16,
                }}>
                  Nutrition Facts
                </Text>

                {result.nutrients.protein! > 0 && (
                  <NutrientBar label="Protein" value={result.nutrients.protein!} unit="g" max={50} color="#3b82f6" icon="arm-flex" />
                )}
                {result.nutrients.carbs! > 0 && (
                  <NutrientBar label="Carbohydrates" value={result.nutrients.carbs!} unit="g" max={300} color="#8b5cf6" icon="bread-slice" />
                )}
                {result.nutrients.fat! > 0 && (
                  <NutrientBar label="Total Fat" value={result.nutrients.fat!} unit="g" max={78} color="#ec4899" icon="water" />
                )}
                {result.nutrients.fiber! > 0 && (
                  <NutrientBar label="Fiber" value={result.nutrients.fiber!} unit="g" max={28} color="#10b981" icon="leaf" />
                )}
                {result.nutrients.sugar! > 0 && (
                  <NutrientBar label="Sugar" value={result.nutrients.sugar!} unit="g" max={50} color="#f97316" icon="cube-outline" />
                )}
                {result.nutrients.sodium! > 0 && (
                  <NutrientBar label="Sodium" value={result.nutrients.sodium!} unit="mg" max={2300} color="#6366f1" icon="shaker" />
                )}
              </View>
            )}

            {/* Complete Nutritional Information */}
            {result.nutrients && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: theme.fontSizes.lg,
                  color: theme.colors.text,
                  marginBottom: 16,
                }}>
                  Complete Details
                </Text>

                {result.calories > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Calories</Text>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.calories} kcal</Text>
                  </View>
                )}
                {result.nutrients.fat! > 0 && (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Total Fat</Text>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.fat}g</Text>
                    </View>
                    {result.nutrients.saturatedFat! > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>Saturated Fat</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>{result.nutrients.saturatedFat}g</Text>
                      </View>
                    )}
                    {result.nutrients.transFat! > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>Trans Fat</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>{result.nutrients.transFat}g</Text>
                      </View>
                    )}
                  </>
                )}
                {result.nutrients.cholesterol! > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Cholesterol</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.cholesterol}mg</Text>
                  </View>
                )}
                {result.nutrients.sodium! > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Sodium</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.sodium}mg</Text>
                  </View>
                )}
                {result.nutrients.potassium! > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Potassium</Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.potassium}mg</Text>
                  </View>
                )}
                {result.nutrients.carbs! > 0 && (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Total Carbohydrate</Text>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.carbs}g</Text>
                    </View>
                    {result.nutrients.fiber! > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>Dietary Fiber</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>{result.nutrients.fiber}g</Text>
                      </View>
                    )}
                    {result.nutrients.sugar! > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.secondary + '22' }}>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>Total Sugars</Text>
                        <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>{result.nutrients.sugar}g</Text>
                      </View>
                    )}
                  </>
                )}
                {result.nutrients.protein! > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>Protein</Text>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.nutrients.protein}g</Text>
                  </View>
                )}
              </View>
            )}

            {/* Vitamins & Minerals */}
            {(result.nutrients?.vitaminA || result.nutrients?.vitaminC ||
              result.nutrients?.vitaminD || result.nutrients?.calcium ||
              result.nutrients?.iron) && (
                <View style={{
                  marginHorizontal: 20,
                  marginTop: 16,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 24,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.text,
                    marginBottom: 16,
                  }}>
                    Vitamins & Minerals
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                    {result.nutrients.vitaminA! > 0 && (
                      <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>Vitamin A</Text>
                          <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.base, color: theme.colors.text }}>{result.nutrients.vitaminA}%</Text>
                        </View>
                      </View>
                    )}
                    {result.nutrients.vitaminC! > 0 && (
                      <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>Vitamin C</Text>
                          <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.base, color: theme.colors.text }}>{result.nutrients.vitaminC}%</Text>
                        </View>
                      </View>
                    )}
                    {result.nutrients.vitaminD! > 0 && (
                      <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>Vitamin D</Text>
                          <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.base, color: theme.colors.text }}>{result.nutrients.vitaminD}%</Text>
                        </View>
                      </View>
                    )}
                    {result.nutrients.calcium! > 0 && (
                      <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>Calcium</Text>
                          <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.base, color: theme.colors.text }}>{result.nutrients.calcium}%</Text>
                        </View>
                      </View>
                    )}
                    {result.nutrients.iron! > 0 && (
                      <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
                        <View style={{ backgroundColor: theme.colors.background, borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>Iron</Text>
                          <Text style={{ fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.base, color: theme.colors.text }}>{result.nutrients.iron}%</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

            {/* Branded Product Ingredients */}
            {result.brandedProduct?.isBranded && result.brandedProduct?.ingredients && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialCommunityIcons name="clipboard-list" size={20} color={theme.colors.primary} />
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.text,
                    marginLeft: 8,
                  }}>
                    Ingredients
                  </Text>
                </View>
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
                  {result.brandedProduct.ingredients}
                </Text>
              </View>
            )}

            {/* Recipe Links */}
            {result.recipeLinks?.length > 0 && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <MaterialCommunityIcons name="chef-hat" size={20} color={theme.colors.primary} />
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.primary,
                    marginLeft: 8,
                  }}>
                    Recipe Ideas
                  </Text>
                </View>
                {result.recipeLinks.map((recipe, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(recipe.url)}
                    style={{
                      backgroundColor: theme.colors.background,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{recipe.title}</Text>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77', marginTop: 2 }}>{recipe.source}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Healthy Alternatives */}
            {result.healthyAlternatives?.length > 0 && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.success} />
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.success,
                    marginLeft: 8,
                  }}>
                    Healthier Alternatives
                  </Text>
                </View>
                {result.healthyAlternatives.map((alt, index) => (
                  <View key={index} style={{
                    backgroundColor: theme.colors.background,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: theme.colors.text, flex: 1 }}>{alt.name}</Text>
                      {alt.caloriesSaved > 0 && (
                        <View style={{ backgroundColor: '#bbf7d0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: '#166534' }}>-{alt.caloriesSaved} kcal</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text + '99' }}>{alt.reason}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* May Contain Allergens */}
            {result.allergyWarnings?.mayContain?.length > 0 && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.error,
                    marginLeft: 8,
                  }}>
                    May Contain
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {result.allergyWarnings.mayContain.map((allergen, index) => (
                    <View key={index} style={{
                      backgroundColor: theme.colors.background,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      marginRight: 8,
                      marginBottom: 8,
                    }}>
                      <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.error }}>{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Notes */}
            {result.notes && (
              <View style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: theme.colors.primary + '15',
                borderRadius: 24,
                padding: 20,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.primary,
                    marginLeft: 8,
                  }}>
                    Notes
                  </Text>
                </View>
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.sm, color: theme.colors.text }}>{result.notes}</Text>
              </View>
            )}

            {/* Confidence */}
            {result.confidence && (
              <View style={{ marginHorizontal: 20, marginTop: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: theme.colors.text + '77' }}>
                  Analysis Confidence: <Text style={{ fontFamily: theme.fonts.bodyBold }}>{result.confidence}</Text>
                </Text>
              </View>
            )}

            {/* Log Food Button - Only show if not logged yet */}
            {!isLogged && (
              <View style={{ marginHorizontal: 20, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={handleLogFood}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? theme.colors.primary + '77' : '#22c55e',
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                        Logging...
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                        Log This Food
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Logged Badge - Show when food is logged */}
            {isLogged && (
              <View style={{ marginHorizontal: 20, marginTop: 24 }}>
                <View style={{
                  backgroundColor: '#22c55e' + '20',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#22c55e',
                }}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#22c55e" style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#22c55e' }}>
                    Food Logged Successfully
                  </Text>
                </View>
              </View>
            )}

            {/* Analyze Another Button */}
            <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                  Analyze Another Food
                </Text>
              </TouchableOpacity>
            </View>
            {/* Battery Animation Overlay */}
            <GamificationLoading visible={isCalculating} message="Calculating Nutrition Points..." />
            <BatteryAnimate
              visible={showBatteryAnimation}
              previousValue={batteryAnimationData.previousValue}
              newValue={batteryAnimationData.newValue}
              label="Nutrition"
              onComplete={() => setShowBatteryAnimation(false)}
            />

          </ScrollView>

          {/* Camera Modal */}
          <Modal
            visible={showCamera}
            animationType="slide"
            onRequestClose={closeCamera}
          >
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={facing}
              />

              <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 10,
                }}>
                  <TouchableOpacity
                    onPress={closeCamera}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={toggleCameraFacing}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: 50,
                paddingTop: 20,
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}>
                <TouchableOpacity
                  onPress={capturePhoto}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 4,
                    borderColor: 'rgba(255,255,255,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#FFFFFF',
                  }} />
                </TouchableOpacity>
                <Text style={{
                  color: '#FFFFFF',
                  marginTop: 12,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm
                }}>
                  Tap to capture
                </Text>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 8,
              marginLeft: -8,
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            <Text style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.xl,
              marginLeft: 4,
            }}>
              Food Tracker
            </Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === 'analyze' ? 'history' : 'analyze')}
              style={{
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name={viewMode === 'analyze' ? 'history' : 'plus-circle'}
                size={18}
                color={theme.colors.primary}
              />
              <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.primary,
                marginLeft: 4,
              }}>
                {viewMode === 'analyze' ? 'History' : 'New'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            viewMode === 'history' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
        >
          {/* Mini Calorie Progress Bar */}
          {calorieBalance && viewMode === 'analyze' && (
            <View style={{ marginHorizontal: 20, marginTop: 8, marginBottom: 20 }}>
              <MiniCalorieProgress calorieBalance={calorieBalance} theme={theme} />
            </View>
          )}

          {viewMode === 'analyze' ? (
            <>
              {/* Quick Actions */}
              <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <Text style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: theme.fontSizes.lg,
                  color: theme.colors.text,
                  marginBottom: 12,
                }}>
                  Add Food Entry
                </Text>
                <View style={{ flexDirection: 'row', marginHorizontal: -6 }}>
                  <QuickActionButton
                    icon="camera"
                    label="Take Photo"
                    onPress={() => {
                      setInputMode('image');
                      takePhoto();
                    }}
                    color={theme.colors.primary}
                    theme={theme}
                    disabled={loading}
                  />
                  <QuickActionButton
                    icon="image"
                    label="Gallery"
                    onPress={() => {
                      setInputMode('image');
                      pickImage();
                    }}
                    color="#8b5cf6"
                    theme={theme}
                    disabled={loading}
                  />
                  <QuickActionButton
                    icon="pencil"
                    label="Manual"
                    onPress={() => setInputMode('manual')}
                    color="#10b981"
                    theme={theme}
                    disabled={loading}
                  />
                </View>
              </View>

              {/* Error Display */}
              {error && (
                <View style={{
                  marginHorizontal: 20,
                  marginBottom: 16,
                  backgroundColor: '#fee2e2',
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#ef444420',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="alert-circle" size={24} color="#ef4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.sm, color: '#991b1b' }}>
                      Analysis Failed
                    </Text>
                    <Text style={{ fontFamily: theme.fonts.body, fontSize: theme.fontSizes.xs, color: '#991b1b' }}>
                      {error}
                    </Text>
                  </View>
                </View>
              )}

              {/* Input Section */}
              <View style={{
                marginHorizontal: 20,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                {/* Mode Toggle */}
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: theme.colors.background,
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 20,
                }}>
                  <TouchableOpacity
                    onPress={() => setInputMode('image')}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: inputMode === 'image' ? theme.colors.primary : 'transparent',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={16}
                      color={inputMode === 'image' ? '#FFFFFF' : theme.colors.text + '77'}
                    />
                    <Text style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xs,
                      color: inputMode === 'image' ? '#FFFFFF' : theme.colors.text + '77',
                      marginLeft: 4,
                    }}>
                      Image
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setInputMode('manual')}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: inputMode === 'manual' ? theme.colors.primary : 'transparent',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="text-box-outline"
                      size={16}
                      color={inputMode === 'manual' ? '#FFFFFF' : theme.colors.text + '77'}
                    />
                    <Text style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xs,
                      color: inputMode === 'manual' ? '#FFFFFF' : theme.colors.text + '77',
                      marginLeft: 4,
                    }}>
                      Manual
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setInputMode('multi')}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: inputMode === 'multi' ? '#f59e0b' : 'transparent',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="food-variant"
                      size={16}
                      color={inputMode === 'multi' ? '#FFFFFF' : theme.colors.text + '77'}
                    />
                    <Text style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.xs,
                      color: inputMode === 'multi' ? '#FFFFFF' : theme.colors.text + '77',
                      marginLeft: 4,
                    }}>
                      Multi
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Dish Name Input with Filipino/Asian Suggestions */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text,
                    marginBottom: 8,
                  }}>
                    Dish Name
                    <Text style={{ color: theme.colors.text + '55' }}> (Optional - helps AI identify)</Text>
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.input,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.secondary + '22',
                  }}>
                    <View style={{ paddingLeft: 14 }}>
                      <MaterialCommunityIcons name="food" size={20} color={theme.colors.text + '55'} />
                    </View>
                    <TextInput
                      value={dishName}
                      onChangeText={(text) => {
                        setDishName(text);
                        setShowDishSuggestions(text.length > 0);
                      }}
                      onFocus={() => setShowDishSuggestions(true)}
                      placeholder="e.g., Adobo, Sinigang, Ramen"
                      placeholderTextColor={theme.colors.text + '55'}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.base,
                      }}
                      editable={!loading}
                    />
                  </View>
                  
                  {/* Dish Suggestions */}
                  {showDishSuggestions && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.text + '77',
                        marginBottom: 6,
                      }}>
                        Quick picks (Filipino & Asian):
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 8 }}
                      >
                        {[...FILIPINO_DISHES, ...ASIAN_DISHES]
                          .filter(d => !dishName || d.toLowerCase().includes(dishName.toLowerCase()))
                          .slice(0, 15)
                          .map((dish, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setDishName(dish);
                              setShowDishSuggestions(false);
                            }}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              backgroundColor: theme.colors.primary + '15',
                              marginRight: 8,
                              borderWidth: 1,
                              borderColor: theme.colors.primary + '30',
                            }}
                          >
                            <Text style={{
                              fontFamily: theme.fonts.body,
                              fontSize: theme.fontSizes.sm,
                              color: theme.colors.primary,
                            }}>
                              {dish}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        onPress={() => setShowDishSuggestions(false)}
                        style={{ alignSelf: 'flex-end' }}
                      >
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.text + '55',
                        }}>
                          Hide suggestions
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Allergies Section */}
                <View style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View>
                      <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: theme.fontSizes.sm,
                        color: theme.colors.text
                      }}>
                        Allergies & Dietary Restrictions
                      </Text>
                      <Text style={{
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.text + '66',
                        marginTop: 2,
                      }}>
                        Includes Filipino/Asian ingredients (bagoong, patis, etc.)
                      </Text>
                    </View>
                    {allergiesLoaded && selectedAllergies.length > 0 && (
                      <View style={{
                        backgroundColor: theme.colors.primary + '15',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}>
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.primary
                        }}>
                          From profile
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                    {COMMON_ALLERGENS.map(allergen => (
                      <TouchableOpacity
                        key={allergen}
                        onPress={() => toggleAllergy(allergen)}
                        disabled={loading}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          marginRight: 8,
                          marginBottom: 8,
                          backgroundColor: selectedAllergies.includes(allergen)
                            ? theme.colors.primary
                            : theme.colors.background,
                          borderWidth: 1,
                          borderColor: selectedAllergies.includes(allergen)
                            ? theme.colors.primary
                            : theme.colors.secondary + '33',
                        }}
                      >
                        <Text style={{
                          fontFamily: selectedAllergies.includes(allergen) ? theme.fonts.bodyBold : theme.fonts.body,
                          fontSize: theme.fontSizes.sm,
                          color: selectedAllergies.includes(allergen) ? '#FFFFFF' : theme.colors.text + '99',
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
                    placeholderTextColor={theme.colors.text + '55'}
                    style={{
                      backgroundColor: theme.colors.input,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      color: theme.colors.text,
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.base,
                      borderWidth: 1,
                      borderColor: theme.colors.secondary + '22',
                    }}
                    editable={!loading}
                  />
                </View>

                {/* Image Upload / Ingredients Input / Multi-Dish Input */}
                {inputMode === 'image' ? (
                  <>
                    {imageUri ? (
                      <View style={{ marginBottom: 16 }}>
                        <View style={{
                          borderRadius: 16,
                          overflow: 'hidden',
                          marginBottom: 12,
                        }}>
                          <Image
                            source={{ uri: imageUri }}
                            style={{ width: '100%', height: 200 }}
                            resizeMode="cover"
                          />
                          <View style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 20,
                            padding: 8,
                          }}>
                            <TouchableOpacity onPress={() => setImageUri(null)} disabled={loading}>
                              <Ionicons name="close" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={handleAnalyzeImage}
                          disabled={loading}
                          style={{
                            backgroundColor: loading ? theme.colors.primary + '77' : theme.colors.primary,
                            borderRadius: 16,
                            paddingVertical: 16,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                          }}
                        >
                          {loading ? (
                            <>
                              <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                                Analyzing...
                              </Text>
                            </>
                          ) : (
                            <>
                              <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                                Analyze Food
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={pickImage}
                        disabled={loading}
                        style={{
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          borderColor: theme.colors.primary + '44',
                          borderRadius: 16,
                          padding: 32,
                          alignItems: 'center',
                          backgroundColor: theme.colors.primary + '08',
                        }}
                      >
                        <View style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: theme.colors.primary + '15',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12,
                        }}>
                          <MaterialCommunityIcons name="image-plus" size={32} color={theme.colors.primary} />
                        </View>
                        <Text style={{
                          fontFamily: theme.fonts.bodyBold,
                          fontSize: theme.fontSizes.base,
                          color: theme.colors.text,
                          marginBottom: 4,
                        }}>
                          Upload Food Image
                        </Text>
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.text + '77',
                          textAlign: 'center',
                        }}>
                          Tap to select from gallery{'\n'}or use quick actions above
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : inputMode === 'manual' ? (
                  <View>
                    <Text style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.text,
                      marginBottom: 8,
                    }}>
                      Ingredients & Quantities
                    </Text>
                    <TextInput
                      value={ingredients}
                      onChangeText={setIngredients}
                      placeholder={'Enter ingredients:\n• 2 eggs\n• 1 cup rice\n• 100g chicken breast\n• 1 tbsp olive oil'}
                      placeholderTextColor={theme.colors.text + '55'}
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                      style={{
                        backgroundColor: theme.colors.input,
                        borderRadius: 12,
                        padding: 14,
                        minHeight: 160,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                        fontSize: theme.fontSizes.base,
                        borderWidth: 1,
                        borderColor: theme.colors.secondary + '22',
                        marginBottom: 16,
                      }}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={handleAnalyzeIngredients}
                      disabled={loading || !ingredients.trim()}
                      style={{
                        backgroundColor: (loading || !ingredients.trim()) ? theme.colors.primary + '44' : theme.colors.primary,
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                    >
                      {loading ? (
                        <>
                          <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                            Analyzing...
                          </Text>
                        </>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="calculator" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                            Calculate Nutrition
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Multi-Dish Mode */
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{
                        fontFamily: theme.fonts.bodyBold,
                        fontSize: theme.fontSizes.sm,
                        color: theme.colors.text,
                      }}>
                        Dishes ({multiDishes.filter(d => d.base64).length}/{multiDishes.length})
                      </Text>
                      <TouchableOpacity
                        onPress={addDish}
                        disabled={loading || multiDishes.length >= 10}
                        style={{
                          backgroundColor: '#f59e0b',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          opacity: loading || multiDishes.length >= 10 ? 0.5 : 1,
                        }}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                        <Text style={{
                          fontFamily: theme.fonts.bodyBold,
                          fontSize: theme.fontSizes.xs,
                          color: '#FFFFFF',
                          marginLeft: 4,
                        }}>
                          Add Dish
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + '77',
                      marginBottom: 12,
                    }}>
                      Upload multiple dishes for comprehensive nutrition analysis. Add multiple photos per dish for better accuracy.
                    </Text>

                    {/* Dishes List */}
                    {multiDishes.map((dish, index) => (
                      <View
                        key={dish.id}
                        style={{
                          backgroundColor: theme.colors.background,
                          borderRadius: 16,
                          padding: 12,
                          marginBottom: 12,
                          borderWidth: 2,
                          borderColor: dish.base64 ? '#f59e0b' : theme.colors.secondary + '22',
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{
                            fontFamily: theme.fonts.bodyBold,
                            fontSize: theme.fontSizes.sm,
                            color: theme.colors.text,
                          }}>
                            Dish {index + 1}
                          </Text>
                          {multiDishes.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeDish(dish.id)}
                              disabled={loading}
                              style={{ padding: 4 }}
                            >
                              <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Main Image Upload */}
                        {dish.uri ? (
                          <View style={{ marginBottom: 8 }}>
                            <View style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                              <Image
                                source={{ uri: dish.uri }}
                                style={{ width: '100%', height: 120 }}
                                resizeMode="cover"
                              />
                              <TouchableOpacity
                                onPress={() => removeMultiDishImage(dish.id)}
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  borderRadius: 12,
                                  padding: 4,
                                }}
                              >
                                <Ionicons name="close" size={14} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>

                            {/* Additional Images */}
                            <Text style={{
                              fontFamily: theme.fonts.body,
                              fontSize: theme.fontSizes.xs,
                              color: theme.colors.text + '77',
                              marginBottom: 4,
                            }}>
                              Add more angles (optional - improves accuracy)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              <View style={{ flexDirection: 'row' }}>
                                {dish.additionalImages.map((img, imgIndex) => (
                                  <View key={imgIndex} style={{ marginRight: 8, position: 'relative' }}>
                                    <Image
                                      source={{ uri: img.uri }}
                                      style={{ width: 60, height: 60, borderRadius: 8 }}
                                      resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                      onPress={() => removeMultiDishImage(dish.id, imgIndex)}
                                      style={{
                                        position: 'absolute',
                                        top: -4,
                                        right: -4,
                                        backgroundColor: theme.colors.error,
                                        borderRadius: 10,
                                        width: 18,
                                        height: 18,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Ionicons name="close" size={12} color="#FFFFFF" />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                                {dish.additionalImages.length < 4 && (
                                  <TouchableOpacity
                                    onPress={() => pickMultiDishImage(dish.id, true)}
                                    disabled={loading}
                                    style={{
                                      width: 60,
                                      height: 60,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderStyle: 'dashed',
                                      borderColor: theme.colors.secondary + '44',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: theme.colors.surface,
                                    }}
                                  >
                                    <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </ScrollView>
                          </View>
                        ) : (
                          <View style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginBottom: 8,
                          }}>
                            <TouchableOpacity
                              onPress={() => takeMultiDishPhoto(dish.id, false)}
                              disabled={loading}
                              style={{
                                flex: 1,
                                borderWidth: 1,
                                borderStyle: 'dashed',
                                borderColor: '#f59e0b44',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                backgroundColor: '#f59e0b08',
                              }}
                            >
                              <MaterialCommunityIcons name="camera" size={24} color="#f59e0b" />
                              <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: theme.fontSizes.xs,
                                color: '#f59e0b',
                                marginTop: 4,
                              }}>
                                Camera
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => pickMultiDishImage(dish.id, false)}
                              disabled={loading}
                              style={{
                                flex: 1,
                                borderWidth: 1,
                                borderStyle: 'dashed',
                                borderColor: '#f59e0b44',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                backgroundColor: '#f59e0b08',
                              }}
                            >
                              <MaterialCommunityIcons name="image" size={24} color="#f59e0b" />
                              <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: theme.fontSizes.xs,
                                color: '#f59e0b',
                                marginTop: 4,
                              }}>
                                Gallery
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* Dish Name */}
                        <TextInput
                          value={dish.dishName}
                          onChangeText={(text) => updateMultiDishName(dish.id, text)}
                          placeholder="Dish name (e.g., Adobo, Sinigang)"
                          placeholderTextColor={theme.colors.text + '55'}
                          style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            color: theme.colors.text,
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fontSizes.sm,
                            borderWidth: 1,
                            borderColor: theme.colors.secondary + '22',
                            marginBottom: 8,
                          }}
                          editable={!loading}
                        />

                        {/* Serving Size */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fontSizes.xs,
                            color: theme.colors.text + '77',
                            marginRight: 8,
                          }}>
                            Serving:
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {SERVING_SIZES.slice(0, 4).map((size) => (
                              <TouchableOpacity
                                key={size}
                                onPress={() => updateMultiDishServingSize(dish.id, size)}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 12,
                                  backgroundColor: dish.servingSize === size ? '#f59e0b' : theme.colors.surface,
                                  marginRight: 6,
                                }}
                              >
                                <Text style={{
                                  fontFamily: theme.fonts.body,
                                  fontSize: theme.fontSizes.xs,
                                  color: dish.servingSize === size ? '#FFFFFF' : theme.colors.text + '77',
                                }}>
                                  {size.split(' (')[0]}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    ))}

                    {/* Analyze Button */}
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity
                        onPress={resetMultiDish}
                        disabled={loading}
                        style={{
                          flex: 1,
                          backgroundColor: theme.colors.surface,
                          borderRadius: 12,
                          paddingVertical: 14,
                          alignItems: 'center',
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.secondary + '22',
                        }}
                      >
                        <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.text} />
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.xs,
                          color: theme.colors.text,
                          marginTop: 4,
                        }}>
                          Reset
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleAnalyzeMultipleDishes}
                        disabled={loading || multiDishes.filter(d => d.base64).length === 0}
                        style={{
                          flex: 3,
                          backgroundColor: (loading || multiDishes.filter(d => d.base64).length === 0) 
                            ? '#f59e0b44' 
                            : '#f59e0b',
                          borderRadius: 12,
                          paddingVertical: 14,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                        }}
                      >
                        {loading ? (
                          <>
                            <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                            <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                              Analyzing {multiDishes.filter(d => d.base64).length} dish{multiDishes.filter(d => d.base64).length > 1 ? 'es' : ''}...
                            </Text>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons name="food-variant" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base, color: '#FFFFFF' }}>
                              Analyze {multiDishes.filter(d => d.base64).length || 0} Dish{multiDishes.filter(d => d.base64).length !== 1 ? 'es' : ''}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="robot-happy" size={16} color={theme.colors.text + '55'} />
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.text + '55',
                    marginLeft: 6,
                  }}>
                    Powered by Google Gemini AI
                  </Text>
                </View>
              </View>
            </>
          ) : (
            /* History View */
            <View style={{ paddingHorizontal: 20 }}>
              {/* Search Bar */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                paddingHorizontal: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.text + '55'} />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (text.length === 0 || text.length >= 3) {
                      loadFoodHistory(1, text);
                    }
                  }}
                  placeholder="Search your food history..."
                  placeholderTextColor={theme.colors.text + '55'}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    color: theme.colors.text,
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.base,
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    loadFoodHistory(1, '');
                  }}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.text + '55'} />
                  </TouchableOpacity>
                )}
              </View>

              {historyLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text + '77',
                    marginTop: 12,
                  }}>
                    Loading your food history...
                  </Text>
                </View>
              ) : foodHistory.length === 0 ? (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 60,
                  paddingHorizontal: 20,
                }}>
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <MaterialCommunityIcons name="food-off" size={40} color={theme.colors.text + '44'} />
                  </View>
                  <Text style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.text,
                    marginBottom: 8,
                  }}>
                    No food logs yet
                  </Text>
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text + '77',
                    textAlign: 'center',
                  }}>
                    Start tracking your meals by analyzing your first food item!
                  </Text>
                  <TouchableOpacity
                    onPress={() => setViewMode('analyze')}
                    style={{
                      backgroundColor: theme.colors.primary,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 24,
                      marginTop: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                    <Text style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.base,
                      color: '#FFFFFF',
                      marginLeft: 8,
                    }}>
                      Add First Meal
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* History List */}
                  {foodHistory.map((log, index) => (
                    <TouchableOpacity
                      key={log._id}
                      onPress={() => {
                        setResult(log);
                        setViewMode('analyze');
                      }}
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 20,
                        marginBottom: 12,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row' }}>
                        {log.imageUrl ? (
                          <Image
                            source={{ uri: log.imageUrl }}
                            style={{ width: 100, height: 100 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{
                            width: 100,
                            height: 100,
                            backgroundColor: theme.colors.primary + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <MaterialCommunityIcons name="food" size={40} color={theme.colors.primary + '55'} />
                          </View>
                        )}
                        <View style={{ flex: 1, padding: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text
                              style={{
                                fontFamily: theme.fonts.heading,
                                fontSize: theme.fontSizes.base,
                                color: theme.colors.text,
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {log.dishName || log.foodName}
                            </Text>
                            {log.inputMethod === 'multi-dish' && (
                              <View style={{
                                backgroundColor: '#f59e0b',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6,
                                marginLeft: 8,
                              }}>
                                <Text style={{
                                  fontFamily: theme.fonts.bodyBold,
                                  fontSize: 10,
                                  color: '#FFFFFF',
                                }}>
                                  Multi
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <View style={{
                              backgroundColor: theme.colors.primary + '15',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 8,
                              marginRight: 8,
                            }}>
                              <Text style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.primary
                              }}>
                                {log.calories} kcal
                              </Text>
                            </View>
                            {log.servingSize && (
                              <Text style={{
                                fontFamily: theme.fonts.body,
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.text + '77'
                              }}>
                                {log.servingSize}
                              </Text>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.text + '55'} />
                            <Text style={{
                              fontFamily: theme.fonts.body,
                              fontSize: theme.fontSizes.xs,
                              color: theme.colors.text + '55',
                              marginLeft: 4,
                            }}>
                              {new Date(log.analyzedAt).toLocaleDateString()} at {new Date(log.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                        <View style={{ justifyContent: 'center', paddingRight: 14 }}>
                          <Ionicons name="chevron-forward" size={20} color={theme.colors.text + '44'} />
                        </View>
                      </View>

                      {log.allergyWarnings?.detected?.length > 0 && (
                        <View style={{
                          backgroundColor: '#fee2e2',
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                          <Ionicons name="warning" size={14} color="#ef4444" />
                          <Text style={{
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fontSizes.xs,
                            color: '#991b1b',
                            marginLeft: 6,
                          }}>
                            Contains: {log.allergyWarnings.detected.join(', ')}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 16,
                      marginBottom: 20,
                    }}>
                      <TouchableOpacity
                        onPress={() => loadFoodHistory(currentPage - 1, searchQuery)}
                        disabled={currentPage === 1}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: currentPage === 1 ? theme.colors.surface : theme.colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: currentPage === 1 ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? theme.colors.text + '55' : '#FFFFFF'} />
                      </TouchableOpacity>

                      <View style={{ paddingHorizontal: 20 }}>
                        <Text style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.text
                        }}>
                          Page <Text style={{ fontFamily: theme.fonts.bodyBold }}>{currentPage}</Text> of {totalPages}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => loadFoodHistory(currentPage + 1, searchQuery)}
                        disabled={currentPage === totalPages}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: currentPage === totalPages ? theme.colors.surface : theme.colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: currentPage === totalPages ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? theme.colors.text + '55' : '#FFFFFF'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Camera Modal */}
        <Modal
          visible={showCamera}
          animationType="slide"
          onRequestClose={closeCamera}
        >
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={facing}
            />

            {/* Top controls */}
            <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingTop: 10,
              }}>
                <TouchableOpacity
                  onPress={closeCamera}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleCameraFacing}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* Bottom capture button */}
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 50,
              paddingTop: 20,
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}>
              <TouchableOpacity
                onPress={capturePhoto}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 4,
                  borderColor: 'rgba(255,255,255,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: '#FFFFFF',
                }} />
              </TouchableOpacity>
              <Text style={{
                color: '#FFFFFF',
                marginTop: 12,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm
              }}>
                Tap to capture
              </Text>
            </View>
          </View>
        </Modal>

        {/* Battery Animation Overlay */}
        <BatteryAnimate
          visible={showBatteryAnimation}
          previousValue={batteryAnimationData.previousValue}
          newValue={batteryAnimationData.newValue}
          label={batteryAnimationData.label}
          onComplete={() => setShowBatteryAnimation(false)}
        />
      </SafeAreaView>
    </>
  );
}