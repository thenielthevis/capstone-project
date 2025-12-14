import { useTheme } from '@/context/ThemeContext';
import './Modal.css';

const conditions = [
  {
    category: "Cardiovascular",
    items: ["Hypertension", "Heart disease", "High cholesterol"]
  },
  {
    category: "Metabolic",
    items: ["Diabetes (Type 1/2)", "Thyroid disorders", "Obesity"]
  },
  {
    category: "Respiratory",
    items: ["Asthma", "COPD", "Sleep apnea"]
  },
  {
    category: "Digestive",
    items: ["IBS", "Crohn's disease", "Celiac disease"]
  },
  {
    category: "Mental Health",
    items: ["Depression", "Anxiety", "Bipolar disorder"]
  },
  {
    category: "Other",
    items: ["Arthritis", "Kidney disease", "Liver disease", "Cancer"]
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function GeneticalConditionsInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <h2 className="modal-title" style={{ color: theme.colors.text }}>Health Conditions Guide</h2>
        <div className="modal-body">
          <p className="info-intro" style={{ color: theme.colors.textSecondary }}>
            Select any current health conditions or family history of conditions.
            This information helps provide personalized health recommendations.
          </p>
          {conditions.map((section) => (
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
