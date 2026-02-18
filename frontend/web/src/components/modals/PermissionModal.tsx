import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ShieldCheck, FileText, Lock, Check } from 'lucide-react';
import './Modal.css';

type Props = {
    visible: boolean;
    onAccept: () => void;
};

export default function PermissionModal({ visible, onAccept }: Props) {
    const { theme } = useTheme();
    const [agreed, setAgreed] = useState(false);

    if (!visible) return null;

    return (
        <div className="modal-overlay backdrop-blur-sm" style={{ backgroundColor: theme.colors.overlay }}>
            <div
                className="modal-content max-w-2xl"
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div className="text-center mb-6 pt-2">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${theme.colors.primary}18` }}
                    >
                        <ShieldCheck size={32} color={theme.colors.primary} />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>Terms & Privacy</h2>
                    <p className="mt-1" style={{ color: theme.colors.textSecondary }}>Please review before proceeding</p>
                </div>

                {/* Scrollable Content */}
                <div className="modal-body overflow-y-auto flex-1 pr-2 mb-6 custom-scrollbar">
                    {/* Terms & Conditions Section */}
                    <SectionCard
                        theme={theme}
                        icon={<FileText size={20} color="#3b82f6" />}
                        iconBg="#3b82f618"
                        title="Terms and Conditions"
                    >
                        <BulletPoint theme={theme} bold="Health Disclaimer:">
                            Lifora is designed for wellness tracking only. It is not intended to diagnose, treat, cure, or prevent any disease. AI-powered insights are for informational purposes only — always consult a qualified health professional.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Your Account:">
                            You are responsible for maintaining accurate account information and safeguarding your credentials. We may terminate accounts that violate our terms.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Your Content:">
                            You retain ownership of content you submit (photos, logs, comments). By posting, you grant Lifora a non-exclusive license to use it in connection with the service.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Acceptable Use:">
                            You agree not to use the service for unlawful purposes, upload malicious code, or attempt unauthorized access.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Liability:">
                            Lifora is provided "as is." We are not liable for indirect or consequential damages arising from your use of the service.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Changes:">
                            We may update these terms with 30 days notice. Continued use constitutes acceptance.
                        </BulletPoint>
                    </SectionCard>

                    {/* Privacy Policy Section */}
                    <SectionCard
                        theme={theme}
                        icon={<Lock size={20} color="#10b981" />}
                        iconBg="#10b98118"
                        title="Privacy Policy"
                    >
                        <BulletPoint theme={theme} bold="Data We Collect:">
                            Personal info (name, email), physical metrics (age, height, weight, BMI, waist), lifestyle data (activity, sleep, diet, allergies), and health profile (conditions, family history, medications, blood type).
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="How We Use It:">
                            To generate personalized health predictions, calculate calorie goals, track fitness progress, power the gamified wellness system, and improve our ML models.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Data Security:">
                            We implement administrative, technical, and physical safeguards to protect your health data. No system is 100% secure — we encourage strong passwords.
                        </BulletPoint>
                        <BulletPoint theme={theme} bold="Your Rights:">
                            You may delete your account and data through the app settings at any time.
                        </BulletPoint>
                    </SectionCard>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t" style={{ borderColor: theme.colors.border }}>
                    <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                        <div className="relative flex items-center mt-1">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={agreed}
                                onChange={() => setAgreed(!agreed)}
                            />
                            <div
                                className={`w-6 h-6 rounded border-2 transition-all flex items-center justify-center
                  ${agreed ? 'bg-primary border-primary' : 'bg-transparent border-gray-400 group-hover:border-primary'}
                `}
                                style={{
                                    backgroundColor: agreed ? theme.colors.primary : 'transparent',
                                    borderColor: agreed ? theme.colors.primary : ''
                                }}
                            >
                                {agreed && <Check size={16} color="white" strokeWidth={3} />}
                            </div>
                        </div>
                        <span className="text-sm leading-relaxed" style={{ color: theme.colors.text }}>
                            I have read and agree to the <span className="font-bold" style={{ color: theme.colors.primary }}>Terms and Conditions</span> and <span className="font-bold" style={{ color: theme.colors.primary }}>Privacy Policy</span>
                        </span>
                    </label>

                    <button
                        className={`w-full cursor-pointer py-4 rounded-xl font-bold text-lg transition-all
              ${agreed ? 'opacity-100 transform active:scale-95 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}
            `}
                        style={{
                            backgroundColor: agreed ? theme.colors.primary : theme.colors.textTertiary,
                            color: '#FFFFFF'
                        }}
                        disabled={!agreed}
                        onClick={onAccept}
                    >
                        Accept & Continue
                    </button>
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.colors.border};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme.colors.textTertiary};
        }
      `}</style>
        </div>
    );
}

function SectionCard({ theme, icon, iconBg, title, children }: any) {
    return (
        <div
            className="p-5 rounded-2xl mb-4"
            style={{ backgroundColor: theme.colors.surface }}
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: iconBg }}
                >
                    {icon}
                </div>
                <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>{title}</h3>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

function BulletPoint({ theme, bold, children }: any) {
    return (
        <div className="flex items-start gap-3">
            <div
                className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: theme.colors.primary }}
            />
            <p className="text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                <span className="font-bold" style={{ color: theme.colors.text }}>{bold}</span> {children}
            </p>
        </div>
    );
}
