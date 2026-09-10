import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { notificationApi } from '@/api';
import { toast } from 'sonner';

export function RequesterNotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: () => {
      toast.success('Notification removed');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) return <PageSpinner label="Loading notifications..." />;

  const notifications = notificationsResponse?.content ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Requester Notifications"
        description="Alerts regarding donor matches, request status updates, and hospital confirmations."
        actions={
          notifications.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="mr-1.5 h-4 w-4" /> Mark All as Read
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border p-4 shadow-xs transition dark:border-stone-800 ${
              n.read
                ? 'border-stone-200 bg-white dark:bg-stone-900'
                : 'border-brand-200 bg-brand-50/40 dark:bg-stone-800/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Bell className="mt-1 h-5 w-5 text-brand-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 dark:text-white">{n.title}</h3>
                    <StatusBadge status={n.type} />
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{n.message}</p>
                  <span className="mt-2 inline-block text-xs text-stone-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!n.read && (
                  <Button size="sm" variant="secondary" onClick={() => markReadMutation.mutate(n.id)}>
                    Mark Read
                  </Button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="rounded-2xl border border-stone-200 p-12 text-center text-stone-500 dark:border-stone-800">
            No notifications found.
          </div>
        )}
      </div>
    </div>
  );
}
