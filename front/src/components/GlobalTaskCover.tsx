import { config } from '@/conf/env';
import { Image } from 'lucide-react';

const serverBaseUrl = new URL(config.apiBaseUrl).origin;
const toFullUrl = (path: string) => (path ? `${serverBaseUrl}${path}` : '');

interface GlobalTaskCoverProps {
  cover?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  sm: 'h-32 w-full',
  md: 'h-48 w-full',
  lg: 'h-64 w-full',
  full: 'h-full w-full',
};

export function GlobalTaskCover({ 
  cover, 
  size = 'md', 
  className = '',
  alt = '任务封面'
}: GlobalTaskCoverProps) {
  const coverUrl = toFullUrl(cover || '');
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (!coverUrl) {
    return (
      <div className={`${sizeClass} ${className} bg-muted flex items-center justify-center rounded-lg`}>
        <Image className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} ${className} relative rounded-lg overflow-hidden`}>
      <img
        src={coverUrl}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
