import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ArrowRight, HeartHandshake, Hospital, ShieldCheck, Siren } from 'lucide-react';
import { BLOOD_GROUP_INFO } from '@/constants/blood';
import { formatBloodGroup } from '@/utils/format';
import { env } from '@/constants/env';
import { Card, CardBody } from '@/components/cards/Card';
import { EmergencyQuickSosModal } from '@/components/emergency/EmergencyQuickSosModal';

export function HomePage() {
  const [sosModalOpen, setSosModalOpen] = useState(false);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-sm font-medium tracking-wide text-brand-700 uppercase">Emergency-ready blood network</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.1] font-semibold tracking-tight sm:text-6xl">
              When every unit matters, Red Pulse keeps people connected.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600 dark:text-stone-300">
              A modern platform for donors, requesters, and hospitals to coordinate blood requests, inventory, and
              emergency alerts — without turning care into a generic admin console.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">Become a donor</Button>
              </Link>
              <Link to="/find-blood">
                <Button size="lg" variant="secondary">
                  Find blood
                </Button>
              </Link>
            </div>
          </div>
          <Card className="relative overflow-hidden p-6">
            <p className="text-sm text-stone-500">Emergency blood response</p>
            <p className="mt-2 font-display text-3xl">Alert nearby verified donors. Track hospital readiness.</p>
            <div className="mt-6 grid gap-3">
              {['O- emergency desk', 'Hospital inventory pulse', 'Appointment confirmation'].map((item) => (
                <div key={item} className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm dark:border-stone-800 dark:bg-stone-900">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-brand-700 text-white dark:border-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-3xl">Need blood urgently?</p>
            <p className="mt-2 text-brand-100">Trigger immediate SOS broadcast with Phone number, Name & OTP verification.</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            icon={<Siren className="h-4 w-4 text-rose-600 animate-pulse" />}
            onClick={() => setSosModalOpen(true)}
            className="font-bold shadow-lg"
          >
            Start Emergency Blood SOS (OTP)
          </Button>
        </div>
      </section>

      <EmergencyQuickSosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />

      <section className="mx-auto max-w-6xl px-4 py-16" id="find-blood">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl">Find blood through the network</h2>
            <p className="mt-2 text-stone-500">Search hospitals and submit requests. Matching is decided by the backend.</p>
          </div>
          <Link to="/find-blood" className="hidden text-sm font-medium text-brand-700 sm:inline-flex">
            Open finder <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-8">
            <HeartHandshake className="h-6 w-6 text-brand-700" />
            <h2 className="mt-4 font-display text-3xl">Become a donor</h2>
            <p className="mt-2 text-stone-500">
              Share availability, review nearby requests, and keep appointments in one place. Medical eligibility is never
              determined in this app.
            </p>
            <Link to="/become-donor" className="mt-6 inline-block">
              <Button>Create donor account</Button>
            </Link>
          </Card>
          <Card className="p-8">
            <h2 className="font-display text-3xl">How Red Pulse works</h2>
            <ol className="mt-4 space-y-3 text-sm text-stone-600 dark:text-stone-300">
              <li>1. Requesters create a blood request with hospital and urgency.</li>
              <li>2. The backend returns matching donors and hospital inventory signals.</li>
              <li>3. Donors accept where permitted and continue to an appointment.</li>
              <li>4. Hospitals update stock and complete donations.</li>
            </ol>
            <Link to="/how-it-works" className="mt-6 inline-flex text-sm font-medium text-brand-700">
              See the full flow
            </Link>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl">Blood group information</h2>
        <p className="mt-2 max-w-2xl text-stone-500">
          Educational summaries only. Compatibility and clinical use are determined by medical professionals and backend
          rules.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BLOOD_GROUP_INFO.map((item) => (
            <Card key={item.group} className="p-4">
              <p className="font-semibold">{formatBloodGroup(item.group)}</p>
              <p className="mt-2 text-sm text-stone-500">{item.summary}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-3xl">Impact</h2>
        {env.useMockApi ? (
          <p className="mt-2 text-sm text-amber-800">
            Demo statistics below are mock data for frontend development, not production impact numbers.
          </p>
        ) : (
          <p className="mt-2 text-stone-500">Live impact metrics will appear here once the Spring Boot API provides them.</p>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['Network roles', 'Donors, requesters, hospitals, admins'],
            ['Coordination', 'Requests, matches, appointments'],
            ['Operations', 'Inventory, reports, audit logs'],
          ].map(([title, copy]) => (
            <Card key={title} className="p-5">
              <p className="font-display text-2xl">{title}</p>
              <p className="mt-2 text-sm text-stone-500">{copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <Hospital className="h-6 w-6 text-brand-700" />
            <h2 className="mt-4 font-display text-3xl">Built with hospitals in the loop</h2>
            <p className="mt-3 text-stone-500">
              Inventory, appointments, and incoming requests stay operational — not theatrical. Low-stock and expiry
              signals help teams act before a shortage becomes an emergency.
            </p>
            <Link to="/hospitals" className="mt-6 inline-block">
              <Button variant="secondary">Browse hospitals</Button>
            </Link>
          </div>
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-medium">Hospital operations snapshot</p>
              <div className="rounded-xl bg-stone-50 p-4 text-sm dark:bg-stone-900">Blood inventory by group</div>
              <div className="rounded-xl bg-stone-50 p-4 text-sm dark:bg-stone-900">Today’s appointments</div>
              <div className="rounded-xl bg-stone-50 p-4 text-sm dark:bg-stone-900">Incoming emergency requests</div>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-16 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto max-w-6xl px-4">
          <ShieldCheck className="h-6 w-6 text-brand-700" />
          <h2 className="mt-4 font-display text-3xl">Trust and safety</h2>
          <p className="mt-3 max-w-3xl text-stone-500">
            Red Pulse never exposes exact donor home locations, never stores passwords in the frontend, and never pretends
            that a browser role check is security. Authentication, matching, and eligibility belong to your Spring Boot
            API.
          </p>
        </div>
      </section>
    </div>
  );
}
