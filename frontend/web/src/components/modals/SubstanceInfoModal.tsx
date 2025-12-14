import { useTheme } from '@/context/ThemeContext';
import './Modal.css';

const substances = [
  {
    label: "Smoking/Tobacco",
    description: "Cigarettes, cigars, chewing tobacco, vaping",
    risks: "Lung disease, heart disease, cancer, reduced life expectancy"
  },
  {
    label: "Alcohol",
    description: "Beer, wine, spirits, cocktails",
    risks: "Liver disease, heart problems, addiction, impaired judgment"
  },
  {
    label: "Recreational Drugs",
    description: "Marijuana, cocaine, amphetamines, etc.",
    risks: "Addiction, mental health issues, organ damage, legal problems"
  },
  {
    label: "Excessive Caffeine",
    description: "Coffee, energy drinks, supplements",
    risks: "Sleep problems, anxiety, heart palpitations, dependency"
  }
];

const severityLevels = [
  { level: "Mild", description: "Occasional use, minimal impact on daily life" },
  { level: "Moderate", description: "Regular use, some impact on health and activities" },
  { level: "Severe", description: "Heavy use, significant health and life impact" }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SubstanceInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <h2 className="modal-title" style={{ color: theme.colors.text }}>Substance Use Information</h2>
        <div className="modal-body">
          <p className="info-intro" style={{ color: theme.colors.textSecondary }}>
            This information helps assess health risks and provide appropriate recommendations.
            All information is confidential.
          </p>
          
          <div className="info-section">
            <h3 className="info-category" style={{ color: theme.colors.primary }}>Common Substances</h3>
            {substances.map((substance) => (
              <div key={substance.label} className="info-item">
                <h4 className="info-label" style={{ color: theme.colors.primary }}>{substance.label}</h4>
                <p className="info-description" style={{ color: theme.colors.textSecondary }}><strong>Includes:</strong> {substance.description}</p>
                <p className="info-risks" style={{ color: theme.colors.error }}><strong>Risks:</strong> {substance.risks}</p>
              </div>
            ))}
          </div>

          <div className="info-section">
            <h3 className="info-category" style={{ color: theme.colors.primary }}>Severity Levels</h3>
            {severityLevels.map((level) => (
              <div key={level.level} className="info-item">
                <h4 className="info-label" style={{ color: theme.colors.primary }}>{level.level}</h4>
                <p className="info-description" style={{ color: theme.colors.textSecondary }}>{level.description}</p>
              </div>
            ))}
          </div>

          <p className="info-note" style={{ backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.secondary, color: theme.colors.text }}>
            <strong>Important:</strong> If you're struggling with substance use, please consider
            seeking help from healthcare professionals or support groups.
          </p>
        </div>
        <button className="modal-button" onClick={onClose} style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}>
          Close
        </button>
      </div>
    </div>
  );
}
