import React from 'react';
import { CircuitBoard, Cpu, Fan, Gpu, MonitorCog, Package, type LucideProps } from 'lucide-react';

const icons: Record<string, React.ComponentType<LucideProps>> = {
  cpu: Cpu,
  gpu: Gpu,
  mainboard: CircuitBoard,
  cooler: Fan,
  kvm: MonitorCog,
};

export default function CategoryIcon({ slug, ...props }: { slug: string } & LucideProps) {
  const Icon = icons[slug] ?? Package;
  return <Icon aria-hidden {...props} />;
}
