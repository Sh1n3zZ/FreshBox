import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { toFullUrl } from '@/lib/utils';

interface GlobalAvatarProps {
  user: {
    avatar?: string;
    username?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-20 w-20',
};

export function GlobalAvatar({ user, size = 'md', className = '' }: GlobalAvatarProps) {
  const avatarUrl = toFullUrl(user?.avatar || '');
  const sizeClass = sizeClasses[size];

  return (
    <Avatar className={`${sizeClass} ${className}`}>
      <AvatarImage src={avatarUrl} alt={user?.username} />
      <AvatarFallback>
        {user?.username?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
