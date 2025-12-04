import { useTheme } from '@/context/ThemeContext';
import './Modal.css';

const activityLevels = [
  {
    label: "1 - Sedentary",
    description: "Little or no physical activity. Most of the day is spent sitting (e.g., desk job, watching TV).",
    example: "Office worker with minimal movement, rarely exercises."
  },
  {
    label: "2 - Lightly Active",
    description: "Light exercise or sports 1–3 days/week, or a job with some walking.",
    example: "Teacher, cashier, or someone who walks short distances daily."
  },
  {
    label: "3 - Moderately Active",
    description: "Moderate exercise or sports 3–5 days/week, or a job with regular movement.",
    example: "Retail worker, nurse, or someone who jogs or cycles a few times a week."
  },
  {
    label: "4 - Very Active",
    description: "Hard exercise or sports 6–7 days/week, or a physically demanding job.",
    example: "Construction worker, fitness instructor, or someone who trains daily."
  },
  {
    label: "5 - Extremely Active",
    description: "Very hard exercise, physical job, or training twice a day.",
    example: "Professional athlete, manual laborer, or military personnel."
  }
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ActivityLevelInfoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
        <h2 className="modal-title" style={{ color: theme.colors.text }}>Activity Level Guide</h2>
        <div className="modal-body">
          {activityLevels.map((level) => (
            <div key={level.label} className="info-item">
              <h3 className="info-label" style={{ color: theme.colors.text }}>{level.label}</h3>
              <p className="info-description" style={{ color: theme.colors.textSecondary }}>{level.description}</p>
              <p className="info-example" style={{ color: theme.colors.textTertiary }}>Example: {level.example}</p>
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
