import { useQuery } from '@tanstack/react-query';
import { hospitalApi } from '@/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import { BLOOD_GROUP_INFO } from '@/constants/blood';
import { formatBloodGroup } from '@/utils/format';
import { Input, Textarea } from '@/components/forms/Fields';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorState, EmptyState } from '@/components/common/Feedback';
import { PageSpinner } from '@/components/loading/PageSpinner';
import { ApproximateMap } from '@/components/common/ApproximateMap';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <PageHeader title="About Red Pulse" description="A humanitarian blood-response platform with a serious operations core." />
      <p className="text-stone-600 dark:text-stone-300">
        Red Pulse connects donors, people who need blood, hospitals, and administrators. The product is designed to feel
        calm, trustworthy, and fast in an emergency — not like a generic hospital back office.
      </p>
    </div>
  );
}

export function HowItWorksPage() {
  const steps = [
    { title: 'Create or join', body: 'Register as a donor, requester, or hospital partner. Admin accounts are provisioned by the backend.' },
    { title: 'Request with context', body: 'Capture blood group, units, hospital, date, and urgency. The API validates the record.' },
    { title: 'Match, don’t guess', body: 'The frontend only displays backend match scores and nearby results. No clinical logic lives here.' },
    { title: 'Appoint and complete', body: 'Donors and hospitals confirm appointments. Donations update history, inventory, and reports.' },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <PageHeader title="How it works" />
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.title} className="p-5">
            <p className="text-sm text-brand-700">Step {index + 1}</p>
            <h2 className="mt-1 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-stone-500">{step.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BecomeDonorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <PageHeader
        title="Become a donor"
        description="Create a donor account, complete your profile, and stay available for nearby requests."
        actions={
          <Link to="/register">
            <Button>Register as a donor</Button>
          </Link>
        }
      />
      <Card className="p-6">
        <ul className="list-disc space-y-2 pl-5 text-sm text-stone-600 dark:text-stone-300">
          <li>Keep availability current so hospitals can plan.</li>
          <li>Review requests without seeing sensitive home addresses.</li>
          <li>Track donations, badges, and appointments in one dashboard.</li>
        </ul>
      </Card>
    </div>
  );
}

export function FindBloodPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <PageHeader
        title="Find blood"
        description="Search the hospital network and create a request after you sign in. Matching is provided by the API."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BLOOD_GROUP_INFO.map((item) => (
          <Card key={item.group} className="p-4">
            <p className="font-semibold">{formatBloodGroup(item.group)}</p>
            <p className="mt-2 text-sm text-stone-500">{item.summary}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <ApproximateMap label="Your city (approximate)" />
      </div>
      <div className="mt-6">
        <Link to="/register">
          <Button>Create a requester account</Button>
        </Link>
      </div>
    </div>
  );
}

export function HospitalsPage() {
  const query = useQuery({
    queryKey: ['public-hospitals'],
    queryFn: () => hospitalApi.list({ page: 1, size: 20 }),
  });
  if (query.isLoading) return <PageSpinner />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const rows = query.data?.content ?? [];
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <PageHeader title="Hospitals" description="Partner hospitals in the Red Pulse network." />
      {rows.length === 0 ? (
        <EmptyState title="No hospitals available." description="Hospital records will appear when the API returns them." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((hospital) => (
            <Card key={hospital.id} className="p-5">
              <h2 className="text-lg font-semibold">{hospital.name}</h2>
              <p className="mt-1 text-sm text-stone-500">
                {hospital.address}, {hospital.city}, {hospital.state}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <PageHeader title="Contact" description="Questions about Red Pulse partnerships or access." />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
          toast.success('Message saved locally. Connect a backend contact endpoint when it is available.');
        }}
      >
        <Input label="Name" name="name" required />
        <Input label="Email" type="email" name="email" required />
        <Textarea label="Message" name="message" required />
        <Button type="submit">Send</Button>
        {sent ? <p className="text-sm text-stone-500">This form does not invent a backend success for production APIs.</p> : null}
      </form>
    </div>
  );
}
