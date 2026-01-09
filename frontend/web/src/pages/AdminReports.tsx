import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Search,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  FileText,
  Eye,
  Trash2,
  Shield,
  Ban,
  AlertOctagon,
  Filter,
  RefreshCw,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import {
  getAllReports,
  getReportStats,
  updateReportStatus,
  takeReportAction,
  deleteReport,
  formatReportReason,
  formatResolutionAction,
  Report,
  ReportType,
  ReportStatus,
  ReportReason,
  ResolutionAction,
  ReportStatsResponse,
} from '@/api/reportApi';
import logoImg from '../assets/logo.png';

export default function AdminReports() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ReportType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        page: number;
        limit: number;
        reportType?: ReportType;
        status?: ReportStatus;
      } = { page, limit: 10 };
      if (filterType) params.reportType = filterType;
      if (filterStatus) params.status = filterStatus;

      const data = await getAllReports(params);
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (err: unknown) {
      console.error('[AdminReports] Error fetching reports:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports';
      setError(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getReportStats();
      setStats(data);
    } catch (err) {
      console.error('[AdminReports] Error fetching stats:', err);
    }
  };

  const handleFilterType = (type: ReportType | '') => {
    setFilterType(type);
    setTimeout(() => fetchReports(1), 0);
  };

  const handleFilterStatus = (status: ReportStatus | '') => {
    setFilterStatus(status);
    setTimeout(() => fetchReports(1), 0);
  };

  const handlePageChange = (newPage: number) => {
    fetchReports(newPage);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleActionReport = (report: Report) => {
    setSelectedReport(report);
    setShowActionModal(true);
  };

  const handleTakeAction = async (action: ResolutionAction, notes: string) => {
    if (!selectedReport) return;

    try {
      setActionLoading(true);
      await takeReportAction(selectedReport._id, { action, notes });
      setShowActionModal(false);
      setSelectedReport(null);
      fetchReports(pagination.page);
      fetchStats();
    } catch (err) {
      console.error('[AdminReports] Error taking action:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await updateReportStatus(reportId, { status: 'dismissed', action: 'no_action' });
      fetchReports(pagination.page);
      fetchStats();
    } catch (err) {
      console.error('[AdminReports] Error dismissing report:', err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport(reportId);
      fetchReports(pagination.page);
      fetchStats();
    } catch (err) {
      console.error('[AdminReports] Error deleting report:', err);
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.reporter?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUser?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)`,
      }}
    >
      {/* Sidebar */}
      <AdminSidebar activeNav="reports" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Top Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                Reports Management
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Title */}
            <div>
              <h2
                className="text-3xl font-bold mb-2 flex items-center gap-2"
                style={{ color: theme.colors.text }}
              >
                <Flag className="w-8 h-8" style={{ color: theme.colors.error }} />
                Reported Content
              </h2>
              <p style={{ color: theme.colors.textSecondary }}>
                Manage reported posts, messages, and users
              </p>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Pending
                        </p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Resolved
                        </p>
                        <p className="text-2xl font-bold text-green-600">{stats.resolvedReports}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Total Reports
                        </p>
                        <p className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                          {stats.totalReports}
                        </p>
                      </div>
                      <Flag className="w-8 h-8" style={{ color: theme.colors.primary }} />
                    </div>
                  </CardContent>
                </Card>

                <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Last 7 Days
                        </p>
                        <p className="text-2xl font-bold text-orange-600">{stats.recentReports}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters and Search */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                      style={{ color: theme.colors.textTertiary }}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by reporter, reported user, or reason..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: theme.colors.input,
                        borderColor: theme.colors.border,
                        color: theme.colors.text,
                      }}
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-4">
                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        Type:
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant={filterType === '' ? 'default' : 'outline'}
                          onClick={() => handleFilterType('')}
                          size="sm"
                        >
                          All
                        </Button>
                        <Button
                          variant={filterType === 'post' ? 'default' : 'outline'}
                          onClick={() => handleFilterType('post')}
                          size="sm"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Posts
                        </Button>
                        <Button
                          variant={filterType === 'message' ? 'default' : 'outline'}
                          onClick={() => handleFilterType('message')}
                          size="sm"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Messages
                        </Button>
                        <Button
                          variant={filterType === 'user' ? 'default' : 'outline'}
                          onClick={() => handleFilterType('user')}
                          size="sm"
                        >
                          <User className="w-3 h-3 mr-1" />
                          Users
                        </Button>
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        Status:
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant={filterStatus === '' ? 'default' : 'outline'}
                          onClick={() => handleFilterStatus('')}
                          size="sm"
                        >
                          All
                        </Button>
                        <Button
                          variant={filterStatus === 'pending' ? 'default' : 'outline'}
                          onClick={() => handleFilterStatus('pending')}
                          size="sm"
                          className="text-yellow-600"
                        >
                          Pending
                        </Button>
                        <Button
                          variant={filterStatus === 'resolved' ? 'default' : 'outline'}
                          onClick={() => handleFilterStatus('resolved')}
                          size="sm"
                          className="text-green-600"
                        >
                          Resolved
                        </Button>
                        <Button
                          variant={filterStatus === 'dismissed' ? 'default' : 'outline'}
                          onClick={() => handleFilterStatus('dismissed')}
                          size="sm"
                        >
                          Dismissed
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => fetchReports(1)}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Table */}
            <Card style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text }}>
                  Reports ({pagination.total})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div
                      className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-4"
                      style={{ borderColor: theme.colors.primary }}
                    ></div>
                    <p style={{ color: theme.colors.textSecondary }}>Loading reports...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p className="text-red-500">{error}</p>
                    <Button className="mt-4" onClick={() => fetchReports(1)}>
                      Retry
                    </Button>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.textTertiary }} />
                    <p style={{ color: theme.colors.textSecondary }}>No reports found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: theme.colors.border }}>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Type
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Reporter
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Reported
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Reason
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Status
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Date
                          </th>
                          <th
                            className="text-left py-3 px-4"
                            style={{ color: theme.colors.textSecondary }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((report) => (
                          <tr
                            key={report._id}
                            className="border-b hover:bg-opacity-50 transition-colors"
                            style={{ borderColor: theme.colors.border }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.colors.cardHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(report.reportType)}
                                <span
                                  className="capitalize text-sm"
                                  style={{ color: theme.colors.text }}
                                >
                                  {report.reportType}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: theme.colors.primary }}
                                >
                                  {report.reporter?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm" style={{ color: theme.colors.text }}>
                                  {report.reporter?.username || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: theme.colors.error }}
                                >
                                  {report.reportedUser?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-sm" style={{ color: theme.colors.text }}>
                                  {report.reportedUser?.username || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {formatReportReason(report.reason)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(report.status)}`}
                              >
                                {getStatusIcon(report.status)}
                                <span className="capitalize">{report.status}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewReport(report)}
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {report.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleActionReport(report)}
                                      title="Take Action"
                                      className="text-orange-600 hover:text-orange-700"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDismissReport(report._id)}
                                      title="Dismiss"
                                      className="text-gray-600 hover:text-gray-700"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteReport(report._id)}
                                  title="Delete"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <span
                      className="flex items-center px-4"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* View Report Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: theme.colors.card }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                Report Details
              </h3>
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                    Report Type
                  </p>
                  <p className="capitalize" style={{ color: theme.colors.text }}>
                    {selectedReport.reportType}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                    Status
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                    Reason
                  </p>
                  <p style={{ color: theme.colors.text }}>
                    {formatReportReason(selectedReport.reason)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                    Reported At
                  </p>
                  <p style={{ color: theme.colors.text }}>
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Reporter */}
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Reporter
                </p>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {selectedReport.reporter?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ color: theme.colors.text }}>
                      {selectedReport.reporter?.username || 'Unknown'}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {selectedReport.reporter?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reported User */}
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                  Reported User
                </p>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.surface }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: theme.colors.error }}
                  >
                    {selectedReport.reportedUser?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ color: theme.colors.text }}>
                      {selectedReport.reportedUser?.username || 'Unknown'}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {selectedReport.reportedUser?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Description
                  </p>
                  <p
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}
                  >
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Content Snapshot */}
              {selectedReport.contentSnapshot && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Reported Content
                  </p>
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: theme.colors.surface, color: theme.colors.text }}
                  >
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedReport.contentSnapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedReport.resolution && (
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
                    Resolution
                  </p>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <p style={{ color: theme.colors.text }}>
                      <strong>Action:</strong> {formatResolutionAction(selectedReport.resolution.action)}
                    </p>
                    {selectedReport.resolution.notes && (
                      <p style={{ color: theme.colors.text }}>
                        <strong>Notes:</strong> {selectedReport.resolution.notes}
                      </p>
                    )}
                    {selectedReport.resolution.resolvedAt && (
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        Resolved at: {new Date(selectedReport.resolution.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Take Action Modal */}
      {showActionModal && selectedReport && (
        <ActionModal
          report={selectedReport}
          onClose={() => {
            setShowActionModal(false);
            setSelectedReport(null);
          }}
          onAction={handleTakeAction}
          loading={actionLoading}
          theme={theme}
        />
      )}
    </div>
  );
}

// Action Modal Component
interface ActionModalProps {
  report: Report;
  onClose: () => void;
  onAction: (action: ResolutionAction, notes: string) => void;
  loading: boolean;
  theme: {
    colors: {
      card: string;
      text: string;
      textSecondary: string;
      surface: string;
      border: string;
      primary: string;
      error: string;
      input: string;
    };
  };
}

function ActionModal({ report, onClose, onAction, loading, theme }: ActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<ResolutionAction>('no_action');
  const [notes, setNotes] = useState('');

  const actions: { value: ResolutionAction; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'no_action',
      label: 'No Action',
      icon: <CheckCircle className="w-5 h-5 text-gray-500" />,
      description: 'Mark as reviewed without taking any action',
    },
    {
      value: 'warning_issued',
      label: 'Issue Warning',
      icon: <AlertOctagon className="w-5 h-5 text-yellow-500" />,
      description: 'Issue a warning to the reported user',
    },
    {
      value: 'content_removed',
      label: 'Remove Content',
      icon: <Trash2 className="w-5 h-5 text-orange-500" />,
      description: 'Delete the reported post or message',
    },
    {
      value: 'user_suspended',
      label: 'Suspend User',
      icon: <Shield className="w-5 h-5 text-red-500" />,
      description: 'Temporarily suspend the reported user',
    },
    {
      value: 'user_banned',
      label: 'Ban User',
      icon: <Ban className="w-5 h-5 text-red-700" />,
      description: 'Permanently ban the reported user',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-xl p-6 max-w-lg w-full mx-4"
        style={{ backgroundColor: theme.colors.card }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
            Take Action
          </h3>
          <Button variant="ghost" onClick={onClose}>
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            Report: <span className="capitalize">{report.reportType}</span> -{' '}
            {formatReportReason(report.reason)}
          </p>

          <div className="space-y-2">
            {actions.map((action) => (
              <button
                key={action.value}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  selectedAction === action.value
                    ? 'border-2'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    selectedAction === action.value
                      ? theme.colors.surface
                      : 'transparent',
                  borderColor:
                    selectedAction === action.value
                      ? theme.colors.primary
                      : theme.colors.border,
                }}
                onClick={() => setSelectedAction(action.value)}
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <div>
                    <p className="font-medium" style={{ color: theme.colors.text }}>
                      {action.label}
                    </p>
                    <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this action..."
              className="w-full p-3 border rounded-lg resize-none h-24"
              style={{
                backgroundColor: theme.colors.input,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onAction(selectedAction, notes)}
            disabled={loading}
            style={{ backgroundColor: theme.colors.primary }}
          >
            {loading ? 'Processing...' : 'Confirm Action'}
          </Button>
        </div>
      </div>
    </div>
  );
}
