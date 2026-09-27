import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input, Select } from '@/components/forms/Fields';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
  type ResetPasswordValues,
} from '@/schemas';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage, roleHome } from '@/context/authUtils';
import { authApi } from '@/api';
import { toast } from 'sonner';
import { env } from '@/constants/env';
import { Alert } from '@/components/common/Feedback';

function PasswordField({
  label,
  error,
  registration,
}: {
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm>['register']>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input label={label} type={show ? 'text' : 'password'} error={error} autoComplete="current-password" {...registration} />
      <button type="button" className="absolute top-9 right-3 text-stone-500" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((value) => !value)} >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  return (
    <div>
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-stone-500">Sign in to continue to Red Pulse.</p>
      {env.useMockApi ? (
        <div className="mt-4">
          <Alert tone="warning" title="Mock mode demo accounts">
            donor@redpulse.dev / Donor123! · requester@redpulse.dev / Requester123! · hospital@redpulse.dev / Hospital123! · admin@redpulse.dev / Admin123!
          </Alert>
        </div>
      ) : null}
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(async (values) => { try { const user = await login(values); toast.success('Signed in'); navigate(roleHome(user.role), { replace: true }); } catch (error) { form.setError('root', { message: getAuthErrorMessage(error) }); } })}>
        <Input label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <PasswordField label="Password" error={form.formState.errors.password?.message} registration={form.register('password')} />
        {form.formState.errors.root ? <p className="text-sm text-red-700" role="alert">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>Sign in</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-brand-700">Forgot password</Link>
        <Link to="/register" className="text-brand-700">Create an account</Link>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: 'DONOR',
      bloodGroup: 'O_POSITIVE',
      dateOfBirth: '1998-05-15',
      gender: 'MALE',
      weight: 65,
      city: 'Ahmedabad',
      state: 'Gujarat',
      emergencyContact: '',
      address: '',
      hospitalName: '',
      registrationNumber: '',
      licenseDocumentUrl: '',
    },
  });

  const selectedRole = form.watch('role');
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFileName(file.name);
      form.setValue('licenseDocumentUrl', '');
      toast.info(`Selected ${file.name} locally for manual review. Upload is not available yet in this frontend.`);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-3xl">Create your Red Pulse account</h1>
      <p className="mt-2 text-sm text-stone-500">Select your role to unlock customized tools, requirements, and features.</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(async (values) => { try { const user = await register(values); toast.success(`Account created as ${user.role}! Welcome to Red Pulse.`); navigate(roleHome(user.role), { replace: true }); } catch (error) { form.setError('root', { message: getAuthErrorMessage(error) }); } })}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="First name" error={form.formState.errors.firstName?.message} {...form.register('firstName')} /><Input label="Last name" error={form.formState.errors.lastName?.message} {...form.register('lastName')} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Email address" type="email" error={form.formState.errors.email?.message} {...form.register('email')} /><Input label="Phone number" placeholder="+91 9876543210" error={form.formState.errors.phone?.message} {...form.register('phone')} /></div>
        <PasswordField label="Password" error={form.formState.errors.password?.message} registration={form.register('password')} />
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/50 dark:bg-stone-900">
          <Select label="Role" options={[{ value: 'DONOR', label: 'Blood Donor (Save lives, track eligibility & badges)' }, { value: 'REQUESTER', label: 'Requester / Patient (Request blood & trigger emergency broadcasts)' }, { value: 'HOSPITAL', label: 'Hospital / Blood Center (Manage inventory & phlebotomy queue)' }]} error={form.formState.errors.role?.message} {...form.register('role')} />
        </div>
        {selectedRole === 'DONOR' && (<div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 dark:border-stone-800 dark:bg-stone-900 space-y-4 transition-all"><div className="flex items-center gap-2 text-rose-700 font-semibold text-sm dark:text-rose-400"><span>Donor Clinical & Health Profile</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Select label="Blood Group" options={[{ value: 'A_POSITIVE', label: 'A+' },{ value: 'A_NEGATIVE', label: 'A-' },{ value: 'B_POSITIVE', label: 'B+' },{ value: 'B_NEGATIVE', label: 'B-' },{ value: 'AB_POSITIVE', label: 'AB+' },{ value: 'AB_NEGATIVE', label: 'AB-' },{ value: 'O_POSITIVE', label: 'O+' },{ value: 'O_NEGATIVE', label: 'O- (Universal)' }]} {...form.register('bloodGroup')} /><Select label="Gender" options={[{ value: 'MALE', label: 'Male' },{ value: 'FEMALE', label: 'Female' },{ value: 'OTHER', label: 'Other' }]} {...form.register('gender')} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Weight (kg) - Min 45kg" type="number" min={45} max={250} placeholder="65" {...form.register('weight', { valueAsNumber: true })} /><Input label="Date of Birth (Must be 18+)" type="date" {...form.register('dateOfBirth')} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="City" placeholder="e.g. Ahmedabad" {...form.register('city')} /><Input label="State" placeholder="e.g. Gujarat" {...form.register('state')} /></div></div>)}
        {selectedRole === 'REQUESTER' && (<div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 dark:border-stone-800 dark:bg-stone-900 space-y-4 transition-all"><div className="flex items-center gap-2 text-amber-800 font-semibold text-sm dark:text-amber-300"><span>Requester Emergency & Address Details</span></div><Input label="Secondary Emergency Contact Phone" placeholder="Attendant / Relative mobile number" {...form.register('emergencyContact')} /><Input label="Default Hospital / Residential Address" placeholder="e.g. 402 Apollo Enclave, SG Highway" {...form.register('address')} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="City" placeholder="e.g. Ahmedabad" {...form.register('city')} /><Input label="State" placeholder="e.g. Gujarat" {...form.register('state')} /></div></div>)}
        {selectedRole === 'HOSPITAL' && (<div className="rounded-xl border border-sky-200 bg-sky-50/30 p-4 dark:border-stone-800 dark:bg-stone-900 space-y-4 transition-all"><div className="flex items-center gap-2 text-sky-800 font-semibold text-sm dark:text-sky-300"><span>Medical Facility & Accreditation Details</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Hospital / Blood Bank Legal Name" placeholder="e.g. City General Trauma Center" error={form.formState.errors.hospitalName?.message} {...form.register('hospitalName')} /><Input label="Official License / Registration No." placeholder="e.g. NABH-BB-2024-089" error={form.formState.errors.registrationNumber?.message} {...form.register('registrationNumber')} /></div><Input label="Hospital Physical Address" placeholder="Campus address, Ward/Building no." {...form.register('address')} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="City" placeholder="City" {...form.register('city')} /><Input label="State" placeholder="State" {...form.register('state')} /></div><div className="space-y-1.5 pt-1"><label className="block text-sm font-medium text-stone-700 dark:text-stone-200">Accreditation / License Certificate (PDF or Image)</label><div className="flex items-center gap-3"><label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer text-sm font-medium text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 shadow-xs"><span>Choose License File (PDF/Image)</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} /></label>{licenseFileName ? <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg dark:bg-amber-950/40">Local review only: {licenseFileName}</span> : <span className="text-xs text-stone-500">No file uploaded yet — backend storage is not configured.</span>}</div></div></div>)}
        {form.formState.errors.root ? <p className="text-sm text-red-700" role="alert">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>Create {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()} Account</Button>
      </form>
      <p className="mt-4 text-sm text-center">Already have an account? <Link to="/login" className="text-brand-700 font-semibold hover:underline">Login</Link></p>
    </div>
  );
}

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });
  return (
    <div>
      <h1 className="font-display text-3xl">Forgot password</h1>
      <p className="mt-2 text-sm text-stone-500">We’ll ask the API to send a reset path if the account exists.</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(async (values) => { try { await authApi.forgotPassword(values); toast.success('If that email exists, reset instructions were sent.'); } catch (error) { form.setError('root', { message: getAuthErrorMessage(error) }); } })}>
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        {form.formState.errors.root ? <p className="text-sm text-red-700">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>Send reset instructions</Button>
      </form>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const form = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token: params.get('token') ?? '', password: '' }, });
  return (
    <div>
      <h1 className="font-display text-3xl">Reset password</h1>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(async (values) => { try { await authApi.resetPassword(values); toast.success('Password updated. Please sign in.'); navigate('/login'); } catch (error) { form.setError('root', { message: getAuthErrorMessage(error) }); } })}>
        <Input label="Reset token" error={form.formState.errors.token?.message} {...form.register('token')} />
        <PasswordField label="New password" error={form.formState.errors.password?.message} registration={form.register('password')} />
        {form.formState.errors.root ? <p className="text-sm text-red-700">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>Update password</Button>
      </form>
    </div>
  );
}
