import { useRef, useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Plus, X, Camera, RotateCcw } from 'lucide-react'
import './MultiDishUpload.css'

export interface DishEntry {
  id: string
  file: File | null
  previewUrl: string | null
  dishName: string
  servingSize: string
  additionalImages: { file: File; previewUrl: string }[]
}

interface MultiDishUploadProps {
  onAnalyze: (dishes: DishEntry[], allergies: string[]) => void
  loading: boolean
  userAllergies?: string[]
  userDietaryPreferences?: string[]
}

// Popular Filipino and Asian dishes for suggestions
// Popular Filipino dishes for suggestions (prioritized)
const FILIPINO_DISHES = [
  'Adobo', 'Sinigang', 'Kare-Kare', 'Lechon', 'Lumpia', 'Pancit Canton', 'Pancit Bihon',
  'Sisig', 'Crispy Pata', 'Bulalo', 'Tinola', 'Bicol Express', 'Laing', 'Pinakbet',
  'Dinuguan', 'Kaldereta', 'Menudo', 'Mechado', 'Afritada', 'Bistek Tagalog',
  'Torta', 'Longganisa', 'Tapa', 'Tocino', 'Bangus', 'Tilapia', 'Inihaw na Liempo',
  'Ginisang Munggo', 'Ginataang Kalabasa', 'Pininyahang Manok', 'Chicken Inasal',
  'Palabok', 'Lomi', 'Mami', 'Arroz Caldo', 'Lugaw', 'Champorado', 'Halo-Halo',
  'Leche Flan', 'Bibingka', 'Puto', 'Kakanin', 'Turon', 'Banana Cue', 'Camote Cue',
  'Tokwa\'t Baboy', 'Kilawin', 'Kinilaw', 'Ensaladang Talong', 'Tortang Talong',
  'Batchoy', 'Goto', 'Nilagang Baka', 'Sizzling Sisig', 'Pork Binagoongan',
  'Paksiw na Isda', 'Escabeche', 'Ginataang Hipon', 'Ginataang Gulay',
  'Sinangag', 'Tapsilog', 'Longsilog', 'Bangsilog', 'Cornsilog'
]

// Common allergens including Filipino-specific ingredients
const COMMON_ALLERGENS = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame', 'Gluten',
  'Shrimp Paste (Bagoong)', 'Fish Sauce (Patis)', 'Crab', 'Squid', 'Coconut',
  'MSG', 'Oyster Sauce'
]

const SERVING_SIZES = [
  'Small (1/2 cup / 100g)',
  'Regular (1 cup / 200g)',
  'Large (1.5 cups / 300g)',
  'Extra Large (2 cups / 400g)',
  'Sharing Size (3+ cups)',
  'Individual Pack',
  'Family Size'
]

