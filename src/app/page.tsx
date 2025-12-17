import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-dashboard');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <section className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-accent mb-4">
              Your Personal Finance Command Center
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Take control of your financial future. Track net worth, manage
              budgets, and gain AI-powered insights all in one place.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started for Free</Link>
              </Button>
            </div>
          </div>
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-2xl">
            <Image
              src={heroImage?.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'}
              alt={heroImage?.description || 'Financial Dashboard Illustration'}
              fill
              className="object-cover"
              data-ai-hint={heroImage?.imageHint || 'finance dashboard'}
            />
          </div>
        </section>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} WealthWise. All rights reserved.
      </footer>
    </div>
  );
}
