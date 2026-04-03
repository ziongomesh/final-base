import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Login() {
  const { admin, loading } = useAuth();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || splash) {
    return <LoadingScreen />;
  }

  if (admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, hsl(220 40% 12%) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 50%, hsl(230 30% 10%) 0%, transparent 50%),
          linear-gradient(to bottom, hsl(220 25% 6%), hsl(220 20% 4%))
        `,
      }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none blur-[200px]"
        style={{ background: 'hsl(217 50% 20% / 0.15)' }}
      />

      {/* Form container with fade-in */}
      <div
        className="relative z-10 w-full max-w-[400px] px-8 animate-fade-in"
      >
        <LoginForm />
      </div>
    </div>
  );
}