function MultiDishUpload({ onAnalyze, loading, userAllergies = [], userDietaryPreferences = [] }: MultiDishUploadProps) {
  const { theme } = useTheme()
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const additionalFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  
  const [dishes, setDishes] = useState<DishEntry[]>([
    { id: '1', file: null, previewUrl: null, dishName: '', servingSize: 'Regular (1 cup / 200g)', additionalImages: [] }
  ])
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [customAllergies, setCustomAllergies] = useState('')
  const [showDishSuggestions, setShowDishSuggestions] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [allergiesInitialized, setAllergiesInitialized] = useState(false)

  // Auto-select allergies from user profile on mount
  useEffect(() => {
    if (allergiesInitialized || (userAllergies.length === 0 && userDietaryPreferences.length === 0)) return

    // Map user allergies to common allergens format
    const mappedAllergies = userAllergies.map((allergy: string) => 
      allergy.charAt(0).toUpperCase() + allergy.slice(1).toLowerCase()
    )

    // Set common allergens that match user's allergies
    const commonMatches = COMMON_ALLERGENS.filter(a =>
      mappedAllergies.some((ua: string) => ua.toLowerCase() === a.toLowerCase())
    )

    // Set custom allergies (ones not in COMMON_ALLERGENS)
    const customMatches = mappedAllergies.filter((ua: string) =>
      !COMMON_ALLERGENS.some(a => a.toLowerCase() === ua.toLowerCase())
    )

    // Also check dietary preferences for allergy-related ones
    const allergyPreferences = userDietaryPreferences.filter(p => 
      ['gluten-free', 'dairy-free'].includes(p)
    )
    allergyPreferences.forEach(pref => {
      if (pref === 'gluten-free' && !commonMatches.includes('Gluten')) {
        commonMatches.push('Gluten')
      }
      if (pref === 'dairy-free' && !commonMatches.includes('Milk')) {
        commonMatches.push('Milk')
      }
    })

    if (commonMatches.length > 0) {
      setSelectedAllergies(commonMatches)
    }
    if (customMatches.length > 0) {
      setCustomAllergies(customMatches.join(', '))
    }

    setAllergiesInitialized(true)
    console.log('[MultiDishUpload] Auto-selected allergies:', commonMatches, customMatches)
  }, [userAllergies, userDietaryPreferences, allergiesInitialized])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const addDish = () => {
    if (dishes.length >= 10) {
      alert('Maximum 10 dishes allowed per analysis')
      return
    }
    setDishes([...dishes, { 
      id: generateId(), 
      file: null, 
      previewUrl: null, 
      dishName: '', 
      servingSize: 'Regular (1 cup / 200g)',
      additionalImages: []
    }])
  }

  const removeDish = (id: string) => {
    if (dishes.length <= 1) return
    setDishes(dishes.filter(d => d.id !== id))
  }

  const handleFileSelect = (dishId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setDishes(dishes.map(d => 
      d.id === dishId ? { ...d, file, previewUrl } : d
    ))
  }

  const handleAdditionalImage = (dishId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB')
      return
    }

    const dish = dishes.find(d => d.id === dishId)
    if (dish && dish.additionalImages.length >= 4) {
      alert('Maximum 5 images per dish (1 main + 4 additional)')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setDishes(dishes.map(d => 
      d.id === dishId 
        ? { ...d, additionalImages: [...d.additionalImages, { file, previewUrl }] }
        : d
    ))
  }

  const removeAdditionalImage = (dishId: string, index: number) => {
    setDishes(dishes.map(d => 
      d.id === dishId 
        ? { ...d, additionalImages: d.additionalImages.filter((_, i) => i !== index) }
        : d
    ))
  }

  const updateDishName = (id: string, name: string) => {
    setDishes(dishes.map(d => d.id === id ? { ...d, dishName: name } : d))
  }

  const updateServingSize = (id: string, size: string) => {
    setDishes(dishes.map(d => d.id === id ? { ...d, servingSize: size } : d))
  }

  const toggleAllergy = (allergen: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    )
  }

  const getDishSuggestions = () => {
    if (!searchTerm) return FILIPINO_DISHES.slice(0, 20)
    return FILIPINO_DISHES.filter(dish => 
      dish.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15)
  }

  const selectDishSuggestion = (dishId: string, suggestion: string) => {
    updateDishName(dishId, suggestion)
    setShowDishSuggestions(null)
    setSearchTerm('')
  }

  const handleAnalyze = () => {
    const dishesWithImages = dishes.filter(d => d.file !== null)
    if (dishesWithImages.length === 0) {
      alert('Please upload at least one food image')
      return
    }

    const allAllergies = [...selectedAllergies]
    if (customAllergies.trim()) {
      allAllergies.push(...customAllergies.split(',').map(a => a.trim()).filter(a => a))
    }

    onAnalyze(dishesWithImages, allAllergies)
  }

  const resetAll = () => {
    setDishes([{ id: '1', file: null, previewUrl: null, dishName: '', servingSize: 'Regular (1 cup / 200g)', additionalImages: [] }])
    setSelectedAllergies([])
    setCustomAllergies('')
  }

  const dishesWithImages = dishes.filter(d => d.file !== null).length

  return (
    <div className="multi-dish-container">
      <div 
        className="multi-dish-card"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }}
      >
        <div className="card-header">
          <h2 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>
            Multi-Dish Food Analysis
          </h2>
          <p style={{ color: theme.colors.textSecondary }}>
            Upload multiple dishes for comprehensive nutrition analysis. Add multiple photos of the same dish for more accurate results.
          </p>
        </div>

        {/* Dishes List */}
        <div className="dishes-section">
          <div className="section-header">
            <label style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>
              Dishes ({dishesWithImages}/{dishes.length} uploaded)
            </label>
            <button 
              className="add-dish-btn"
              onClick={addDish}
              disabled={loading || dishes.length >= 10}
              style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
            >
              <Plus size={16} /> Add Dish
            </button>
          </div>

          <div className="dishes-grid">
            {dishes.map((dish, index) => (
              <div 
                key={dish.id} 
                className="dish-entry"
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: dish.file ? theme.colors.primary : theme.colors.border
                }}
              >
                <div className="dish-header">
                  <span style={{ color: theme.colors.text }}>Dish {index + 1}</span>
                  {dishes.length > 1 && (
                    <button 
                      className="remove-dish-btn"
                      onClick={() => removeDish(dish.id)}
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Main Image Upload */}
                <div className="image-upload-area">
                  <input
                    ref={(el) => { fileInputRefs.current[dish.id] = el }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(dish.id, e.target.files[0])}
                    disabled={loading}
                  />
                  
                  {dish.previewUrl ? (
                    <div className="preview-area">
                      <img src={dish.previewUrl} alt="Food preview" className="main-preview" />
                      <button
                        className="change-image-btn"
                        onClick={() => fileInputRefs.current[dish.id]?.click()}
                        disabled={loading}
                        style={{ backgroundColor: theme.colors.secondary }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="upload-placeholder"
                      onClick={() => fileInputRefs.current[dish.id]?.click()}
                      style={{ borderColor: theme.colors.border }}
                    >
                      <Camera size={32} color={theme.colors.primary} />
                      <span style={{ color: theme.colors.textSecondary }}>Upload Image</span>
                    </div>
                  )}
                </div>

                {/* Additional Images for accuracy */}
                {dish.file && (
                  <div className="additional-images">
                    <label style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
                      Add more angles (optional - improves accuracy)
                    </label>
                    <input
                      ref={(el) => { additionalFileInputRefs.current[dish.id] = el }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => e.target.files?.[0] && handleAdditionalImage(dish.id, e.target.files[0])}
                      disabled={loading}
                    />
                    <div className="additional-grid">
                      {dish.additionalImages.map((img, imgIndex) => (
                        <div key={imgIndex} className="additional-preview">
                          <img src={img.previewUrl} alt={`Additional ${imgIndex + 1}`} />
                          <button 
                            className="remove-img-btn"
                            onClick={() => removeAdditionalImage(dish.id, imgIndex)}
                            disabled={loading}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {dish.additionalImages.length < 4 && (
                        <button 
                          className="add-image-btn"
                          onClick={() => additionalFileInputRefs.current[dish.id]?.click()}
                          disabled={loading}
                          style={{ borderColor: theme.colors.border }}
                        >
                          <Plus size={16} color={theme.colors.primary} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Dish Name with suggestions */}
                <div className="dish-name-input">
                  <input
                    type="text"
                    placeholder="Dish name (e.g., Adobo, Sinigang)"
                    value={dish.dishName}
                    onChange={(e) => {
                      updateDishName(dish.id, e.target.value)
                      setSearchTerm(e.target.value)
                    }}
                    onFocus={() => setShowDishSuggestions(dish.id)}
                    disabled={loading}
                    style={{
                      backgroundColor: theme.colors.input,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                  />
                  {showDishSuggestions === dish.id && (
                    <div 
                      className="suggestions-dropdown"
                      style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
                    >
                      {getDishSuggestions().map((suggestion, i) => (
                        <button
                          key={i}
                          className="suggestion-item"
                          onClick={() => selectDishSuggestion(dish.id, suggestion)}
                          style={{ color: theme.colors.text }}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <button 
                        className="close-suggestions"
                        onClick={() => setShowDishSuggestions(null)}
                        style={{ color: theme.colors.textSecondary }}
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>

                {/* Serving Size */}
                <select
                  value={dish.servingSize}
                  onChange={(e) => updateServingSize(dish.id, e.target.value)}
                  disabled={loading}
                  className="serving-select"
                  style={{
                    backgroundColor: theme.colors.input,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  {SERVING_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Allergies Section */}
        <div className="allergies-section">
          <div className="allergies-header">
            <label style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>
              Allergies & Dietary Restrictions
            </label>
            {allergiesInitialized && selectedAllergies.length > 0 && (
              <span 
                className="auto-loaded-badge"
                style={{ 
                  backgroundColor: theme.colors.success + '20', 
                  color: theme.colors.success,
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginLeft: '8px'
                }}
              >
                Auto-loaded from profile
              </span>
            )}
          </div>
          <p style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '12px' }}>
            Includes common Filipino ingredients like fish sauce, shrimp paste, and coconut
          </p>
          <div className="allergies-grid">
            {COMMON_ALLERGENS.map(allergen => (
              <button
                key={allergen}
                type="button"
                className={`allergy-tag ${selectedAllergies.includes(allergen) ? 'selected' : ''}`}
                style={{
                  backgroundColor: selectedAllergies.includes(allergen) ? theme.colors.primary : theme.colors.surface,
                  borderColor: selectedAllergies.includes(allergen) ? theme.colors.primary : theme.colors.border,
                  color: selectedAllergies.includes(allergen) ? '#FFFFFF' : theme.colors.text
                }}
                onClick={() => toggleAllergy(allergen)}
                disabled={loading}
              >
                {allergen}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Other allergies (comma-separated)"
            value={customAllergies}
            onChange={(e) => setCustomAllergies(e.target.value)}
            disabled={loading}
            className="custom-allergies-input"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="reset-btn"
            onClick={resetAll}
            disabled={loading}
            style={{ 
              backgroundColor: theme.colors.surface, 
              borderColor: theme.colors.border,
              color: theme.colors.text 
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || dishesWithImages === 0}
            style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
          >
            {loading ? (
              <>Analyzing {dishesWithImages} dish{dishesWithImages > 1 ? 'es' : ''}...</>
            ) : (
              <>Analyze {dishesWithImages} Dish{dishesWithImages > 1 ? 'es' : ''}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MultiDishUpload
