import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, MapPin } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useTheme } from '@/context/ThemeContext';
import logoImg from '../assets/logo.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface GeoActivity {
  _id?: string;
  name: string;
  description: string;
  icon?: string;
  animation?: string;
  met: number;
}

export default function GeoActivityForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { theme } = useTheme();
  const isEdit = !!id;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<GeoActivity>({
    name: '',
    description: '',
    met: 0,
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [animationFile, setAnimationFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [animationPreview, setAnimationPreview] = useState<string>('');

  useEffect(() => {
    if (isEdit) {
      fetchActivity();
    }
  }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/geo/getGeoActivityById/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await response.json();
      setFormData(data);
      if (data.icon) setIconPreview(data.icon);
      if (data.animation) setAnimationPreview(data.animation);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'met' ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'animation') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'icon') {
        setIconFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setIconPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setAnimationFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAnimationPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Activity name is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const formDataToSend = new FormData();

      // Always append all fields
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('met', String(formData.met || 0));

      if (iconFile) {
        formDataToSend.append('icon', iconFile);
        console.log('[GeoActivityForm] Adding icon file:', iconFile.name);
      }
      if (animationFile) {
        formDataToSend.append('animation', animationFile);
        console.log('[GeoActivityForm] Adding animation file:', animationFile.name);
      }

      const url = isEdit
        ? `${API_URL}/geo/updateGeoActivity/${id}`
        : `${API_URL}/geo/createGeoActivity`;

      const method = isEdit ? 'PATCH' : 'POST';

      console.log(`[GeoActivityForm] Submitting ${isEdit ? 'UPDATE' : 'CREATE'}`);
      console.log(`[GeoActivityForm] URL: ${url}`);
      console.log(`[GeoActivityForm] Method: ${method}`);
      console.log(`[GeoActivityForm] Token: ${token.substring(0, 20)}...`);
      console.log('[GeoActivityForm] Form Data:', {
        name: formData.name,
        description: formData.description,
        met: formData.met,
        hasIcon: !!iconFile,
        hasAnimation: !!animationFile,
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      console.log(`[GeoActivityForm] Response status: ${response.status}`);
      console.log(`[GeoActivityForm] Response headers:`, {
        contentType: response.headers.get('content-type'),
      });

      const responseText = await response.text();
      console.log('[GeoActivityForm] Raw response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }
        console.error('[GeoActivityForm] Server error details:', errorData);
        throw new Error(errorData.message || errorData.error || `Failed to save activity (${response.status})`);
      }

      const responseData = JSON.parse(responseText);
      console.log('[GeoActivityForm] Success! Updated data:', responseData);
      
      setSuccess(true);
      console.log('[GeoActivityForm] Update/Create successful, redirecting...');
      
      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        navigate('/admin/geo-activities', { replace: true });
        // Force a page reload on the activities page to ensure fresh data
        window.location.href = '/admin/geo-activities';
      }, 1500);
    } catch (err: any) {
      console.error('[GeoActivityForm] Catch block error:', err);
      const errorMessage = err.message || 'Failed to save activity';
      console.error('[GeoActivityForm] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.background} 100%)` }}>
      {/* Sidebar */}
      <AdminSidebar activeNav="activities" onSidebarToggle={setSidebarOpen} />

      {/* Main Content */}
      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 transition-all duration-300`}>
        {/* Top Header */}
        <header className="shadow-sm sticky top-0 z-40" style={{ backgroundColor: theme.colors.surface }}>
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Lifora Logo" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit' : 'Create'} Geo Activity
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/geo-activities')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading activity...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Activity Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Success Message */}
                    {success && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700">Activity saved successfully! Redirecting...</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Running, Cycling, Swimming"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Description Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe this geo activity..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* MET Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MET (Metabolic Equivalent) *
                      </label>
                      <input
                        type="number"
                        name="met"
                        value={formData.met}
                        onChange={handleInputChange}
                        placeholder="e.g., 5.0"
                        step="0.1"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Used for calorie calculations</p>
                    </div>

                    {/* Icon Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Icon
                      </label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                            <div className="flex flex-col items-center">
                              <Upload className="w-6 h-6 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-600">Click to upload icon</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, 'icon')}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {iconPreview && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                            <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Animation Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Animation (Lottie/GIF)
                      </label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                            <div className="flex flex-col items-center">
                              <Upload className="w-6 h-6 text-gray-400 mb-2" />
                              <span className="text-sm text-gray-600">Click to upload animation</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*,.json"
                              onChange={(e) => handleFileChange(e, 'animation')}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {animationPreview && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
                            <img src={animationPreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/admin/geo-activities')}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </span>
                        ) : (
                          isEdit ? 'Update Activity' : 'Create Activity'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
