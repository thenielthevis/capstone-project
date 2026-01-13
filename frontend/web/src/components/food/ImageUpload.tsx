import { useRef, useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import './ImageUpload.css'

interface ImageUploadProps {
  onImageUpload: (file: File, dishName: string, allergies: string[]) => void
  loading: boolean
  userAllergies?: string[]
  userDietaryPreferences?: string[]
}

function ImageUpload({ onImageUpload, loading, userAllergies = [], userDietaryPreferences = [] }: ImageUploadProps) {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [dishName, setDishName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [allergies, setAllergies] = useState('')
  const [commonAllergies, setCommonAllergies] = useState<string[]>([])
  const [allergiesInitialized, setAllergiesInitialized] = useState(false)

  const commonAllergensList = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 
    'Fish', 'Shellfish', 'Sesame', 'Gluten',
    'Shrimp Paste (Bagoong)', 'Fish Sauce (Patis)', 'Coconut'
  ]

  // Auto-select allergies from user profile on mount
  useEffect(() => {
    if (allergiesInitialized || (userAllergies.length === 0 && userDietaryPreferences.length === 0)) return

    // Map user allergies to common allergens format
    const mappedAllergies = userAllergies.map((allergy: string) => 
      allergy.charAt(0).toUpperCase() + allergy.slice(1).toLowerCase()
    )

    // Set common allergens that match user's allergies
    const commonMatches = commonAllergensList.filter(a =>
      mappedAllergies.some((ua: string) => ua.toLowerCase() === a.toLowerCase())
    )

    // Set custom allergies (ones not in commonAllergensList)
    const customMatches = mappedAllergies.filter((ua: string) =>
      !commonAllergensList.some(a => a.toLowerCase() === ua.toLowerCase())
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
      setCommonAllergies(commonMatches)
    }
    if (customMatches.length > 0) {
      setAllergies(customMatches.join(', '))
    }

    setAllergiesInitialized(true)
    console.log('[ImageUpload] Auto-selected allergies:', commonMatches, customMatches)
  }, [userAllergies, userDietaryPreferences, allergiesInitialized])

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleAnalyze = () => {
    if (selectedFile) {
      const allergyList = [...commonAllergies]
      if (allergies.trim()) {
        allergyList.push(...allergies.split(',').map((a: string) => a.trim()).filter((a: string) => a))
      }
      onImageUpload(selectedFile, dishName, allergyList)
    }
  }

  const toggleCommonAllergy = (allergen: string) => {
    setCommonAllergies(prev => 
      prev.includes(allergen) 
        ? prev.filter((a: string) => a !== allergen)
        : [...prev, allergen]
    )
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="upload-container">
      <div 
        className="upload-form-card"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }}
      >
        <h2 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Upload Food Image</h2>
        
        <div className="form-group">
          <label htmlFor="dishName" style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>Dish Name (Optional)</label>
          <input
            id="dishName"
            type="text"
            placeholder="e.g., Grilled Chicken Salad, Pasta Carbonara"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            className="dish-input"
            style={{ 
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            disabled={loading}
          />
          <span className="input-hint" style={{ color: theme.colors.textSecondary }}>Help AI identify your food more accurately</span>
        </div>

        <div className="form-group">
          <div className="allergies-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>Allergies & Dietary Restrictions (Optional)</label>
            {allergiesInitialized && commonAllergies.length > 0 && (
              <span 
                style={{ 
                  backgroundColor: '#22c55e20', 
                  color: '#22c55e',
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
          <div className="allergies-selector">
            {commonAllergensList.map(allergen => (
              <button
                key={allergen}
                type="button"
                className={`allergy-tag ${commonAllergies.includes(allergen) ? 'selected' : ''}`}
                style={{
                  backgroundColor: commonAllergies.includes(allergen) ? theme.colors.primary : theme.colors.surface,
                  borderColor: commonAllergies.includes(allergen) ? theme.colors.primary : theme.colors.border,
                  color: commonAllergies.includes(allergen) ? '#FFFFFF' : theme.colors.text
                }}
                onClick={() => toggleCommonAllergy(allergen)}
                disabled={loading}
              >
                {allergen}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Other allergies (comma-separated)"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="dish-input"
            style={{ 
              marginTop: '10px',
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
            disabled={loading}
          />
          <span className="input-hint" style={{ color: theme.colors.textSecondary }}>We'll check for allergens and warn you</span>
        </div>

        <div
          className={`upload-box ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: dragActive ? theme.colors.primary : theme.colors.border
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
            disabled={loading}
          />

          <div className="upload-content">
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-image" />
                <p className="upload-instruction" style={{ color: theme.colors.text }}>Selected: {selectedFile?.name}</p>
                <button
                  className="change-button"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    color: '#FFFFFF'
                  }}
                  onClick={handleButtonClick}
                  disabled={loading}
                >
                  Change Image
                </button>
              </div>
            ) : (
              <>
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="upload-instruction" style={{ color: theme.colors.text }}>
                  Drag and drop an image here, or click to select
                </p>
                <button
                  className="upload-button"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#FFFFFF'
                  }}
                  onClick={handleButtonClick}
                  disabled={loading}
                >
                  Choose Image
                </button>
                <p className="upload-hint" style={{ color: theme.colors.textSecondary }}>
                  Supports: JPG, PNG, GIF (Max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {selectedFile && (
          <button
            className="analyze-button"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#FFFFFF'
            }}
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ImageUpload
