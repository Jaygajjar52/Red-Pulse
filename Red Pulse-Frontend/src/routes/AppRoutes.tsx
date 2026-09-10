import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  DonorLayout,
  RequesterLayout,
  HospitalLayout,
  AdminLayout,
} from '@/components/layout/DashboardLayout';

// Public & Auth Pages
import { HomePage } from '@/pages/public/HomePage';
import {
  AboutPage,
  HowItWorksPage,
  BecomeDonorPage,
  FindBloodPage,
  HospitalsPage,
  ContactPage,
} from '@/pages/public/ContentPages';
import { NotFoundPage, ForbiddenPage } from '@/pages/public/ErrorPages';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '@/pages/auth/AuthPages';

// Donor Pages
import { DonorDashboardPage } from '@/pages/donor/DonorDashboardPage';
import { DonorProfilePage } from '@/pages/donor/DonorProfilePage';
import { DonorRequestsPage } from '@/pages/donor/DonorRequestsPage';
import { DonorRequestDetailPage } from '@/pages/donor/DonorRequestDetailPage';
import { DonorDonationsPage } from '@/pages/donor/DonorDonationsPage';
import { DonorAppointmentsPage } from '@/pages/donor/DonorAppointmentsPage';
import { DonorContributionsPage } from '@/pages/donor/DonorContributionsPage';
import { DonorNotificationsPage } from '@/pages/donor/DonorNotificationsPage';

// Requester Pages
import { RequesterDashboardPage } from '@/pages/requester/RequesterDashboardPage';
import { CreateBloodRequestPage } from '@/pages/requester/CreateBloodRequestPage';
import { RequesterRequestsPage } from '@/pages/requester/RequesterRequestsPage';
import { RequesterRequestDetailPage } from '@/pages/requester/RequesterRequestDetailPage';
import { FindDonorsPage } from '@/pages/requester/FindDonorsPage';
import { RequesterEmergencyPage } from '@/pages/requester/RequesterEmergencyPage';
import { RequesterEmergencyDetailPage } from '@/pages/requester/RequesterEmergencyDetailPage';
import { RequesterNotificationsPage } from '@/pages/requester/RequesterNotificationsPage';

// Hospital Pages
import { HospitalDashboardPage } from '@/pages/hospital/HospitalDashboardPage';
import { HospitalProfilePage } from '@/pages/hospital/HospitalProfilePage';
import { HospitalInventoryPage } from '@/pages/hospital/HospitalInventoryPage';
import { HospitalRequestsPage } from '@/pages/hospital/HospitalRequestsPage';
import { HospitalDonationsPage } from '@/pages/hospital/HospitalDonationsPage';
import { HospitalAppointmentsPage } from '@/pages/hospital/HospitalAppointmentsPage';
import { HospitalNotificationsPage } from '@/pages/hospital/HospitalNotificationsPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminDonorsPage } from '@/pages/admin/AdminDonorsPage';
import { AdminHospitalsPage } from '@/pages/admin/AdminHospitalsPage';
import { AdminRequestsPage } from '@/pages/admin/AdminRequestsPage';
import { AdminDonationsPage } from '@/pages/admin/AdminDonationsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/find-blood" element={<FindBloodPage />} />
        <Route path="/hospitals" element={<HospitalsPage />} />
        <Route path="/become-donor" element={<BecomeDonorPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Donor Routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute roles={['DONOR']}>
              <DonorLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/donor" element={<Navigate to="/donor/dashboard" replace />} />
        <Route path="/donor/dashboard" element={<DonorDashboardPage />} />
        <Route path="/donor/profile" element={<DonorProfilePage />} />
        <Route path="/donor/requests" element={<DonorRequestsPage />} />
        <Route path="/donor/requests/:id" element={<DonorRequestDetailPage />} />
        <Route path="/donor/donations" element={<DonorDonationsPage />} />
        <Route path="/donor/appointments" element={<DonorAppointmentsPage />} />
        <Route path="/donor/contributions" element={<DonorContributionsPage />} />
        <Route path="/donor/notifications" element={<DonorNotificationsPage />} />
      </Route>

      {/* Protected Requester Routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute roles={['REQUESTER']}>
              <RequesterLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/requester" element={<Navigate to="/requester/dashboard" replace />} />
        <Route path="/requester/dashboard" element={<RequesterDashboardPage />} />
        <Route path="/requester/create-request" element={<CreateBloodRequestPage />} />
        <Route path="/requester/requests" element={<RequesterRequestsPage />} />
        <Route path="/requester/requests/:id" element={<RequesterRequestDetailPage />} />
        <Route path="/requester/find-donors" element={<FindDonorsPage />} />
        <Route path="/requester/emergency" element={<RequesterEmergencyPage />} />
        <Route path="/requester/emergency/:id" element={<RequesterEmergencyDetailPage />} />
        <Route path="/requester/notifications" element={<RequesterNotificationsPage />} />
      </Route>

      {/* Protected Hospital Routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute roles={['HOSPITAL']}>
              <HospitalLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
        <Route path="/hospital/dashboard" element={<HospitalDashboardPage />} />
        <Route path="/hospital/profile" element={<HospitalProfilePage />} />
        <Route path="/hospital/inventory" element={<HospitalInventoryPage />} />
        <Route path="/hospital/requests" element={<HospitalRequestsPage />} />
        <Route path="/hospital/donations" element={<HospitalDonationsPage />} />
        <Route path="/hospital/appointments" element={<HospitalAppointmentsPage />} />
        <Route path="/hospital/notifications" element={<HospitalNotificationsPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute roles={['ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/donors" element={<AdminDonorsPage />} />
        <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
        <Route path="/admin/requests" element={<AdminRequestsPage />} />
        <Route path="/admin/donations" element={<AdminDonationsPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
