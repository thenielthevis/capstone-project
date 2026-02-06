import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { LogIn, X } from 'lucide-react';
import './Modal.css';

interface GuestLimitModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function GuestLimitModal({ visible, onClose }: GuestLimitModalProps) {
    const { theme } = useTheme();
    const navigate = useNavigate();

    if (!visible) return null;

    const handleLogin = () => {
        onClose();
        navigate('/login');
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backgroundColor: theme.colors.overlay }}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    maxWidth: '400px'
                }}
            >
                <button
                    className="modal-close"
                    onClick={onClose}
                    style={{ color: theme.colors.textSecondary }}
                >
                    <X size={20} />
                </button>

                <div className="modal-body text-center py-6">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: theme.colors.primary + '20' }}
                    >
                        <LogIn size={32} style={{ color: theme.colors.primary }} />
                    </div>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: theme.colors.text }}>
                        Limit Reached
                    </h2>

                    <p className="mb-8" style={{ color: theme.colors.textSecondary }}>
                        You've reached your limit of 1 free analysis in guest mode.
                        Please log in to experience unlimited food logging and track your progress!
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            className="modal-button w-full py-3 rounded-xl font-bold transition-all"
                            onClick={handleLogin}
                            style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
                        >
                            Sign In to Continue
                        </button>
                        <button
                            className="w-full py-3 rounded-xl font-semibold transition-all"
                            onClick={onClose}
                            style={{ color: theme.colors.textSecondary }}
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
