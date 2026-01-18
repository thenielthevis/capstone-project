import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';
import { createReport, ReportType, ReportReason, REPORT_REASONS } from '@/api/reportApi';
import { X, Flag, AlertCircle, Loader2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  itemId: string;
  itemName?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  itemId,
  itemName,
}) => {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  const getTitle = () => {
    switch (reportType) {
      case 'post':
        return 'Report Post';
      case 'message':
        return 'Report Message';
      case 'user':
        return 'Report User';
      default:
        return 'Report';
    }
  };

  const getDescription = () => {
    switch (reportType) {
      case 'post':
        return 'Why are you reporting this post?';
      case 'message':
        return 'Why are you reporting this message?';
      case 'user':
        return itemName ? `Why are you reporting ${itemName}?` : 'Why are you reporting this user?';
      default:
        return 'Why are you reporting this?';
    }
  };

  const handleSubmit = async () => {
    console.log('[ReportModal] Submit clicked:', { reportType, itemId, selectedReason, description });
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (!itemId) {
      setError('Invalid item to report');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[ReportModal] Creating report:', { reportType, itemId, reason: selectedReason });
      const response = await createReport({
        reportType,
        itemId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      console.log('[ReportModal] Report created successfully:', response);

      alert('Report submitted successfully. Thank you for helping keep our community safe.');
      handleClose();
    } catch (err: any) {
      console.error('[ReportModal] Error creating report:', err);
      const message = err?.response?.data?.message || 'Failed to submit report. Please try again.';
      if (message.includes('already reported')) {
        setError('You have already reported this item.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    setError(null);
    onClose();
  };

  // Don't render if not open - check early to avoid unnecessary JSX creation
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5" style={{ color: theme.colors.error }} />
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              {getTitle()}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:opacity-80 transition"
          >
            <X className="w-5 h-5" style={{ color: theme.colors.text }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p
            className="mb-4"
            style={{ color: theme.colors.textSecondary }}
          >
            {getDescription()}
          </p>

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: theme.colors.error + '20' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: theme.colors.error }} />
              <p className="text-sm" style={{ color: theme.colors.error }}>
                {error}
              </p>
            </div>
          )}

          {/* Reason Options */}
          <div className="space-y-2 mb-4">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className="flex items-center w-full p-3 rounded-lg transition hover:opacity-90"
                style={{
                  backgroundColor:
                    selectedReason === reason.value
                      ? theme.colors.primary + '20'
                      : theme.colors.background,
                  border: `1px solid ${
                    selectedReason === reason.value
                      ? theme.colors.primary
                      : theme.colors.border
                  }`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3"
                  style={{
                    borderColor:
                      selectedReason === reason.value
                        ? theme.colors.primary
                        : theme.colors.border,
                  }}
                >
                  {selectedReason === reason.value && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                  )}
                </div>
                <span style={{ color: theme.colors.text }}>{reason.label}</span>
              </button>
            ))}
          </div>

          {/* Additional Details */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text }}
            >
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about your report..."
              maxLength={1000}
              rows={4}
              className="w-full p-3 rounded-lg outline-none resize-none"
              style={{
                backgroundColor: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
              }}
            />
            <p
              className="text-xs mt-1 text-right"
              style={{ color: theme.colors.textTertiary }}
            >
              {description.length}/1000
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 p-4 border-t"
          style={{ borderColor: theme.colors.border }}
        >
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-lg transition hover:opacity-80"
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || loading}
            className="flex-1 py-3 rounded-lg transition hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: theme.colors.error,
              color: '#FFFFFF',
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Flag className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
};

export default ReportModal;
