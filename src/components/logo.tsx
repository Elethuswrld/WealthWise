import { AreaChart } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <AreaChart className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-headline font-bold">WealthWise</h1>
    </Link>
  );
}
