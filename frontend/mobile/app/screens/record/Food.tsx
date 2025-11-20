import React, { useState, useRef } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeFood, analyzeIngredients, FoodAnalysisResult } from '../../services/geminiService';

const COMMON_ALLERGENS = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy',
  'Fish', 'Shellfish', 'Sesame', 'Gluten'
];

export default function Food() {
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
          <Text className="text-sm font-semibold text-gray-900">{value}{unit}</Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
      <ScrollView className="flex-1 bg-white">
        <View className="p-4">
          <View className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-2">Analysis Results</Text>
            <Text className="text-lg font-semibold text-blue-700">{result.foodName}</Text>
            
            {result.brandedProduct?.isBranded && (
              <View className="mt-2 bg-indigo-100 px-3 py-2 rounded-full inline-flex flex-row items-center">
                <Text className="text-lg mr-1">🏷️</Text>
                <Text className="text-sm font-medium text-indigo-700">
                  {result.brandedProduct.brandName && result.brandedProduct.productName
                    ? `${result.brandedProduct.brandName} - ${result.brandedProduct.productName}`
                    : result.brandedProduct.brandName || result.brandedProduct.productName || 'Branded Product'}
                </Text>
              </View>
            )}
          </View>

          {imageUri && (
            <View className="mb-4 rounded-lg overflow-hidden border-2 border-blue-500">
              <Image source={{ uri: imageUri }} className="w-full h-48" resizeMode="cover" />
            </View>
          )}

          {result.allergyWarnings?.detected?.length > 0 && (
            <View className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-red-700 mb-2">⚠️ Allergy Warning</Text>
              <Text className="text-sm font-semibold text-red-900 mb-2">{result.allergyWarnings.warning}</Text>
              <Text className="text-sm font-medium text-red-800 mb-1">Detected allergens:</Text>
              {result.allergyWarnings.detected.map((allergen, index) => (
                <Text key={index} className="text-sm text-red-700 ml-2">• {allergen}</Text>
              ))}
            </View>
          )}

          <View className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 mb-4 items-center">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Calories</Text>
            <View className="w-32 h-32 rounded-full bg-white shadow-lg items-center justify-center mb-2">
              <Text className="text-4xl font-bold text-blue-600">{result.calories}</Text>
              <Text className="text-sm text-gray-600">kcal</Text>
            </View>
            {result.servingSize && (
              <View className="mt-2">
                <Text className="text-sm text-gray-600">Serving Size</Text>
                <Text className="text-sm font-medium text-gray-800">{result.servingSize}</Text>
              </View>
            )}
          </View>

          {result.nutrients && Object.keys(result.nutrients).length > 0 && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Nutrition Facts</Text>
              
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

              <View className="mt-4 pt-4 border-t border-gray-200">
                <Text className="text-base font-semibold text-gray-800 mb-3">Complete Nutritional Information</Text>
                {result.calories > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm font-medium text-gray-700">Calories</Text>
                    <Text className="text-sm text-gray-900">{result.calories} kcal</Text>
                  </View>
                )}
                {result.nutrients.fat! > 0 && (
                  <>
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm font-semibold text-gray-800">Total Fat</Text>
                      <Text className="text-sm font-semibold text-gray-900">{result.nutrients.fat}g</Text>
                    </View>
                    {result.nutrients.saturatedFat! > 0 && (
                      <View className="flex-row justify-between py-2 border-b border-gray-100 pl-4">
                        <Text className="text-sm text-gray-700">Saturated Fat</Text>
                        <Text className="text-sm text-gray-900">{result.nutrients.saturatedFat}g</Text>
                      </View>
                    )}
                    {result.nutrients.transFat! > 0 && (
                      <View className="flex-row justify-between py-2 border-b border-gray-100 pl-4">
                        <Text className="text-sm text-gray-700">Trans Fat</Text>
                        <Text className="text-sm text-gray-900">{result.nutrients.transFat}g</Text>
                      </View>
                    )}
                  </>
                )}
                {result.nutrients.cholesterol! > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-700">Cholesterol</Text>
                    <Text className="text-sm text-gray-900">{result.nutrients.cholesterol}mg</Text>
                  </View>
                )}
                {result.nutrients.sodium! > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-700">Sodium</Text>
                    <Text className="text-sm text-gray-900">{result.nutrients.sodium}mg</Text>
                  </View>
                )}
                {result.nutrients.potassium! > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-700">Potassium</Text>
                    <Text className="text-sm text-gray-900">{result.nutrients.potassium}mg</Text>
                  </View>
                )}
                {result.nutrients.carbs! > 0 && (
                  <>
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm font-semibold text-gray-800">Total Carbohydrate</Text>
                      <Text className="text-sm font-semibold text-gray-900">{result.nutrients.carbs}g</Text>
                    </View>
                    {result.nutrients.fiber! > 0 && (
                      <View className="flex-row justify-between py-2 border-b border-gray-100 pl-4">
                        <Text className="text-sm text-gray-700">Dietary Fiber</Text>
                        <Text className="text-sm text-gray-900">{result.nutrients.fiber}g</Text>
                      </View>
                    )}
                    {result.nutrients.sugar! > 0 && (
                      <View className="flex-row justify-between py-2 border-b border-gray-100 pl-4">
                        <Text className="text-sm text-gray-700">Total Sugars</Text>
                        <Text className="text-sm text-gray-900">{result.nutrients.sugar}g</Text>
                      </View>
                    )}
                  </>
                )}
                {result.nutrients.protein! > 0 && (
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm font-semibold text-gray-800">Protein</Text>
                    <Text className="text-sm font-semibold text-gray-900">{result.nutrients.protein}g</Text>
                  </View>
                )}
              </View>

              {(result.nutrients.vitaminA || result.nutrients.vitaminC || 
                result.nutrients.vitaminD || result.nutrients.calcium || 
                result.nutrients.iron) && (
                <View className="mt-4 pt-4 border-t border-gray-200">
                  <Text className="text-base font-semibold text-gray-800 mb-3">Vitamins & Minerals (% Daily Value)</Text>
                  {result.nutrients.vitaminA! > 0 && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-700">Vitamin A</Text>
                      <Text className="text-sm text-gray-900">{result.nutrients.vitaminA}%</Text>
                    </View>
                  )}
                  {result.nutrients.vitaminC! > 0 && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-700">Vitamin C</Text>
                      <Text className="text-sm text-gray-900">{result.nutrients.vitaminC}%</Text>
                    </View>
                  )}
                  {result.nutrients.vitaminD! > 0 && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-700">Vitamin D</Text>
                      <Text className="text-sm text-gray-900">{result.nutrients.vitaminD}%</Text>
                    </View>
                  )}
                  {result.nutrients.calcium! > 0 && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-700">Calcium</Text>
                      <Text className="text-sm text-gray-900">{result.nutrients.calcium}%</Text>
                    </View>
                  )}
                  {result.nutrients.iron! > 0 && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-gray-700">Iron</Text>
                      <Text className="text-sm text-gray-900">{result.nutrients.iron}%</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {result.brandedProduct?.isBranded && result.brandedProduct?.ingredients && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-2">📋 Ingredients</Text>
              <Text className="text-sm text-gray-700">{result.brandedProduct.ingredients}</Text>
            </View>
          )}

          {result.brandedProduct?.isBranded && result.brandedProduct?.purchaseLinks && (
            Object.values(result.brandedProduct.purchaseLinks).some(link => link) && (
              <View className="bg-gray-50 rounded-lg p-4 mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-3">🛒 Where to Buy</Text>
                <View className="space-y-2">
                  {result.brandedProduct.purchaseLinks.lazada && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(result.brandedProduct.purchaseLinks.lazada!)}
                      className="bg-orange-500 px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                    >
                      <Text className="text-white font-semibold">🛍️ Lazada</Text>
                      <Text className="text-white">→</Text>
                    </TouchableOpacity>
                  )}
                  {result.brandedProduct.purchaseLinks.shopee && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(result.brandedProduct.purchaseLinks.shopee!)}
                      className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                    >
                      <Text className="text-white font-semibold">🛍️ Shopee</Text>
                      <Text className="text-white">→</Text>
                    </TouchableOpacity>
                  )}
                  {result.brandedProduct.purchaseLinks.puregold && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(result.brandedProduct.purchaseLinks.puregold!)}
                      className="bg-green-600 px-4 py-3 rounded-lg flex-row items-center justify-between mb-2"
                    >
                      <Text className="text-white font-semibold">🛍️ Puregold</Text>
                      <Text className="text-white">→</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          )}

          {result.recipeLinks?.length > 0 && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">👨‍🍳 Recipe Ideas</Text>
              {result.recipeLinks.map((recipe, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(recipe.url)}
                  className="bg-white px-4 py-3 rounded-lg flex-row items-center justify-between mb-2 border border-gray-200"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{recipe.title}</Text>
                    <Text className="text-xs text-gray-500">{recipe.source}</Text>
                  </View>
                  <Text className="text-blue-500">→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {result.nutritionSources?.length > 0 && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-2">🔍 Nutrition Data Sources</Text>
              <Text className="text-sm text-gray-600 mb-3">Cross-referenced from:</Text>
              {result.nutritionSources.map((source, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => Linking.openURL(source.url)}
                  className="bg-white px-4 py-3 rounded-lg flex-row items-center justify-between mb-2 border border-gray-200"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{source.source}</Text>
                    <Text className={`text-xs mt-1 ${
                      source.reliability === 'high' ? 'text-green-600' :
                      source.reliability === 'medium' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {source.reliability === 'high' ? '✓ High' :
                       source.reliability === 'medium' ? '◐ Medium' :
                       '○ Low'} Reliability
                    </Text>
                  </View>
                  <Text className="text-blue-500">→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {result.allergyWarnings?.mayContain?.length > 0 && (
            <View className="bg-yellow-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-yellow-800 mb-2">⚠️ May Contain</Text>
              <View className="flex-row flex-wrap">
                {result.allergyWarnings.mayContain.map((allergen, index) => (
                  <View key={index} className="bg-yellow-200 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-sm text-yellow-800">{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {result.healthyAlternatives?.length > 0 && (
            <View className="bg-green-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-green-800 mb-3">💡 Healthier Alternatives</Text>
              {result.healthyAlternatives.map((alt, index) => (
                <View key={index} className="bg-white rounded-lg p-3 mb-3 border border-green-200">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-semibold text-gray-900 flex-1">{alt.name}</Text>
                    {alt.caloriesSaved > 0 && (
                      <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-sm font-medium text-green-700">-{alt.caloriesSaved} kcal</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-600">{alt.reason}</Text>
                </View>
              ))}
            </View>
          )}

          {result.confidence && (
            <View className="mb-4">
              <Text className="text-sm text-gray-600">
                Confidence: <Text className="font-semibold text-gray-900">{result.confidence}</Text>
              </Text>
            </View>
          )}

          {result.notes && (
            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              <Text className="text-lg font-bold text-blue-800 mb-2">ℹ️ Additional Notes</Text>
              <Text className="text-sm text-gray-700">{result.notes}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleReset}
            className="bg-blue-500 py-4 rounded-lg items-center mb-6"
          >
            <Text className="text-white font-semibold text-base">Analyze Another Food</Text>
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
      </>
    );
  }

  return (
    <>
    <ScrollView className="flex-1 bg-white">
      <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-b-2xl p-6 mb-4 shadow-lg">
        <Text className="text-3xl font-bold text-white mb-2">Food Calorie Tracker</Text>
        <Text className="text-base text-blue-100 mb-4">Upload a food image or enter ingredients manually</Text>
        
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setInputMode('image')}
            className={`flex-1 py-3 rounded-lg ${
              inputMode === 'image' ? 'bg-white' : 'bg-blue-400/30'
            }`}
          >
            <Text className={`text-center font-semibold ${
              inputMode === 'image' ? 'text-blue-600' : 'text-white'
            }`}>
              Upload Image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setInputMode('manual')}
            className={`flex-1 py-3 rounded-lg ${
              inputMode === 'manual' ? 'bg-white' : 'bg-blue-400/30'
            }`}
          >
            <Text className={`text-center font-semibold ${
              inputMode === 'manual' ? 'text-blue-600' : 'text-white'
            }`}>
              Manual Input
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="p-4">
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <Text className="text-red-800">{error}</Text>
          </View>
        )}

        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            {inputMode === 'image' ? 'Upload Food Image' : 'Enter Ingredients'}
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Dish Name (Optional)</Text>
            <TextInput
              value={dishName}
              onChangeText={setDishName}
              placeholder="e.g., Grilled Chicken Salad"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              editable={!loading}
            />
            <Text className="text-xs text-gray-500 mt-1">Help AI identify your food more accurately</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Allergies & Dietary Restrictions (Optional)</Text>
            <View className="flex-row flex-wrap mb-2">
              {COMMON_ALLERGENS.map(allergen => (
                <TouchableOpacity
                  key={allergen}
                  onPress={() => toggleAllergy(allergen)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                    selectedAllergies.includes(allergen)
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${
                    selectedAllergies.includes(allergen)
                      ? 'text-white font-medium'
                      : 'text-gray-700'
                  }`}>
                    {allergen}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={customAllergies}
              onChangeText={setCustomAllergies}
              placeholder="Other allergies (comma-separated)"
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
              editable={!loading}
            />
            <Text className="text-xs text-gray-500 mt-1">We'll check for allergens and warn you</Text>
          </View>

          {inputMode === 'image' ? (
            <>
              {imageUri ? (
                <View className="mb-4">
                  <Image source={{ uri: imageUri }} className="w-full h-64 rounded-lg mb-3" resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setImageUri(null)}
                    className="bg-gray-200 py-2 rounded-lg"
                    disabled={loading}
                  >
                    <Text className="text-center text-gray-700 font-medium">Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center mb-4">
                  <Text className="text-6xl mb-3">📷</Text>
                  <Text className="text-base text-gray-600 mb-4 text-center">Take a photo or choose from gallery</Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={takePhoto}
                      className="bg-blue-500 px-6 py-3 rounded-lg"
                      disabled={loading}
                    >
                      <Text className="text-white font-semibold">Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={pickImage}
                      className="bg-blue-500 px-6 py-3 rounded-lg"
                      disabled={loading}
                    >
                      <Text className="text-white font-semibold">Choose Image</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-sm text-gray-500 mt-3">Supports: JPG, PNG (Max 10MB)</Text>
                </View>
              )}

              {imageUri && (
                <TouchableOpacity
                  onPress={handleAnalyzeImage}
                  disabled={loading}
                  className={`py-4 rounded-lg items-center ${
                    loading ? 'bg-blue-300' : 'bg-blue-500'
                  }`}
                >
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator color="white" className="mr-2" />
                      <Text className="text-white font-semibold text-base">Analyzing...</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-semibold text-base">Analyze Image</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Ingredients & Quantities</Text>
                <TextInput
                  value={ingredients}
                  onChangeText={setIngredients}
                  placeholder={'Example:\n2 eggs\n1 cup rice\n100g chicken breast\n1 tablespoon olive oil\n1/2 avocado'}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-40"
                  editable={!loading}
                />
                <Text className="text-xs text-gray-500 mt-1">Be specific with quantities for accurate estimates</Text>
              </View>

              <TouchableOpacity
                onPress={handleAnalyzeIngredients}
                disabled={loading || !ingredients.trim()}
                className={`py-4 rounded-lg items-center ${
                  loading || !ingredients.trim() ? 'bg-blue-300' : 'bg-blue-500'
                }`}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="white" className="mr-2" />
                    <Text className="text-white font-semibold text-base">Analyzing...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">Analyze Ingredients</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="items-center py-4">
          <Text className="text-sm text-gray-500">Powered by Google Gemini AI</Text>
        </View>
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
    </>
  );
}