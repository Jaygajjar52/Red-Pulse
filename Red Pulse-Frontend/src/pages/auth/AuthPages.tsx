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
import { getAuthErrorMessage, roleHome, useAuth } from '@/context/AuthContext';
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
      <button
        type="button"
        className="absolute top-9 right-3 text-stone-500"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow((value) => !value)}
      >
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
            donor@redpulse.dev / Donor123! · requester@redpulse.dev / Requester123! · hospital@redpulse.dev / Hospital123! ·
            admin@redpulse.dev / Admin123!
          </Alert>
        </div>
      ) : null}
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const user = await login(values);
            toast.success('Signed in');
            navigate(roleHome(user.role), { replace: true });
          } catch (error) {
            form.setError('root', { message: getAuthErrorMessage(error) });
          }
        })}
      >
        <Input label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <PasswordField label="Password" error={form.formState.errors.password?.message} registration={form.register('password')} />
        {form.formState.errors.root ? (
          <p className="text-sm text-red-700" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-brand-700">
          Forgot password
        </Link>
        <Link to="/register" className="text-brand-700">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', role: 'DONOR' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Create your Red Pulse account</h1>
      <p className="mt-2 text-sm text-stone-500">Administrator accounts cannot be self-registered.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const user = await register(values);
            toast.success('Account created');
            navigate(roleHome(user.role), { replace: true });
          } catch (error) {
            form.setError('root', { message: getAuthErrorMessage(error) });
          }
        })}
      >
        <Input label="First name" error={form.formState.errors.firstName?.message} {...form.register('firstName')} />
        <Input label="Last name" error={form.formState.errors.lastName?.message} {...form.register('lastName')} />
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        <Input label="Phone" error={form.formState.errors.phone?.message} {...form.register('phone')} />
        <PasswordField label="Password" error={form.formState.errors.password?.message} registration={form.register('password')} />
        <Select
          label="Role"
          options={[
            { value: 'DONOR', label: 'Donor' },
            { value: 'REQUESTER', label: 'Requester' },
            { value: 'HOSPITAL', label: 'Hospital' },
          ]}
          error={form.formState.errors.role?.message}
          {...form.register('role')}
        />
        {form.formState.errors.root ? (
          <p className="text-sm text-red-700" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          Register
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-700">
          Login
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });
  return (
    <div>
      <h1 className="font-display text-3xl">Forgot password</h1>
      <p className="mt-2 text-sm text-stone-500">We’ll ask the API to send a reset path if the account exists.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await authApi.forgotPassword(values);
            toast.success('If that email exists, reset instructions were sent.');
          } catch (error) {
            form.setError('root', { message: getAuthErrorMessage(error) });
          }
        })}
      >
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register('email')} />
        {form.formState.errors.root ? <p className="text-sm text-red-700">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          Send reset instructions
        </Button>
      </form>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.get('token') ?? '', password: '' },
  });
  return (
    <div>
      <h1 className="font-display text-3xl">Reset password</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await authApi.resetPassword(values);
            toast.success('Password updated. Please sign in.');
            navigate('/login');
          } catch (error) {
            form.setError('root', { message: getAuthErrorMessage(error) });
          }
        })}
      >
        <Input label="Reset token" error={form.formState.errors.token?.message} {...form.register('token')} />
        <PasswordField label="New password" error={form.formState.errors.password?.message} registration={form.register('password')} />
        {form.formState.errors.root ? <p className="text-sm text-red-700">{form.formState.errors.root.message}</p> : null}
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}
