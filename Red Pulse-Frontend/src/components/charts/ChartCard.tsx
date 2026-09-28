import { ResponsiveContainer } from 'recharts';
import type { ReactNode } from 'react';
import { Card, CardBody, CardHeader } from '@/components/cards/Card';

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {children as never}
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
