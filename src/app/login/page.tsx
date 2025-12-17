import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-headline font-semibold text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Log in to your WealthWise dashboard.
        </p>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
