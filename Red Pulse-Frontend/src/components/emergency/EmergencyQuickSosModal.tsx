import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ShieldCheck, Siren, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input, Select } from '@/components/forms/Fields';
import { emergencyApi, hospitalApi } from '@/api';
import { BLOOD_GROUP_OPTIONS } from '@/constants/blood';
import { persistTokens } from '@/api/axios';
import type { BloodGroup, Urgency } from '@/types';
import { toast } from 'sonner';

interface EmergencyQuickSosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyQuickSosModal({ isOpen, onClose }: EmergencyQuickSosModalProps) {
  const navigate = useNavigate();

  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O_NEGATIVE');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [hospitalId, setHospitalId] = useState('');
  const [locationStr, setLocationStr] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => hospitalApi.list(),
  });

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStr(`GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        setDetectingLocation(false);
        toast.success('Live GPS coordinates captured!');
      },
      (error) => {
        setDetectingLocation(false);
        toast.error('Could not obtain GPS location: ' + error.message);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleSendOtp = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter your mobile phone number');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await emergencyApi.requestOtp({ phoneNumber: phone.trim(), email: email.trim() });
      toast.success(res.message || 'OTP sent successfully');
      setResendIn(res.resendAvailableInSeconds);
      setStep('OTP');
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        toast.error(error.response?.data?.message ?? error.message ?? 'Failed to send email OTP');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification OTP');
      return;
    }

    setLoading(true);
    try {
      const verification = await emergencyApi.verifyOtp({
        email: email.trim(),
        phoneNumber: phone.trim(),
        otp: otp.trim(),
      });
      const res = await emergencyApi.verifyAndDispatch({
        phone: phone.trim(),
        name: name.trim(),
        email: email.trim(),
        verificationId: verification.verificationId,
        bloodGroup,
        unitsRequired,
        hospitalId: hospitalId || undefined,
        approximateLocation: locationStr || 'Ahmedabad Trauma Center',
        latitude,
        longitude,
        emergencyLevel: 'EMERGENCY' as Urgency,
        description: 'Instant Mobile SOS Blood Dispatch',
      });

      if (res.auth?.accessToken) {
        persistTokens(res.auth.accessToken, res.auth.refreshToken);
      }

      toast.success('Emergency broadcast dispatched to local donors!');
      onClose();

      if (res.emergency?.id) {
        navigate(`/requester/emergency/${res.emergency.id}`);
      } else {
        navigate('/requester/dashboard');
      }
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        toast.error(error.response?.data?.message ?? error.message ?? 'Verification failed');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-rose-200 dark:bg-stone-900 dark:border-stone-800 transition-all">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-stone-100 pb-4 dark:border-stone-800">
          <div className="rounded-2xl bg-rose-600 p-3 text-white shadow-md">
            <Siren className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white flex items-center gap-2">
              Urgent Blood SOS Dispatch
            </h2>
            <p className="text-xs text-stone-500">
              {step === 'DETAILS' ? 'Enter contact details and verify by email' : 'Enter the 6-digit email OTP to trigger the broadcast'}
            </p>
          </div>
        </div>

        {step === 'DETAILS' ? (
          <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Your Name / Attendant Name" placeholder="e.g. Ramesh Patel" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Emergency Contact Phone" type="tel" placeholder="e.g. +91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <Input label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Blood Group Needed" options={BLOOD_GROUP_OPTIONS} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)} />
              <Input label="Units Required" type="number" min={1} max={15} value={unitsRequired} onChange={(e) => setUnitsRequired(Number(e.target.value))} required />
            </div>

            <Select label="Target Hospital / Medical Center" options={[{ value: '', label: 'Select nearest hospital (optional)' }, ...(hospitals?.content?.map((h) => ({ value: h.id, label: `${h.name} (${h.city})` })) ?? [])]} value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-200">Emergency Location / GPS</label>
              <div className="flex items-center gap-2">
                <Input className="flex-1" placeholder="e.g. Civil Hospital ICU Ward, Ahmedabad" value={locationStr} onChange={(e) => setLocationStr(e.target.value)} />
                <Button type="button" variant="secondary" size="sm" onClick={handleDetectLocation} loading={detectingLocation}>
                  {detectingLocation ? 'Locating...' : 'Use GPS'}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" loading={loading}>Send OTP</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndDispatch} className="mt-5 space-y-4">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-stone-700 dark:bg-stone-800/80">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                <ShieldCheck className="h-4 w-4" />
                Verify emergency request
              </div>
              <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                We sent a one-time passcode to {email}. It expires in 5 minutes.
              </p>
            </div>
            <Input label="OTP Code" type="text" inputMode="numeric" maxLength={6} placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setStep('DETAILS')}>Back</Button>
              <Button type="button" variant="secondary" disabled={resendIn > 0 || loading} onClick={handleSendOtp}>
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
              </Button>
              <Button type="submit" loading={loading}>Dispatch SOS</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
