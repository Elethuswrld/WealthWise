'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Sidebar } from '@/components/sidebar';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Home, Wallet, Repeat } from 'lucide-react';
import Link from 'next/link';


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Repeat },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: Wallet },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can show a loading spinner here
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-4">
              <div className='md:hidden'>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <div className="p-4">
                      <Logo />
                    </div>
                    <nav className="p-4">
                      <ul className="space-y-2">
                        {navItems.map(item => (
                          <li key={item.label}>
                            <Link href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
              <h1 className="text-lg font-semibold md:text-xl font-headline">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserNav />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
