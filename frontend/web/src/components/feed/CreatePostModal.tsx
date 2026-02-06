import { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { X, Image as ImageIcon, Globe, Lock, Users, Loader2, Dumbbell, MapPin, Utensils } from 'lucide-react';
import { postApi } from '@/api/postApi';
import { getUserProfile, UserProfile } from '@/api/userApi';
import foodPlaceholder from '@/assets/images/food-placeholder.jpg';
import programPlaceholder from '@/assets/images/program-placeholder.jpg';
import outdoorPlaceholder from '@/assets/images/outdoor-placeholder.jpg';

type VisibilityOption = 'public' | 'friends' | 'private';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: {
    postId: string;
    title: string;
    content: string;
    images: string[];
    visibility: VisibilityOption;
    tags?: string[];
  };
  reference?: {
    item_id: string;
    item_type: 'GeoSession' | 'ProgramSession' | 'FoodLog';
    title?: string;
    subtitle?: string;
    image?: string;
  };
}

const formatTag = (str: string) => {
  if (!str) return '';
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  initialData,
  reference: initialReference,
}: CreatePostModalProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<VisibilityOption>('public');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [keepImages, setKeepImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tagging System State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editMode && initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setVisibility(initialData.visibility || 'public');
        setKeepImages(initialData.images || []);
        setSelectedTags(initialData.tags || []);
        setImages([]);
        setImagePreviews([]);
      } else {
        // Reset for new post
        setTitle(initialReference?.title || '');
        setContent('');
        setVisibility('public');
        setImages([]);
        setImagePreviews([]);
        setKeepImages([]);
        setSelectedTags([]);
      }
      fetchProfile();
      setError(null);
    }
  }, [isOpen, editMode, initialData, initialReference]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await getUserProfile();
      setUserProfile(response.profile || response);
    } catch (err) {
      console.error('Failed to fetch profile for tags:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const suggestedTags = useMemo(() => {
    if (!userProfile) return [];
    const tags = new Set<string>();

    // --- Gamification (Batteries) ---
    if (userProfile.gamification?.batteries?.length > 0) {
      const battery = userProfile.gamification.batteries[0];
      if (battery.sleep) tags.add(`Sleep Battery: ${battery.sleep}%`);
      if (battery.activity) tags.add(`Activity Battery: ${battery.activity}%`);
      if (battery.nutrition) tags.add(`Nutrition Battery: ${battery.nutrition}%`);
      if (battery.health) tags.add(`Health Battery: ${battery.health}%`);
    }

    // --- Physical Metrics ---
    if (userProfile.physicalMetrics?.bmi) {
      tags.add(`BMI: ${userProfile.physicalMetrics.bmi.toFixed(1)}`);
    }
    if (userProfile.physicalMetrics?.targetWeight && userProfile.physicalMetrics?.targetWeight > 0) {
      tags.add("Weight Goal");
    }

    // --- Lifestyle ---
    if (userProfile.lifestyle?.activityLevel) {
      tags.add(formatTag(userProfile.lifestyle.activityLevel));
    }
    if (userProfile.lifestyle?.sleepHours) {
      tags.add(`Sleep: ${userProfile.lifestyle.sleepHours} hrs`);
    }

    // --- Dietary Profile ---
    if (userProfile.dietaryProfile?.preferences && Array.isArray(userProfile.dietaryProfile.preferences)) {
      userProfile.dietaryProfile.preferences.forEach((pref: string) => tags.add(formatTag(pref)));
    }
    if (userProfile.dietaryProfile?.allergies && Array.isArray(userProfile.dietaryProfile.allergies)) {
      userProfile.dietaryProfile.allergies.forEach((allergy: string) => tags.add(`Allergy: ${formatTag(allergy)}`));
    }
    if (userProfile.dietaryProfile?.dailyWaterIntake) {
      tags.add(`Water: ${userProfile.dietaryProfile.dailyWaterIntake}L`);
    }
    if (userProfile.dietaryProfile?.mealFrequency) {
      tags.add(`Meals/Day: ${userProfile.dietaryProfile.mealFrequency}`);
    }

    // --- Health Profile ---
    if (userProfile.healthProfile?.currentConditions && Array.isArray(userProfile.healthProfile.currentConditions)) {
      userProfile.healthProfile.currentConditions.forEach((cond: string) => tags.add(formatTag(cond)));
    }
    if (userProfile.healthProfile?.bloodType) {
      tags.add(`Blood Type: ${userProfile.healthProfile.bloodType}`);
    }
    if (userProfile.healthProfile?.medications && Array.isArray(userProfile.healthProfile.medications)) {
      userProfile.healthProfile.medications.forEach((med: string) => tags.add(`Meds: ${formatTag(med)}`));
    }

    // --- Risk Factors ---
    if (userProfile.riskFactors?.stressLevel) {
      tags.add(`${formatTag(userProfile.riskFactors.stressLevel)} Stress`);
    }

    // --- Environmental ---
    if (userProfile.environmentalFactors?.occupationType) {
      tags.add(`Occupation: ${formatTag(userProfile.environmentalFactors.occupationType)}`);
    }

    return Array.from(tags);
  }, [userProfile]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + keepImages.length + files.length;

    if (totalImages > 10) {
      setError('You can only add up to 10 images');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setKeepImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please write something about your activity!');
      return;
    }

    try {
      setPosting(true);
      setError(null);

      if (editMode && initialData) {
        await postApi.updatePost(initialData.postId, {
          content,
          title: title || undefined,
          visibility,
          images: images.length > 0 ? images : undefined,
          keepImages,
          tags: selectedTags,
        });
      } else {
        await postApi.createPost(
          content,
          initialReference ? { item_id: initialReference.item_id, item_type: initialReference.item_type } : undefined,
          title || undefined,
          images.length > 0 ? images : undefined,
          visibility,
          selectedTags
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error posting:', err);
      setError(err.message || 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const visibilityOptions: { key: VisibilityOption; label: string; icon: any }[] = [
    { key: 'public', label: 'Public', icon: Globe },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'private', label: 'Only Me', icon: Lock },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          <button
            onClick={onClose}
            className="text-sm font-bold opacity-60 hover:opacity-100 transition"
            style={{ color: theme.colors.text }}
          >
            Cancel
          </button>
          <h3
            className="text-xl font-black"
            style={{ color: theme.colors.text }}
          >
            {editMode ? 'Edit Post' : 'Share Activity'}
          </h3>
          <button
            onClick={handleSubmit}
            disabled={posting || !content.trim()}
            className="px-6 py-2 rounded-2xl text-white font-bold transition hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : editMode ? 'Update' : 'Post'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="p-4 rounded-2xl text-sm font-bold" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Activity Reference Card */}
          {initialReference && (
            <div
              className="flex items-center gap-4 p-4 rounded-3xl border transition-all"
              style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: theme.colors.primary + '15' }}>
                {initialReference.image ? (
                  <img src={initialReference.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  initialReference.item_type === 'ProgramSession' ? <Dumbbell size={32} style={{ color: theme.colors.primary }} /> :
                    initialReference.item_type === 'FoodLog' ? <Utensils size={32} style={{ color: theme.colors.primary }} /> :
                      <MapPin size={32} style={{ color: theme.colors.primary }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate" style={{ color: theme.colors.text }}>{initialReference.title || 'Activity'}</p>
                <p className="text-sm opacity-50 font-medium truncate" style={{ color: theme.colors.text }}>{initialReference.subtitle || 'Workout completed'}</p>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: theme.colors.text }}>Post Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your achievement a name..."
              className="w-full px-5 py-4 rounded-2xl outline-none font-bold transition focus:ring-2"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                '--tw-ring-color': theme.colors.primary + '33'
              } as any}
            />
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: theme.colors.text }}>What's on your mind?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your journey, feelings, or hard work today..."
              rows={4}
              className="w-full px-5 py-4 rounded-2xl outline-none font-medium resize-none transition focus:ring-2"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                '--tw-ring-color': theme.colors.primary + '33'
              } as any}
            />
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: theme.colors.text }}>Profile Tags (Optional)</label>
            {loadingProfile ? (
              <div className="flex items-center gap-2 px-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.colors.primary }} />
                <span className="text-xs font-bold opacity-40">Fetching profile data...</span>
              </div>
            ) : suggestedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-all border"
                      style={{
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                        color: isSelected ? 'white' : theme.colors.text,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-bold opacity-30 italic ml-1">Complete your health profile to see personalized tags.</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: theme.colors.text }}>Photos ({keepImages.length + images.length}/10)</label>

            {(initialReference || keepImages.length > 0 || imagePreviews.length > 0) && (
              <div className="grid grid-cols-4 gap-2">
                {/* Sample Cover Preview */}
                {initialReference && (
                  <div className="relative aspect-square">
                    <img
                      src={
                        initialReference.item_type === 'FoodLog' ? foodPlaceholder :
                          initialReference.item_type === 'ProgramSession' ? programPlaceholder :
                            outdoorPlaceholder
                      }
                      className="w-full h-full object-cover rounded-2xl border-2 transition-all opacity-40"
                      style={{ borderColor: theme.colors.primary }}
                    />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-xl flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white text-center">Sample Cover</span>
                    </div>
                  </div>
                )}
                {keepImages.map((url, idx) => (
                  <div key={`old-${idx}`} className="relative aspect-square">
                    <img src={url} className="w-full h-full object-cover rounded-2xl border transition-all" style={{ borderColor: theme.colors.border }} />
                    <button onClick={() => removeExistingImage(url)} className="absolute -top-1 -right-1 p-1 rounded-full text-white shadow-lg" style={{ backgroundColor: theme.colors.primary }}><X size={12} /></button>
                  </div>
                ))}
                {imagePreviews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square">
                    <img src={src} className="w-full h-full object-cover rounded-2xl border transition-all" style={{ borderColor: theme.colors.border }} />
                    <button onClick={() => removeNewImage(idx)} className="absolute -top-1 -right-1 p-1 rounded-full text-white shadow-lg" style={{ backgroundColor: theme.colors.primary }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all hover:opacity-100 opacity-60"
              style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.primary + '33', color: theme.colors.primary }}
            >
              <ImageIcon className="w-8 h-8" />
              <span className="font-black text-sm uppercase tracking-widest">Add Photos</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
          </div>

          {/* Visibility */}
          <div className="space-y-3 pb-4">
            <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-1" style={{ color: theme.colors.text }}>Who can see this?</label>
            <div className="flex gap-2">
              {visibilityOptions.map((opt) => {
                const Icon = opt.icon;
                const active = visibility === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setVisibility(opt.key)}
                    className="flex-1 p-4 rounded-2xl flex flex-col items-center gap-1 transition-all border"
                    style={{
                      backgroundColor: active ? theme.colors.primary : theme.colors.background,
                      color: active ? 'white' : theme.colors.text,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      transform: active ? 'translateY(-2px)' : 'none'
                    }}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
