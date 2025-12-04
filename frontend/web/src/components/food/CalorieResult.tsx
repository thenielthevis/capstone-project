import { useTheme } from '@/context/ThemeContext'
import './CalorieResult.css'

function CalorieResult({ result, onReset, uploadedImage }: { result: any; onReset: () => void; uploadedImage?: string | null }) {
  const { theme } = useTheme()
  
  // Helper function to calculate percentage for visual bars
  const getPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  // Helper to render nutrient bar
  const NutrientBar = ({ label, value, unit, max, color = "#3b82f6" }: { label: string; value: number; unit: string; max: number; color?: string }) => {
    const percentage = getPercentage(value, max);
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
    );
  };

  return (
    <div className="result-container" style={{ backgroundColor: theme.colors.card }}>
      {/* Display uploaded image */}
      {uploadedImage && (
        <div className="uploaded-image-container">
          <img 
            src={uploadedImage} 
            alt="Analyzed food" 
            className="uploaded-image"
          />
        </div>
      )}
      
      <div className="result-header">
        <h2 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Analysis Results</h2>
      </div>

      <div className="result-content">
        <div className="food-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Food Identified</h3>
          <p className="food-name" style={{ color: theme.colors.text }}>{result.foodName}</p>
          {result.brandedProduct?.isBranded && (
            <div className="branded-badge" style={{ backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }}>
              <span className="brand-icon">🏷️</span>
              <span className="brand-text" style={{ color: theme.colors.primary }}>
                {result.brandedProduct.brandName && result.brandedProduct.productName
                  ? `${result.brandedProduct.brandName} - ${result.brandedProduct.productName}`
                  : result.brandedProduct.brandName || result.brandedProduct.productName || 'Branded Product'}
              </span>
            </div>
          )}
        </div>

        {result.allergyWarnings?.detected?.length > 0 && (
          <div className="allergy-warning" style={{ backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error }}>
            <h3 style={{ color: theme.colors.error, fontFamily: theme.fonts.heading }}>⚠️ Allergy Warning</h3>
            <p className="warning-text" style={{ color: theme.colors.error }}>{result.allergyWarnings.warning}</p>
            <div className="detected-allergens">
              <strong style={{ color: theme.colors.error }}>Detected allergens:</strong>
              <ul style={{ color: theme.colors.error }}>
                {result.allergyWarnings.detected.map((allergen: string, index: number) => (
                  <li key={index}>{allergen}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="calorie-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Calories</h3>
          <div className="calorie-visual">
            <div className="calorie-circle">
              <svg viewBox="0 0 120 120" className="calorie-svg">
                <circle cx="60" cy="60" r="54" className="calorie-bg" style={{ stroke: theme.colors.surface }} />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="54" 
                  className="calorie-progress"
                  style={{
                    strokeDasharray: `${(Number(result.calories) / 2500) * 339} 339`,
                    stroke: theme.colors.primary
                  }}
                />
              </svg>
              <div className="calorie-text">
                <span className="calorie-number" style={{ color: theme.colors.text }}>{result.calories}</span>
                <span className="calorie-unit" style={{ color: theme.colors.textSecondary }}>kcal</span>
              </div>
            </div>
          </div>
        </div>

        {result.servingSize && (
          <div className="serving-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Serving Size</h3>
            <p style={{ color: theme.colors.text }}>{result.servingSize}</p>
          </div>
        )}

        {result.nutrients && Object.keys(result.nutrients).length > 0 && (
          <div className="nutrients-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Nutrition Facts</h3>
            
            {/* Visual Macronutrient Bars */}
            <div className="macro-visual">
              {result.nutrients.protein > 0 && (
                <NutrientBar 
                  label="Protein" 
                  value={result.nutrients.protein} 
                  unit="g" 
                  max={50} 
                  color={theme.colors.primary}
                />
              )}
              {result.nutrients.carbs > 0 && (
                <NutrientBar 
                  label="Carbs" 
                  value={result.nutrients.carbs} 
                  unit="g" 
                  max={300} 
                  color={theme.colors.secondary}
                />
              )}
              {result.nutrients.fat > 0 && (
                <NutrientBar 
                  label="Fat" 
                  value={result.nutrients.fat} 
                  unit="g" 
                  max={78} 
                  color={theme.colors.accent}
                />
              )}
              {result.nutrients.fiber > 0 && (
                <NutrientBar 
                  label="Fiber" 
                  value={result.nutrients.fiber} 
                  unit="g" 
                  max={28} 
                  color={theme.colors.success}
                />
              )}
            </div>

            {/* Complete Nutrition Table */}
            <div className="nutrition-table" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <div className="nutrition-table-header" style={{ backgroundColor: theme.colors.surface }}>
                <h4 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>Complete Nutritional Information</h4>
              </div>
              <table className="nutrition-facts-table">
                <tbody>
                  {result.calories > 0 && (
                    <tr className="table-row-bold" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                      <td>Calories</td>
                      <td>{result.calories} kcal</td>
                    </tr>
                  )}
                  {result.nutrients.fat > 0 && (
                    <>
                      <tr className="table-row-bold table-separator" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Total Fat</td>
                        <td>{result.nutrients.fat}g</td>
                      </tr>
                      {result.nutrients.saturatedFat > 0 && (
                        <tr className="table-row-indent" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}>
                          <td>Saturated Fat</td>
                          <td>{result.nutrients.saturatedFat}g</td>
                        </tr>
                      )}
                      {result.nutrients.transFat > 0 && (
                        <tr className="table-row-indent" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}>
                          <td>Trans Fat</td>
                          <td>{result.nutrients.transFat}g</td>
                        </tr>
                      )}
                    </>
                  )}
                  {result.nutrients.cholesterol > 0 && (
                    <tr className="table-separator" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                      <td>Cholesterol</td>
                      <td>{result.nutrients.cholesterol}mg</td>
                    </tr>
                  )}
                  {result.nutrients.sodium > 0 && (
                    <tr className="table-separator" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                      <td>Sodium</td>
                      <td>{result.nutrients.sodium}mg</td>
                    </tr>
                  )}
                  {result.nutrients.potassium > 0 && (
                    <tr className="table-separator" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                      <td>Potassium</td>
                      <td>{result.nutrients.potassium}mg</td>
                    </tr>
                  )}
                  {result.nutrients.carbs > 0 && (
                    <>
                      <tr className="table-row-bold table-separator" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Total Carbohydrate</td>
                        <td>{result.nutrients.carbs}g</td>
                      </tr>
                      {result.nutrients.fiber > 0 && (
                        <tr className="table-row-indent" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}>
                          <td>Dietary Fiber</td>
                          <td>{result.nutrients.fiber}g</td>
                        </tr>
                      )}
                      {result.nutrients.sugar > 0 && (
                        <tr className="table-row-indent" style={{ color: theme.colors.textSecondary, borderColor: theme.colors.border }}>
                          <td>Total Sugars</td>
                          <td>{result.nutrients.sugar}g</td>
                        </tr>
                      )}
                    </>
                  )}
                  {result.nutrients.protein > 0 && (
                    <tr className="table-row-bold table-separator" style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                      <td>Protein</td>
                      <td>{result.nutrients.protein}g</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Vitamins & Minerals Table */}
              {(result.nutrients.vitaminA || result.nutrients.vitaminC || 
                result.nutrients.vitaminD || result.nutrients.calcium || 
                result.nutrients.iron) && (
                <table className="nutrition-facts-table vitamins-table">
                  <thead>
                    <tr style={{ backgroundColor: theme.colors.surface }}>
                      <th colSpan={2} style={{ color: theme.colors.text }}>Vitamins & Minerals (% Daily Value)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.nutrients.vitaminA > 0 && (
                      <tr style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Vitamin A</td>
                        <td>{result.nutrients.vitaminA}%</td>
                      </tr>
                    )}
                    {result.nutrients.vitaminC > 0 && (
                      <tr style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Vitamin C</td>
                        <td>{result.nutrients.vitaminC}%</td>
                      </tr>
                    )}
                    {result.nutrients.vitaminD > 0 && (
                      <tr style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Vitamin D</td>
                        <td>{result.nutrients.vitaminD}%</td>
                      </tr>
                    )}
                    {result.nutrients.calcium > 0 && (
                      <tr style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Calcium</td>
                        <td>{result.nutrients.calcium}%</td>
                      </tr>
                    )}
                    {result.nutrients.iron > 0 && (
                      <tr style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                        <td>Iron</td>
                        <td>{result.nutrients.iron}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Ingredients List for Branded Products */}
        {result.brandedProduct?.isBranded && result.brandedProduct?.ingredients && (
          <div className="ingredients-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>📋 Ingredients</h3>
            <p className="ingredients-text" style={{ color: theme.colors.textSecondary }}>{result.brandedProduct.ingredients}</p>
          </div>
        )}

        {/* Purchase Links for Branded Products */}
        {result.brandedProduct?.isBranded && result.brandedProduct?.purchaseLinks && (
          Object.values(result.brandedProduct.purchaseLinks).some(link => link) && (
            <div className="purchase-links-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
              <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>🛒 Where to Buy</h3>
              <div className="purchase-links">
                {result.brandedProduct.purchaseLinks.lazada && (
                  <a 
                    href={result.brandedProduct.purchaseLinks.lazada} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="purchase-link lazada"
                    style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
                  >
                    <span className="link-icon">🛍️</span>
                    <span className="link-text">Lazada</span>
                  </a>
                )}
                {result.brandedProduct.purchaseLinks.shopee && (
                  <a 
                    href={result.brandedProduct.purchaseLinks.shopee} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="purchase-link shopee"
                    style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
                  >
                    <span className="link-icon">🛍️</span>
                    <span className="link-text">Shopee</span>
                  </a>
                )}
                {result.brandedProduct.purchaseLinks.puregold && (
                  <a 
                    href={result.brandedProduct.purchaseLinks.puregold} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="purchase-link puregold"
                    style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }}
                  >
                    <span className="link-icon">🛍️</span>
                    <span className="link-text">Puregold</span>
                  </a>
                )}
              </div>
            </div>
          )
        )}

        {/* Recipe Links */}
        {result.recipeLinks?.length > 0 && (
          <div className="recipe-links-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>👨‍🍳 Recipe Ideas</h3>
            <div className="recipe-links">
              {result.recipeLinks.map((recipe: any, index: number) => (
                <a 
                  key={index}
                  href={recipe.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="recipe-link"
                  style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}
                >
                  <span className="link-icon">📖</span>
                  <div className="recipe-link-content">
                    <span className="recipe-title" style={{ color: theme.colors.text }}>{recipe.title}</span>
                    <span className="recipe-source" style={{ color: theme.colors.textSecondary }}>{recipe.source}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {result.allergyWarnings?.mayContain?.length > 0 && (
          <div className="may-contain-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>⚠️ May Contain</h3>
            <div className="allergen-tags">
              {result.allergyWarnings.mayContain.map((allergen: string, index: number) => (
                <span key={index} className="allergen-tag" style={{ backgroundColor: theme.colors.error + '20', color: theme.colors.error, borderColor: theme.colors.error }}>{allergen}</span>
              ))}
            </div>
          </div>
        )}

        {result.healthyAlternatives?.length > 0 && (
          <div className="alternatives-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>💡 Healthier Alternatives</h3>
            <div className="alternatives-list">
              {result.healthyAlternatives.map((alt: any, index: number) => (
                <div key={index} className="alternative-item" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <div className="alternative-header">
                    <span className="alternative-name" style={{ color: theme.colors.text }}>{alt.name}</span>
                    {alt.caloriesSaved > 0 && (
                      <span className="calories-saved" style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success }}>-{alt.caloriesSaved} kcal</span>
                    )}
                  </div>
                  <p className="alternative-reason" style={{ color: theme.colors.textSecondary }}>{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.confidence && (
          <div className="confidence-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <p className="confidence-text" style={{ color: theme.colors.textSecondary }}>
              Confidence: <strong style={{ color: theme.colors.text }}>{result.confidence}</strong>
            </p>
          </div>
        )}

        {result.notes && (
          <div className="notes-info" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <h3 style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}>ℹ️ Additional Notes</h3>
            <p style={{ color: theme.colors.textSecondary }}>{result.notes}</p>
          </div>
        )}
      </div>

      <div className="result-actions">
        <button 
          onClick={onReset} 
          className="btn-reset"
          style={{
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF'
          }}
        >
          Analyze Another Food
        </button>
      </div>
    </div>
  )
}

export default CalorieResult
