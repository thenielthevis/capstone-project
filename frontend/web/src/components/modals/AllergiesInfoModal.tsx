import { useTheme } from '@/context/ThemeContext';
import './Modal.css';

const allergiesInfo = [
  {
    category: "Common Food Allergies",
    items: [
      "Peanuts",
      "Tree nuts (almonds, walnuts, cashews)",
      "Milk/Dairy",
      "Eggs",
      "Wheat/Gluten",
      "Soy",
      "Fish",
      "Shellfish"
    ]
  },
  {
    category: "Other Allergies",
    items: [
      "Sesame",
      "Corn",
      "Sulfites",
      "MSG",
      "Food dyes/additives"
    ]
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AllergiesInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <h2 className="modal-title" style={{ color: theme.colors.text }}>Allergies & Intolerances Guide</h2>
        <div className="modal-body">
          <p className="info-intro" style={{ color: theme.colors.textSecondary }}>
            Select any foods or ingredients that cause allergic reactions or that you need to avoid.
            This helps ensure your meal tracking and recommendations are safe for you.
          </p>
          {allergiesInfo.map((section) => (
            <div key={section.category} className="info-section">
              <h3 className="info-category" style={{ color: theme.colors.primary }}>{section.category}</h3>
              <ul className="info-list" style={{ color: theme.colors.text }}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
