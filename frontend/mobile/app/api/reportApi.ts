import axiosInstance from './axiosInstance';

export type ReportType = 'post' | 'message' | 'user';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'nudity'
  | 'false_information'
  | 'scam'
  | 'impersonation'
  | 'self_harm'
  | 'other';

export interface CreateReportRequest {
  reportType: ReportType;
  itemId: string;
  reason: ReportReason;
  description?: string;
}

export interface CreateReportResponse {
  message: string;
  report: {
    _id: string;
    reportType: ReportType;
    reason: ReportReason;
    status: string;
    createdAt: string;
  };
}

// Report reason labels for display
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'violence', label: 'Violence' },
  { value: 'nudity', label: 'Nudity' },
  { value: 'false_information', label: 'False Information' },
  { value: 'scam', label: 'Scam' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'self_harm', label: 'Self Harm' },
  { value: 'other', label: 'Other' },
];

// Create a new report
export const createReport = async (data: CreateReportRequest): Promise<CreateReportResponse> => {
  const response = await axiosInstance.post('/reports', data);
  return response.data;
};

// Helper to format report reason for display
export const formatReportReason = (reason: ReportReason): string => {
  const found = REPORT_REASONS.find((r) => r.value === reason);
  return found?.label || reason;
};

export default {
  createReport,
  formatReportReason,
  REPORT_REASONS,
};
