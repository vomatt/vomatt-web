'use client';

import { useRef } from 'react';
import { toast } from 'sonner';

import { User } from '@/components/ui/SvgIcons';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploaderProps {
  initialAvatarUrl: string | null;
  isOwner: boolean;
}

export default function AvatarUploader({ initialAvatarUrl, isOwner }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, isUploading, upload } = useAvatarUpload(initialAvatarUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = await upload(file);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Avatar updated');
    }
    e.target.value = '';
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={!isOwner || isUploading}
        onClick={() => isOwner && inputRef.current?.click()}
        className={[
          'w-16 h-16 rounded-full overflow-hidden flex items-center justify-center',
          isOwner ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default',
          !avatarUrl ? 'bg-primary' : '',
        ].join(' ')}
        aria-label={isOwner ? 'Change profile picture' : undefined}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile picture"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="w-8 h-8 text-white flex items-center justify-center">
            <User size="2em" />
          </span>
        )}
      </button>

      {isOwner && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
