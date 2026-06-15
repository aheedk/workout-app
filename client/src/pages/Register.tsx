import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { AuthScreen, SubmitButton, fieldClass, labelClass, fieldErrorClass } from '../components/features/AuthScreen';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setSubmitError(null);
      await registerUser(data.email, data.password, data.name);
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error.response?.data?.message ?? 'Registration failed');
    }
  };

  return (
    <AuthScreen
      title="Join up"
      subtitle="Start your training log. It's free."
      footer={
        <>
          Already lifting with us?{' '}
          <Link to="/login" className="font-semibold text-blue-500 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" {...register('name')} className={fieldClass} autoComplete="name" />
          {errors.name && <p className={fieldErrorClass}>{errors.name.message}</p>}
        </div>

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
            autoComplete="new-password"
          />
          {errors.password && <p className={fieldErrorClass}>{errors.password.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className={fieldClass}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className={fieldErrorClass}>{errors.confirmPassword.message}</p>
          )}
        </div>

        {submitError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        <SubmitButton pending={isSubmitting} pendingLabel="Creating…" label="Create account" />
      </form>
    </AuthScreen>
  );
}
