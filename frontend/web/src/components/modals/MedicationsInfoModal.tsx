import { useTheme } from '@/context/ThemeContext';
import './Modal.css';

const medicationCategories = [
  {
    category: "Cardiovascular",
    examples: ["Blood pressure medications", "Statins", "Blood thinners", "Heart medications"]
  },
  {
    category: "Metabolic/Endocrine",
    examples: ["Insulin", "Metformin", "Thyroid medications", "Hormone therapy"]
  },
  {
    category: "Mental Health",
    examples: ["Antidepressants", "Anti-anxiety", "Mood stabilizers", "Sleep aids"]
  },
  {
    category: "Pain Management",
    examples: ["NSAIDs", "Opioids", "Muscle relaxants"]
  },
  {
    category: "Respiratory",
    examples: ["Inhalers", "Allergy medications", "Bronchodilators"]
  },
  {
    category: "Other",
    examples: ["Antibiotics", "Vitamins/Supplements", "Birth control"]
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MedicationsInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <h2 className="modal-title" style={{ color: theme.colors.text }}>Medications Guide</h2>
        <div className="modal-body">
          <p className="info-intro" style={{ color: theme.colors.textSecondary }}>
            List any medications you're currently taking. This helps identify potential
            interactions and provides more accurate health recommendations.
          </p>
          {medicationCategories.map((section) => (
            <div key={section.category} className="info-section">
              <h3 className="info-category" style={{ color: theme.colors.primary }}>{section.category}</h3>
              <ul className="info-list" style={{ color: theme.colors.text }}>
                {section.examples.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="info-note" style={{ backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.secondary, color: theme.colors.text }}>
            <strong>Note:</strong> Always consult with your healthcare provider before making
            changes to your medication regimen or lifestyle.
          </p>
        </div>
        <button className="modal-button" onClick={onClose} style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}>
          Close
        </button>
      </div>
    </div>
  );
}
