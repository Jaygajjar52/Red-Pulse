import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Input, Select } from '@/components/forms/Fields';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { adminApi } from '@/api';
import { toast } from 'sonner';
import type { User, UserRole, UserStatus } from '@/types';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const [targetBlockUser, setTargetBlockUser] = useState<User | null>(null);
  const [targetUnblockUser, setTargetUnblockUser] = useState<User | null>(null);

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      adminApi.users({
        page,
        size: 10,
        search: search || undefined,
        role: roleFilter ? (roleFilter as UserRole) : undefined,
        status: statusFilter ? (statusFilter as UserStatus) : undefined,
      }),
  });

  const blockMutation = useMutation({
    mutationFn: (userId: string) => adminApi.blockUser(userId),
    onSuccess: () => {
      toast.success('User blocked');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTargetBlockUser(null);
    },
    onError: (err: unknown) => toast.error((err as Error).message || 'Failed to block user'),
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unblockUser(userId),
    onSuccess: () => {
      toast.success('User unblocked');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTargetUnblockUser(null);
    },
    onError: (err: unknown) => toast.error((err as Error).message || 'Failed to unblock user'),
  });

  if (isLoading) return <PageSpinner label="Loading user registry..." />;

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (u: User) => (
        <div>
          <p className="font-bold text-stone-900 dark:text-white">{u.firstName} {u.lastName}</p>
          <p className="text-xs text-stone-500">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => <StatusBadge status={u.role} />,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u: User) => u.phone ?? '—',
    },
    {
      key: 'createdAt',
      header: 'Registered At',
      render: (u: User) => new Date(u.createdAt).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => <StatusBadge status={u.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u: User) => (
        <div className="flex items-center gap-2">
          {u.status === 'ACTIVE' ? (
            <Button size="sm" variant="danger" onClick={() => setTargetBlockUser(u)}>
              <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Block
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setTargetUnblockUser(u)}>
              <CheckCircle className="mr-1 h-3.5 w-3.5 text-emerald-600" /> Unblock
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Account Management"
        description="Audit user accounts across all roles, manage permissions, and enforce administrative blocks."
      />

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 dark:bg-stone-900 dark:border-stone-800">
        <div className="w-64">
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label=""
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'DONOR', label: 'Donor' },
              { value: 'REQUESTER', label: 'Requester' },
              { value: 'HOSPITAL', label: 'Hospital' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'PENDING', label: 'Pending' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs dark:bg-stone-900 dark:border-stone-800">
        <DataTable
          columns={columns}
          rows={usersResponse?.content ?? []}
          emptyTitle="No users found matching query filters."
          page={page}
          totalPages={usersResponse?.totalPages ?? 1}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      <ConfirmDialog
        open={!!targetBlockUser}
        title="Block User Account"
        description={`Are you sure you want to block ${targetBlockUser?.email}? They will be immediately signed out and restricted.`}
        confirmLabel="Block Account"
        tone="danger"
        loading={blockMutation.isPending}
        onConfirm={() => targetBlockUser && blockMutation.mutate(targetBlockUser.id)}
        onClose={() => setTargetBlockUser(null)}
      />

      <ConfirmDialog
        open={!!targetUnblockUser}
        title="Unblock User Account"
        description={`Restore login access for ${targetUnblockUser?.email}?`}
        confirmLabel="Unblock Account"
        loading={unblockMutation.isPending}
        onConfirm={() => targetUnblockUser && unblockMutation.mutate(targetUnblockUser.id)}
        onClose={() => setTargetUnblockUser(null)}
      />
    </div>
  );
}
