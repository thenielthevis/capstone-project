import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import Header from '@/components/Header';
import { createReport, ReportType, ReportReason, REPORT_REASONS } from '@/api/reportApi';
import { ArrowLeft, Flag, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function Report() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reportType = (searchParams.get('type') as ReportType) || 'post';
  const itemId = searchParams.get('id') || '';
  const itemName = searchParams.get('name') || undefined;

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!itemId) {
      navigate(-1);
    }
  }, [itemId, navigate]);

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
      await createReport({
        reportType,
        itemId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      setSuccess(true);
    } catch (err: any) {
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

  if (success) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.colors.success + '20' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: theme.colors.success }} />
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              Report Submitted
            </h2>
            <p
              className="mb-6"
              style={{ color: theme.colors.textSecondary }}
            >
              Thank you for helping keep our community safe. We'll review your report and take appropriate action.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-lg transition hover:opacity-80"
              style={{ backgroundColor: theme.colors.primary, color: '#FFFFFF' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 hover:opacity-80 transition"
          style={{ color: theme.colors.text }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span style={{ fontFamily: theme.fonts.body }}>Back</span>
        </button>

        {/* Report Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: theme.colors.surface }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 p-6 border-b"
            style={{ borderColor: theme.colors.border }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.colors.error + '20' }}
            >
              <Flag className="w-6 h-6" style={{ color: theme.colors.error }} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                {getTitle()}
              </h1>
              <p style={{ color: theme.colors.textSecondary }}>
                {getDescription()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div
                className="flex items-center gap-2 p-4 rounded-lg mb-6"
                style={{ backgroundColor: theme.colors.error + '20' }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: theme.colors.error }} />
                <p style={{ color: theme.colors.error }}>{error}</p>
              </div>
            )}

            {/* Reason Options */}
            <div className="mb-6">
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: theme.colors.textSecondary }}
              >
                SELECT A REASON
              </h3>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className="flex items-center w-full p-4 rounded-xl transition hover:opacity-90"
                    style={{
                      backgroundColor:
                        selectedReason === reason.value
                          ? theme.colors.primary + '20'
                          : theme.colors.background,
                      border: `2px solid ${
                        selectedReason === reason.value
                          ? theme.colors.primary
                          : theme.colors.border
                      }`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4"
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
                    <span
                      className="font-medium"
                      style={{ color: theme.colors.text }}
                    >
                      {reason.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="mb-6">
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: theme.colors.textSecondary }}
              >
                ADDITIONAL DETAILS (OPTIONAL)
              </h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context about your report..."
                maxLength={1000}
                rows={4}
                className="w-full p-4 rounded-xl outline-none resize-none"
                style={{
                  backgroundColor: theme.colors.background,
                  border: `2px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                }}
              />
              <p
                className="text-sm mt-2 text-right"
                style={{ color: theme.colors.textTertiary }}
              >
                {description.length}/1000
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || loading}
              className="w-full py-4 rounded-xl transition hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              style={{
                backgroundColor: theme.colors.error,
                color: '#FFFFFF',
              }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Flag className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
