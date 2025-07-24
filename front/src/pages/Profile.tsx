import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ProfileEdit } from '@/components/ProfileEdit';
import { Skeleton } from '@/components/ui/skeleton';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(true);
      (async () => {
        await updateUser();
        setLoading(false);
      })();
    }
  }, []);

  if (!user || loading) {
    return <Skeleton className="w-full h-64" />;
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>个人资料设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <ProfileAvatar user={user} />
            <ProfileEdit user={user} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
