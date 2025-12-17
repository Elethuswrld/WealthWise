'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export default function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground"
    >
      {Icon && <div className="mb-4 text-4xl"><Icon className="h-10 w-10" /></div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm">{description}</p>}
    </motion.div>
  );
}
