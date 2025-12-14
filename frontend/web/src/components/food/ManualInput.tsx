import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import './ManualInput.css'

function ManualInput({ onAnalyze, loading }: { onAnalyze: (ingredients: string, dishName: string, allergies: string[]) => void; loading: boolean }) {
  const { theme } = useTheme()
  const [ingredients, setIngredients] = useState('')
  const [dishName, setDishName] = useState('')
  const [allergies, setAllergies] = useState('')
  const [commonAllergies, setCommonAllergies] = useState<string[]>([])

  const commonAllergensList = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 
    'Fish', 'Shellfish', 'Sesame', 'Gluten'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ingredients.trim()) {
      const allergyList = [...commonAllergies]
      if (allergies.trim()) {
        allergyList.push(...allergies.split(',').map((a: string) => a.trim()).filter((a: string) => a))
      }
      onAnalyze(ingredients, dishName, allergyList)
    }
  }

  const toggleCommonAllergy = (allergen: string) => {
    setCommonAllergies(prev => 
      prev.includes(allergen) 
        ? prev.filter((a: string) => a !== allergen)
        : [...prev, allergen]
    )
  }

  return (
    <div className="manual-input-container">
      <div 
        className="manual-input-box"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border
        }}
      >
        <h2 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Enter Ingredients Manually</h2>

        <form onSubmit={handleSubmit} className="manual-input-form">
          <div className="form-group">
            <label htmlFor="dishNameManual" style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>Dish Name (Optional)</label>
            <input
              id="dishNameManual"
              type="text"
              placeholder="e.g., Chicken Stir Fry, Greek Salad"
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
            <span className="input-hint" style={{ color: theme.colors.textSecondary }}>Help AI understand your meal better</span>
          </div>

          <div className="form-group">
            <label style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>Allergies & Dietary Restrictions (Optional)</label>
            <div className="allergies-selector">
              {commonAllergensList.map(allergen => (
                <button
                  key={allergen}
                  type="button"
                  className={`allergy-tag ${commonAllergies.includes(allergen) ? 'selected' : ''}`}
                  style={{
                    backgroundColor: commonAllergies.includes(allergen) ? theme.colors.success : theme.colors.surface,
                    borderColor: commonAllergies.includes(allergen) ? theme.colors.success : theme.colors.border,
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

          <div className="form-group">
            <label htmlFor="ingredients" style={{ color: theme.colors.text, fontWeight: theme.fontWeights.medium }}>Ingredients & Quantities</label>
            <textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Example:&#10;2 eggs&#10;1 cup rice&#10;100g chicken breast&#10;1 tablespoon olive oil&#10;1/2 avocado"
              rows={8}
              className="ingredients-textarea"
              style={{
                backgroundColor: theme.colors.input,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
              disabled={loading}
            />
            <span className="input-hint" style={{ color: theme.colors.textSecondary }}>Be specific with quantities for accurate estimates</span>
          </div>

          <button
            type="submit"
            className="analyze-button"
            style={{
              backgroundColor: theme.colors.success,
              color: '#FFFFFF'
            }}
            disabled={loading || !ingredients.trim()}
          >
            {loading ? 'Analyzing...' : 'Analyze Ingredients'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ManualInput
