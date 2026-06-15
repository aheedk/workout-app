import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { AuthScreen, SubmitButton, fieldClass, labelClass, fieldErrorClass } from '../components/features/AuthScreen';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setSubmitError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error.response?.data?.message ?? 'Login failed');
    }
  };

  return (
    <AuthScreen
      title="Sign in"
      subtitle="Pick up where you left the bar."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-blue-500 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" {...register('email')} className={fieldClass} autoComplete="email" />
          {errors.email && <p className={fieldErrorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            {...register('password')}
            className={fieldClass}
            autoComplete="current-password"
          />
          {errors.password && <p className={fieldErrorClass}>{errors.password.message}</p>}
        </div>

        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        <SubmitButton pending={isSubmitting} pendingLabel="Signing in…" label="Sign in" />
      </form>
    </AuthScreen>
  );
}
