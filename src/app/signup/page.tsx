import { SignupForm } from '@/components/auth/signup-form';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-headline font-semibold text-center mb-2">
          Create Your Account
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Get started with your personal finance command center.
        </p>
        <SignupForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
