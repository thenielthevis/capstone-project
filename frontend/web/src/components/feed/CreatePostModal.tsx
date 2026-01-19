import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { X, Image as ImageIcon, Globe, Lock, Users, Loader2 } from 'lucide-react';
import { postApi } from '@/api/postApi';

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
  };
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  initialData,
}: CreatePostModalProps) {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<VisibilityOption>('public');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [keepImages, setKeepImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && editMode && initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setVisibility(initialData.visibility || 'public');
      setKeepImages(initialData.images || []);
      setImages([]);
      setImagePreviews([]);
    } else if (isOpen && !editMode) {
      // Reset form for new post
      setTitle('');
      setContent('');
      setVisibility('public');
      setImages([]);
      setImagePreviews([]);
      setKeepImages([]);
    }
    setError(null);
  }, [isOpen, editMode, initialData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + keepImages.length + files.length;

    if (totalImages > 10) {
      setError('You can only add up to 10 images');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    // Generate previews for new files
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
        });
      } else {
        await postApi.createPost(
          content,
          undefined, // no reference for simple post
          title || undefined,
          images.length > 0 ? images : undefined,
          visibility
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          <button
            onClick={onClose}
            className="text-sm hover:opacity-80 transition"
            style={{ color: theme.colors.text }}
          >
            Cancel
          </button>
          <h3
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            {editMode ? 'Edit Post' : 'Create Post'}
          </h3>
          <button
            onClick={handleSubmit}
            disabled={posting || !content.trim()}
            className="px-4 py-1.5 rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {posting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editMode ? (
              'Update'
            ) : (
              'Post'
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
            >
              {error}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text }}
            >
              Post Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a title..."
              className="w-full px-4 py-3 rounded-xl outline-none transition"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          </div>

          {/* Content Input */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text }}
            >
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, feelings, or experience..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl outline-none resize-none transition"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          </div>

          {/* Image Gallery */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: theme.colors.text }}
            >
              Images ({keepImages.length + images.length}/10)
            </label>

            {/* Existing Images (Edit Mode) */}
            {keepImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {keepImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative w-24 h-24">
                    <img
                      src={url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeExistingImage(url)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {imagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative w-24 h-24">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Images Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-xl flex items-center justify-center gap-2 transition hover:opacity-80"
              style={{
                backgroundColor: theme.colors.background,
                border: `2px dashed ${theme.colors.primary}33`,
                color: theme.colors.primary,
              }}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Add Photos</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Visibility Selector */}
          <div>
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: theme.colors.text }}
            >
              Who can see this?
            </label>
            <div className="flex gap-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = visibility === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setVisibility(option.key)}
                    className="flex-1 p-3 rounded-xl flex flex-col items-center gap-1 transition hover:opacity-80"
                    style={{
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.background,
                      border: isSelected
                        ? 'none'
                        : `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: isSelected ? 'white' : theme.colors.text }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: isSelected ? 'white' : theme.colors.text }}
                    >
                      {option.label}
                    </span>
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
