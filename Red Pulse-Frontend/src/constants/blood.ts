import { BloodGroup, Urgency } from '@/types';

export const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
};

export const BLOOD_GROUP_OPTIONS = (Object.keys(BLOOD_GROUP_LABELS) as BloodGroup[]).map((value) => ({
  value,
  label: BLOOD_GROUP_LABELS[value],
}));

export const BLOOD_GROUPS = BLOOD_GROUP_OPTIONS;

export const URGENCY_LABELS: Record<Urgency, string> = {
  NORMAL: 'Normal',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency',
};

export const BLOOD_GROUP_INFO: { group: BloodGroup; summary: string }[] = [
  { group: 'O_NEGATIVE', summary: 'Often needed first in emergencies because it can be given to many recipients.' },
  { group: 'O_POSITIVE', summary: 'The most common group; high ongoing demand for trauma and surgery.' },
  { group: 'A_POSITIVE', summary: 'Frequently requested for planned procedures and community supply.' },
  { group: 'A_NEGATIVE', summary: 'A less common group that hospitals keep closely monitored.' },
  { group: 'B_POSITIVE', summary: 'Important for patients who require B or AB compatible units.' },
  { group: 'B_NEGATIVE', summary: 'A rarer inventory item; timely donation helps local hospitals.' },
  { group: 'AB_POSITIVE', summary: 'Recipients with AB+ can receive more groups; plasma from AB donors is valuable.' },
  { group: 'AB_NEGATIVE', summary: 'One of the least common groups; even a few units can change a hospital’s readiness.' },
];
