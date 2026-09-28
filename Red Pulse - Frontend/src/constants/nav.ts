import type { UserRole } from '@/types';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Droplets,
  FileText,
  HeartHandshake,
  Hospital,
  LayoutDashboard,
  MapPin,
  Shield,
  Siren,
  Trophy,
  Users,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const publicNav = [
  { to: '/', label: 'Home' },
  { to: '/find-blood', label: 'Find Blood' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/become-donor', label: 'Become a Donor' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About' },
];

export const roleNav: Record<UserRole, NavItem[]> = {
  DONOR: [
    { to: '/donor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/donor/profile', label: 'Profile', icon: Users },
    { to: '/donor/requests', label: 'Requests', icon: Droplets },
    { to: '/donor/donations', label: 'Donations', icon: HeartHandshake },
    { to: '/donor/appointments', label: 'Appointments', icon: ClipboardList },
    { to: '/donor/contributions', label: 'Contributions', icon: Trophy },
    { to: '/donor/notifications', label: 'Notifications', icon: Bell },
  ],
  REQUESTER: [
    { to: '/requester/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requester/create-request', label: 'Create request', icon: Droplets },
    { to: '/requester/requests', label: 'My requests', icon: ClipboardList },
    { to: '/requester/find-donors', label: 'Find donors', icon: MapPin },
    { to: '/requester/emergency', label: 'Emergency', icon: Siren },
    { to: '/requester/notifications', label: 'Notifications', icon: Bell },
  ],
  HOSPITAL: [
    { to: '/hospital/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/hospital/profile', label: 'Profile', icon: Building2 },
    { to: '/hospital/inventory', label: 'Inventory', icon: Droplets },
    { to: '/hospital/requests', label: 'Requests', icon: ClipboardList },
    { to: '/hospital/donations', label: 'Donations', icon: HeartHandshake },
    { to: '/hospital/appointments', label: 'Appointments', icon: Hospital },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/donors', label: 'Donors', icon: HeartHandshake },
    { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
    { to: '/admin/requests', label: 'Requests', icon: Droplets },
    { to: '/admin/donations', label: 'Donations', icon: Activity },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/audit-logs', label: 'Audit logs', icon: Shield },
  ],
};
