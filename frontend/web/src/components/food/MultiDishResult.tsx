import { useTheme } from '@/context/ThemeContext'
import { MultiDishAnalysisResult, DishAnalysisResult } from '@/services/geminiService'
import { ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Heart, Utensils } from 'lucide-react'
import { useState } from 'react'
import './MultiDishResult.css'

interface MultiDishResultProps {
  result: MultiDishAnalysisResult
  onSaveToLog?: () => void
  saving?: boolean
}

function MultiDishResult({ result, onSaveToLog, saving }: MultiDishResultProps) {
  const { theme } = useTheme()
  const [expandedDishes, setExpandedDishes] = useState<string[]>([])

  const toggleDishExpand = (dishId: string) => {
    setExpandedDishes(prev =>
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#22c55e'
      case 'medium': return '#f59e0b'
      default: return '#ef4444'
    }
  }

  // Helper function to calculate percentage for visual bars
  const getPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100)
  }

  // Helper to render nutrient bar
  const NutrientBar = ({ label, value, unit, max, color = "#3b82f6" }: { label: string; value: number; unit: string; max: number; color?: string }) => {
    const percentage = getPercentage(value, max)
    return (
      <div className="nutrient-bar-item">
        <div className="nutrient-bar-header">
          <span className="nutrient-bar-label" style={{ color: theme.colors.text }}>{label}</span>
          <span className="nutrient-bar-value" style={{ color: theme.colors.text }}>{value}{unit}</span>
        </div>
        <div className="nutrient-bar-track" style={{ backgroundColor: theme.colors.surface }}>
          <div 
            className="nutrient-bar-fill" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="multi-result-container">
      {/* Summary Card */}
      <div 
        className="summary-card"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
      >
        <h2 style={{ color: theme.colors.text }}>
          Meal Analysis Summary
        </h2>
        
        <p className="meal-summary" style={{ color: theme.colors.textSecondary }}>
          {result.mealSummary}
        </p>

        {/* Health Score */}
        <div className="health-score-section">
          <div className="health-score-ring" style={{ borderColor: getHealthScoreColor(result.healthScore) }}>
            <span className="health-score-value" style={{ color: getHealthScoreColor(result.healthScore) }}>
              {result.healthScore}
            </span>
            <span className="health-score-label" style={{ color: theme.colors.textSecondary }}>
              Health Score
            </span>
          </div>
        </div>

        {/* Total Macros */}
        <div className="total-macros">
          <div className="macro-item">
            <span className="macro-value" style={{ color: theme.colors.primary }}>
              {result.totalCalories}
            </span>
            <span className="macro-label" style={{ color: theme.colors.textSecondary }}>
              Total Calories
            </span>
          </div>
          <div className="macro-item">
            <span className="macro-value" style={{ color: '#ef4444' }}>
              {result.totalNutrients.protein}g
            </span>
            <span className="macro-label" style={{ color: theme.colors.textSecondary }}>
              Protein
            </span>
          </div>
          <div className="macro-item">
            <span className="macro-value" style={{ color: '#f59e0b' }}>
              {result.totalNutrients.carbs}g
            </span>
            <span className="macro-label" style={{ color: theme.colors.textSecondary }}>
              Carbs
            </span>
          </div>
          <div className="macro-item">
            <span className="macro-value" style={{ color: '#8b5cf6' }}>
              {result.totalNutrients.fat}g
            </span>
            <span className="macro-label" style={{ color: theme.colors.textSecondary }}>
              Fat
            </span>
          </div>
        </div>

        {/* Visual Macronutrient Bars */}
        <div className="macro-visual">
          {result.totalNutrients.protein > 0 && (
            <NutrientBar 
              label="Protein" 
              value={result.totalNutrients.protein} 
              unit="g" 
              max={100} 
              color={theme.colors.primary}
            />
          )}
          {result.totalNutrients.carbs > 0 && (
            <NutrientBar 
              label="Carbs" 
              value={result.totalNutrients.carbs} 
              unit="g" 
              max={400} 
              color={theme.colors.secondary || '#f59e0b'}
            />
          )}
          {result.totalNutrients.fat > 0 && (
            <NutrientBar 
              label="Fat" 
              value={result.totalNutrients.fat} 
              unit="g" 
              max={150} 
              color={theme.colors.accent || '#8b5cf6'}
            />
          )}
          {result.totalNutrients.fiber > 0 && (
            <NutrientBar 
              label="Fiber" 
              value={result.totalNutrients.fiber} 
              unit="g" 
              max={40} 
              color="#22c55e"
            />
          )}
        </div>

        {/* Additional Nutrients */}
        <div className="additional-nutrients">
          <div className="nutrient-row">
            <span style={{ color: theme.colors.textSecondary }}>Fiber</span>
            <span style={{ color: theme.colors.text }}>{result.totalNutrients.fiber}g</span>
          </div>
          <div className="nutrient-row">
            <span style={{ color: theme.colors.textSecondary }}>Sugar</span>
            <span style={{ color: theme.colors.text }}>{result.totalNutrients.sugar}g</span>
          </div>
          <div className="nutrient-row">
            <span style={{ color: theme.colors.textSecondary }}>Sodium</span>
            <span style={{ color: result.totalNutrients.sodium > 1500 ? '#ef4444' : theme.colors.text }}>
              {result.totalNutrients.sodium}mg
              {result.totalNutrients.sodium > 1500 && ' (High)'}
            </span>
          </div>
          <div className="nutrient-row">
            <span style={{ color: theme.colors.textSecondary }}>Saturated Fat</span>
            <span style={{ color: theme.colors.text }}>{result.totalNutrients.saturatedFat}g</span>
          </div>
          <div className="nutrient-row">
            <span style={{ color: theme.colors.textSecondary }}>Cholesterol</span>
            <span style={{ color: theme.colors.text }}>{result.totalNutrients.cholesterol}mg</span>
          </div>
        </div>

        {/* Cuisine Breakdown */}
        <div className="cuisine-breakdown">
          <h4 style={{ color: theme.colors.text }}>Cuisine Types</h4>
          <div className="cuisine-tags">
            {Object.entries(result.cuisineBreakdown).map(([cuisine, count]) => (
              <span 
                key={cuisine}
                className="cuisine-tag"
                style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}
              >
                {cuisine} ({count})
              </span>
            ))}
          </div>
        </div>

        {/* Allergy Warnings */}
        {(result.combinedAllergyWarnings.detected.length > 0 || 
          result.combinedAllergyWarnings.mayContain.length > 0) && (
          <div className="allergy-warnings-section">
            <h4 style={{ color: '#ef4444' }}>
              <AlertTriangle size={18} /> Allergy Warnings
            </h4>
            {result.combinedAllergyWarnings.detected.length > 0 && (
              <div className="allergy-detected">
                <strong>Contains:</strong> {result.combinedAllergyWarnings.detected.join(', ')}
              </div>
            )}
            {result.combinedAllergyWarnings.mayContain.length > 0 && (
              <div className="allergy-may-contain">
                <strong>May contain:</strong> {result.combinedAllergyWarnings.mayContain.join(', ')}
              </div>
            )}
            {result.combinedAllergyWarnings.warnings.map((warning, i) => (
              <p key={i} className="allergy-warning-text">{warning}</p>
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div className="recommendations-section">
          <h4 style={{ color: theme.colors.text }}>
            <Heart size={18} /> Recommendations
          </h4>
          <ul>
            {result.overallRecommendations.map((rec, i) => (
              <li key={i} style={{ color: theme.colors.textSecondary }}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Save Button */}
        {onSaveToLog && (
          <button
            className="save-btn"
            onClick={onSaveToLog}
            disabled={saving}
            style={{ backgroundColor: theme.colors.primary }}
          >
            {saving ? 'Saving...' : 'Save to Food Log'}
          </button>
        )}
      </div>

      {/* Individual Dishes */}
      <div className="dishes-results">
        <h3 style={{ color: theme.colors.text }}>
          <Utensils size={20} /> Individual Dishes ({result.dishes.length})
        </h3>
        
        {result.dishes.map((dish) => (
          <DishCard 
            key={dish.dishId}
            dish={dish}
            expanded={expandedDishes.includes(dish.dishId)}
            onToggle={() => toggleDishExpand(dish.dishId)}
            theme={theme}
            getConfidenceColor={getConfidenceColor}
          />
        ))}
      </div>

      {/* Nutrition Sources */}
      <div 
        className="sources-section"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
      >
        <h4 style={{ color: theme.colors.text }}>Nutrition Sources</h4>
        <div className="sources-grid">
          {result.nutritionSources.map((source, i) => (
            <a 
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
              style={{ color: theme.colors.primary }}
            >
              {source.source} <ExternalLink size={12} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

interface DishCardProps {
  dish: DishAnalysisResult
  expanded: boolean
  onToggle: () => void
  theme: any
  getConfidenceColor: (confidence: string) => string
}

function DishCard({ dish, expanded, onToggle, theme, getConfidenceColor }: DishCardProps) {
  return (
    <div 
      className="dish-card"
      style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
    >
      <div className="dish-card-header" onClick={onToggle}>
        <div className="dish-info">
          <div>
            <h4 style={{ color: theme.colors.text }}>{dish.foodName}</h4>
            <span className="dish-cuisine-type" style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>
              {dish.cuisineType}
            </span>
            {dish.userProvidedName && dish.userProvidedName !== dish.foodName && (
              <span className="user-provided-name" style={{ color: theme.colors.textSecondary }}>
                (You entered: {dish.userProvidedName})
              </span>
            )}
          </div>
        </div>
        <div className="dish-summary">
          <span className="dish-calories" style={{ color: theme.colors.primary }}>
            {dish.calories} kcal
          </span>
          <span 
            className="confidence-badge"
            style={{ 
              backgroundColor: getConfidenceColor(dish.confidence) + '20',
              color: getConfidenceColor(dish.confidence)
            }}
          >
            {dish.confidence}
          </span>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="dish-card-details">
          {/* Serving Size */}
          <div className="detail-row">
            <span style={{ color: theme.colors.textSecondary }}>Serving Size:</span>
            <span style={{ color: theme.colors.text }}>{dish.servingSize}</span>
          </div>

          {/* Macros */}
          <div className="dish-macros">
            <div className="dish-macro">
              <span className="macro-val" style={{ color: '#ef4444' }}>{dish.nutrients.protein}g</span>
              <span className="macro-name">Protein</span>
            </div>
            <div className="dish-macro">
              <span className="macro-val" style={{ color: '#f59e0b' }}>{dish.nutrients.carbs}g</span>
              <span className="macro-name">Carbs</span>
            </div>
            <div className="dish-macro">
              <span className="macro-val" style={{ color: '#8b5cf6' }}>{dish.nutrients.fat}g</span>
              <span className="macro-name">Fat</span>
            </div>
            <div className="dish-macro">
              <span className="macro-val" style={{ color: '#22c55e' }}>{dish.nutrients.fiber}g</span>
              <span className="macro-name">Fiber</span>
            </div>
          </div>

          {/* Filipino/Asian Ingredients */}
          {(dish.filipinoIngredients.length > 0 || dish.asianIngredients.length > 0) && (
            <div className="special-ingredients">
              {dish.filipinoIngredients.length > 0 && (
                <div className="ingredient-group">
                  <span className="ingredient-label" style={{ color: theme.colors.textSecondary }}>
                    Filipino ingredients:
                  </span>
                  <span style={{ color: theme.colors.text }}>
                    {dish.filipinoIngredients.join(', ')}
                  </span>
                </div>
              )}
              {dish.asianIngredients.length > 0 && (
                <div className="ingredient-group">
                  <span className="ingredient-label" style={{ color: theme.colors.textSecondary }}>
                    Asian ingredients:
                  </span>
                  <span style={{ color: theme.colors.text }}>
                    {dish.asianIngredients.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Allergy Warnings */}
          {(dish.allergyWarnings.detected.length > 0 || dish.allergyWarnings.mayContain.length > 0) && (
            <div className="dish-allergy-warning">
              <AlertTriangle size={14} color="#ef4444" />
              <div>
                {dish.allergyWarnings.detected.length > 0 && (
                  <span className="detected">Contains: {dish.allergyWarnings.detected.join(', ')}</span>
                )}
                {dish.allergyWarnings.mayContain.length > 0 && (
                  <span className="may-contain">May contain: {dish.allergyWarnings.mayContain.join(', ')}</span>
                )}
              </div>
            </div>
          )}

          {/* Healthy Alternatives */}
          {dish.healthyAlternatives.length > 0 && (
            <div className="alternatives">
              <h5 style={{ color: theme.colors.text }}>Healthier Alternatives</h5>
              {dish.healthyAlternatives.map((alt, i) => (
                <div key={i} className="alternative-item">
                  <span className="alt-name" style={{ color: theme.colors.text }}>{alt.name}</span>
                  <span className="alt-reason" style={{ color: theme.colors.textSecondary }}>{alt.reason}</span>
                  <span className="alt-savings" style={{ color: '#22c55e' }}>-{alt.caloriesSaved} kcal</span>
                </div>
              ))}
            </div>
          )}

          {/* Recipe Links */}
          {dish.recipeLinks.length > 0 && (
            <div className="recipe-links">
              <h5 style={{ color: theme.colors.text }}>Recipe Links</h5>
              {dish.recipeLinks.map((link, i) => (
                <a 
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recipe-link"
                  style={{ color: theme.colors.primary }}
                >
                  {link.title} <ExternalLink size={12} />
                </a>
              ))}
            </div>
          )}

          {/* Notes */}
          {dish.notes && (
            <div className="dish-notes">
              <p style={{ color: theme.colors.textSecondary }}>{dish.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiDishResult
