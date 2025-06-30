// src/app/register/page.tsx - ACTUALIZADO CON LOGO
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineArrowLeft } from 'react-icons/hi';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar errores al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    try {
      // Validar con Zod
      const validatedData = registerSchema.parse(formData);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en el registro');
      }

      setSuccess(result.message);
      
      // Si necesita confirmación, redirigir a la página de confirmación
      if (result.needsConfirmation) {
        setTimeout(() => {
          router.push(`/confirm-signup?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        // Si no necesita confirmación, redirigir al login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }

    } catch (error: any) {
      console.error('Error de registro:', error);
      if (error.errors) {
        // Errores de validación de Zod
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path?.[0]) {
            errors[err.path[0]] = err.message;
          }
        });
        setFieldErrors(errors);
      } else {
        setError(error.message || 'Error en el registro');
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header con logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center mb-6 group">
            <HiOutlineArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors mr-2" />
            <span className="text-gray-600 group-hover:text-gray-800 transition-colors">Volver al inicio</span>
          </Link>
          
          <div className="mb-6">
            <Image 
              src="/alumac.webp" 
              alt="AlumGestión Logo" 
              width={80} 
              height={80}
              className="mx-auto mb-4"
            />
            <h2 className="text-3xl font-extrabold text-gray-900">Crear Cuenta</h2>
          </div>
        </div>

        {/* Register Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Registro</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <HiOutlineCheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Input
                  label="Nombre completo"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={fieldErrors.name}
                />
              </div>

              <div>
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={fieldErrors.email}
                />
              </div>

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={fieldErrors.password}
                  helperText="Mínimo 8 caracteres con mayúscula, minúscula y número"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmar contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  error={fieldErrors.confirmPassword}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              <div>
                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                  disabled={!!success}
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </div>
            </form>

            {/* Links */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-500">
                  Inicia sesión aquí
                </Link>
              </div>
            </div>
            
            {/* Términos y condiciones */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Al registrarte, aceptas nuestros{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Términos de Servicio</a>
                {' '}y{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Política de Privacidad</a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2025 AZIFE.</p>
          <p className="mt-1">Autenticación segura con AWS Cognito.</p>
        </div>
      </div>
    </div>
  );
}