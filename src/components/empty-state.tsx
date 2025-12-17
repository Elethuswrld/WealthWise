'use client';

import type { LucideIcon } from 'lucide-react';
import { useSpring, animated } from '@react-spring/web';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  const props = useSpring({ opacity: 1, from: { opacity: 0 }, config: { duration: 600 } });
  
  return (
    <animated.div style={props} className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      {Icon && <div className="mb-4 text-4xl"><Icon className="h-10 w-10" /></div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm">{description}</p>}
    </animated.div>
  );
}
