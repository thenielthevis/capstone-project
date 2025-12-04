import { useTheme } from '@/context/ThemeContext';
import './Modal.css';

const dietaryPreferences = [
  {
    label: "Vegetarian",
    description: "No meat, poultry, or fish. Includes eggs and dairy."
  },
  {
    label: "Vegan",
    description: "No animal products including meat, dairy, eggs, and honey."
  },
  {
    label: "Pescatarian",
    description: "No meat or poultry, but includes fish and seafood."
  },
  {
    label: "Keto",
    description: "Low-carb, high-fat diet. Limits carbohydrates to promote ketosis."
  },
  {
    label: "Paleo",
    description: "Based on foods presumed to be available to paleolithic humans."
  },
  {
    label: "Low-Carb",
    description: "Restricts carbohydrate consumption for weight management."
  },
  {
    label: "Low-Fat",
    description: "Limits fat intake, especially saturated fats."
  },
  {
    label: "Halal",
    description: "Foods permissible under Islamic law."
  },
  {
    label: "Kosher",
    description: "Foods that comply with Jewish dietary laws."
  },
  {
    label: "Gluten-Free",
    description: "Excludes gluten found in wheat, barley, and rye."
  },
  {
    label: "Dairy-Free",
    description: "Excludes all dairy products."
  },
  {
    label: "Mediterranean",
    description: "Emphasizes fruits, vegetables, whole grains, and healthy fats."
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function DietaryPreferencesInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <h2 className="modal-title" style={{ color: theme.colors.text }}>Dietary Preferences Guide</h2>
        <div className="modal-body">
          <p className="info-intro" style={{ color: theme.colors.textSecondary }}>
            Choose dietary preferences that match your lifestyle, health goals, or religious beliefs.
          </p>
          {dietaryPreferences.map((pref) => (
            <div key={pref.label} className="info-item">
              <h3 className="info-label" style={{ color: theme.colors.primary }}>{pref.label}</h3>
              <p className="info-description" style={{ color: theme.colors.textSecondary }}>{pref.description}</p>
            </div>
          ))}
        </div>
        <button className="modal-button" onClick={onClose} style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}>
          Close
        </button>
      </div>
    </div>
  );
}
