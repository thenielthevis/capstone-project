import './CalorieResult.css'

function CalorieResult({ result, onReset, uploadedImage }: { result: any; onReset: () => void; uploadedImage?: string | null }) {
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
          <span className="nutrient-bar-label">{label}</span>
          <span className="nutrient-bar-value">{value}{unit}</span>
        </div>
        <div className="nutrient-bar-track">
          <div 
            className="nutrient-bar-fill" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="result-container">
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
        <h2>Analysis Results</h2>
      </div>

      <div className="result-content">
        <div className="food-info">
          <h3>Food Identified</h3>
          <p className="food-name">{result.foodName}</p>
          {result.brandedProduct?.isBranded && (
            <div className="branded-badge">
              <span className="brand-icon">🏷️</span>
              <span className="brand-text">
                {result.brandedProduct.brandName && result.brandedProduct.productName
                  ? `${result.brandedProduct.brandName} - ${result.brandedProduct.productName}`
                  : result.brandedProduct.brandName || result.brandedProduct.productName || 'Branded Product'}
              </span>
            </div>
          )}
        </div>

        {result.allergyWarnings?.detected?.length > 0 && (
          <div className="allergy-warning">
            <h3>⚠️ Allergy Warning</h3>
            <p className="warning-text">{result.allergyWarnings.warning}</p>
            <div className="detected-allergens">
              <strong>Detected allergens:</strong>
              <ul>
                {result.allergyWarnings.detected.map((allergen: string, index: number) => (
                  <li key={index}>{allergen}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="calorie-info">
          <h3>Calories</h3>
          <div className="calorie-visual">
            <div className="calorie-circle">
              <svg viewBox="0 0 120 120" className="calorie-svg">
                <circle cx="60" cy="60" r="54" className="calorie-bg" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="54" 
                  className="calorie-progress"
                  style={{
                    strokeDasharray: `${(Number(result.calories) / 2500) * 339} 339`
                  }}
                />
              </svg>
              <div className="calorie-text">
                <span className="calorie-number">{result.calories}</span>
                <span className="calorie-unit">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {result.servingSize && (
          <div className="serving-info">
            <h3>Serving Size</h3>
            <p>{result.servingSize}</p>
          </div>
        )}

        {result.nutrients && Object.keys(result.nutrients).length > 0 && (
          <div className="nutrients-info">
            <h3>Nutrition Facts</h3>
            
            {/* Visual Macronutrient Bars */}
            <div className="macro-visual">
              {result.nutrients.protein > 0 && (
                <NutrientBar 
                  label="Protein" 
                  value={result.nutrients.protein} 
                  unit="g" 
                  max={50} 
                  color="#3b82f6"
                />
              )}
              {result.nutrients.carbs > 0 && (
                <NutrientBar 
                  label="Carbs" 
                  value={result.nutrients.carbs} 
                  unit="g" 
                  max={300} 
                  color="#8b5cf6"
                />
              )}
              {result.nutrients.fat > 0 && (
                <NutrientBar 
                  label="Fat" 
                  value={result.nutrients.fat} 
                  unit="g" 
                  max={78} 
                  color="#ec4899"
                />
              )}
              {result.nutrients.fiber > 0 && (
                <NutrientBar 
                  label="Fiber" 
                  value={result.nutrients.fiber} 
                  unit="g" 
                  max={28} 
                  color="#10b981"
                />
              )}
            </div>

            {/* Complete Nutrition Table */}
            <div className="nutrition-table">
              <div className="nutrition-table-header">
                <h4>Complete Nutritional Information</h4>
              </div>
              <table className="nutrition-facts-table">
                <tbody>
                  {result.calories > 0 && (
                    <tr className="table-row-bold">
                      <td>Calories</td>
                      <td>{result.calories} kcal</td>
                    </tr>
                  )}
                  {result.nutrients.fat > 0 && (
                    <>
                      <tr className="table-row-bold table-separator">
                        <td>Total Fat</td>
                        <td>{result.nutrients.fat}g</td>
                      </tr>
                      {result.nutrients.saturatedFat > 0 && (
                        <tr className="table-row-indent">
                          <td>Saturated Fat</td>
                          <td>{result.nutrients.saturatedFat}g</td>
                        </tr>
                      )}
                      {result.nutrients.transFat > 0 && (
                        <tr className="table-row-indent">
                          <td>Trans Fat</td>
                          <td>{result.nutrients.transFat}g</td>
                        </tr>
                      )}
                    </>
                  )}
                  {result.nutrients.cholesterol > 0 && (
                    <tr className="table-separator">
                      <td>Cholesterol</td>
                      <td>{result.nutrients.cholesterol}mg</td>
                    </tr>
                  )}
                  {result.nutrients.sodium > 0 && (
                    <tr className="table-separator">
                      <td>Sodium</td>
                      <td>{result.nutrients.sodium}mg</td>
                    </tr>
                  )}
                  {result.nutrients.potassium > 0 && (
                    <tr className="table-separator">
                      <td>Potassium</td>
                      <td>{result.nutrients.potassium}mg</td>
                    </tr>
                  )}
                  {result.nutrients.carbs > 0 && (
                    <>
                      <tr className="table-row-bold table-separator">
                        <td>Total Carbohydrate</td>
                        <td>{result.nutrients.carbs}g</td>
                      </tr>
                      {result.nutrients.fiber > 0 && (
                        <tr className="table-row-indent">
                          <td>Dietary Fiber</td>
                          <td>{result.nutrients.fiber}g</td>
                        </tr>
                      )}
                      {result.nutrients.sugar > 0 && (
                        <tr className="table-row-indent">
                          <td>Total Sugars</td>
                          <td>{result.nutrients.sugar}g</td>
                        </tr>
                      )}
                    </>
                  )}
                  {result.nutrients.protein > 0 && (
                    <tr className="table-row-bold table-separator">
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
                    <tr>
                      <th colSpan={2}>Vitamins & Minerals (% Daily Value)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.nutrients.vitaminA > 0 && (
                      <tr>
                        <td>Vitamin A</td>
                        <td>{result.nutrients.vitaminA}%</td>
                      </tr>
                    )}
                    {result.nutrients.vitaminC > 0 && (
                      <tr>
                        <td>Vitamin C</td>
                        <td>{result.nutrients.vitaminC}%</td>
                      </tr>
                    )}
                    {result.nutrients.vitaminD > 0 && (
                      <tr>
                        <td>Vitamin D</td>
                        <td>{result.nutrients.vitaminD}%</td>
                      </tr>
                    )}
                    {result.nutrients.calcium > 0 && (
                      <tr>
                        <td>Calcium</td>
                        <td>{result.nutrients.calcium}%</td>
                      </tr>
                    )}
                    {result.nutrients.iron > 0 && (
                      <tr>
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
          <div className="ingredients-info">
            <h3>📋 Ingredients</h3>
            <p className="ingredients-text">{result.brandedProduct.ingredients}</p>
          </div>
        )}

        {/* Purchase Links for Branded Products */}
        {result.brandedProduct?.isBranded && result.brandedProduct?.purchaseLinks && (
          Object.values(result.brandedProduct.purchaseLinks).some(link => link) && (
            <div className="purchase-links-info">
              <h3>🛒 Where to Buy</h3>
              <div className="purchase-links">
                {result.brandedProduct.purchaseLinks.lazada && (
                  <a 
                    href={result.brandedProduct.purchaseLinks.lazada} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="purchase-link lazada"
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
          <div className="recipe-links-info">
            <h3>👨‍🍳 Recipe Ideas</h3>
            <div className="recipe-links">
              {result.recipeLinks.map((recipe: any, index: number) => (
                <a 
                  key={index}
                  href={recipe.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="recipe-link"
                >
                  <span className="link-icon">📖</span>
                  <div className="recipe-link-content">
                    <span className="recipe-title">{recipe.title}</span>
                    <span className="recipe-source">{recipe.source}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {result.allergyWarnings?.mayContain?.length > 0 && (
          <div className="may-contain-info">
            <h3>⚠️ May Contain</h3>
            <div className="allergen-tags">
              {result.allergyWarnings.mayContain.map((allergen: string, index: number) => (
                <span key={index} className="allergen-tag">{allergen}</span>
              ))}
            </div>
          </div>
        )}

        {result.healthyAlternatives?.length > 0 && (
          <div className="alternatives-info">
            <h3>💡 Healthier Alternatives</h3>
            <div className="alternatives-list">
              {result.healthyAlternatives.map((alt: any, index: number) => (
                <div key={index} className="alternative-item">
                  <div className="alternative-header">
                    <span className="alternative-name">{alt.name}</span>
                    {alt.caloriesSaved > 0 && (
                      <span className="calories-saved">-{alt.caloriesSaved} kcal</span>
                    )}
                  </div>
                  <p className="alternative-reason">{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.confidence && (
          <div className="confidence-info">
            <p className="confidence-text">
              Confidence: <strong>{result.confidence}</strong>
            </p>
          </div>
        )}

        {result.notes && (
          <div className="notes-info">
            <h3>ℹ️ Additional Notes</h3>
            <p>{result.notes}</p>
          </div>
        )}
      </div>

      <div className="result-actions">
        <button onClick={onReset} className="btn-reset">
          Analyze Another Food
        </button>
      </div>
    </div>
  )
}

export default CalorieResult
