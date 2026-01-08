import axiosInstance from './axiosInstance';

export type ReportType = 'post' | 'message' | 'user';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
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

export type ResolutionAction =
  | 'no_action'
  | 'warning_issued'
  | 'content_removed'
  | 'user_suspended'
  | 'user_banned';

export interface ReportUser {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role?: string;
  verified?: boolean;
}

export interface Report {
  _id: string;
  reporter: ReportUser;
  reportType: ReportType;
  reportedItem: {
    itemId: string;
    itemType: 'Post' | 'Message' | 'User';
  };
  reportedUser: ReportUser | null;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: {
    action: ResolutionAction;
    notes?: string;
    resolvedBy?: ReportUser;
    resolvedAt?: string;
  };
  contentSnapshot: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReportsResponse {
  reports: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  statusCounts: {
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
  };
}

export interface ReportStatsResponse {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  recentReports: number;
  byType: {
    post?: number;
    message?: number;
    user?: number;
  };
  byReason: Array<{ reason: ReportReason; count: number }>;
  topReportedUsers: Array<{
    _id: string;
    reportCount: number;
    username: string;
    email: string;
    profilePicture?: string;
  }>;
}

export interface CreateReportRequest {
  reportType: ReportType;
  itemId: string;
  reason: ReportReason;
  description?: string;
}

export interface UpdateReportStatusRequest {
  status: ReportStatus;
  action?: ResolutionAction;
  notes?: string;
}

export interface TakeActionRequest {
  action: ResolutionAction;
  notes?: string;
}

export interface BulkUpdateRequest {
  reportIds: string[];
  status: ReportStatus;
  action?: ResolutionAction;
  notes?: string;
}

export interface GetReportsParams {
  reportType?: ReportType;
  status?: ReportStatus;
  reason?: ReportReason;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Create a new report (for users to report content)
export const createReport = async (data: CreateReportRequest) => {
  const response = await axiosInstance.post('/reports', data);
  return response.data;
};

// Get all reports (admin only)
export const getAllReports = async (params: GetReportsParams = {}): Promise<PaginatedReportsResponse> => {
  const response = await axiosInstance.get('/reports', { params });
  return response.data;
};

// Get report statistics (admin only)
export const getReportStats = async (): Promise<ReportStatsResponse> => {
  const response = await axiosInstance.get('/reports/stats');
  return response.data;
};

// Get a single report by ID (admin only)
export const getReportById = async (id: string) => {
  const response = await axiosInstance.get(`/reports/${id}`);
  return response.data;
};

// Update report status (admin only)
export const updateReportStatus = async (id: string, data: UpdateReportStatusRequest) => {
  const response = await axiosInstance.patch(`/reports/${id}/status`, data);
  return response.data;
};

// Take action on a report (admin only)
export const takeReportAction = async (id: string, data: TakeActionRequest) => {
  const response = await axiosInstance.post(`/reports/${id}/action`, data);
  return response.data;
};

// Delete a report (admin only)
export const deleteReport = async (id: string) => {
  const response = await axiosInstance.delete(`/reports/${id}`);
  return response.data;
};

// Bulk update reports (admin only)
export const bulkUpdateReports = async (data: BulkUpdateRequest) => {
  const response = await axiosInstance.patch('/reports/bulk/update', data);
  return response.data;
};

// Helper to format report reason for display
export const formatReportReason = (reason: ReportReason): string => {
  const reasonLabels: Record<ReportReason, string> = {
    spam: 'Spam',
    harassment: 'Harassment',
    hate_speech: 'Hate Speech',
    violence: 'Violence',
    nudity: 'Nudity',
    false_information: 'False Information',
    scam: 'Scam',
    impersonation: 'Impersonation',
    self_harm: 'Self Harm',
    other: 'Other',
  };
  return reasonLabels[reason] || reason;
};

// Helper to format resolution action for display
export const formatResolutionAction = (action: ResolutionAction): string => {
  const actionLabels: Record<ResolutionAction, string> = {
    no_action: 'No Action',
    warning_issued: 'Warning Issued',
    content_removed: 'Content Removed',
    user_suspended: 'User Suspended',
    user_banned: 'User Banned',
  };
  return actionLabels[action] || action;
};
