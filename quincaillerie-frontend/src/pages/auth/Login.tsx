import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/index'
import { toast } from '@/store/ui.store'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Au moins 6 caractères'),
})

export default function Login() {
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: any) => {
    try {
      const res = await api.post('/auth/login', data)
      const { user, accessToken, refreshToken } = res.data?.data || res.data
      setAuth(user, accessToken, refreshToken)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error('Connexion échouée', err?.response?.data?.message || 'Vérifiez vos identifiants')
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-card border-r border-border p-12 relative overflow-hidden">
        {/* BG decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">QuincaPro</span>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="space-y-6 max-w-sm">
            <div>
              <h2 className="font-display font-bold text-4xl text-foreground leading-tight">
                Gérez votre<br />
                <span className="text-gradient">quincaillerie</span><br />
                intelligemment.
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Stocks, ventes, achats, facturation PDF et envoi WhatsApp automatique — tout en un.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                'Tableau de bord en temps réel',
                'Facturation PDF automatique',
                'Envoi WhatsApp instantané',
                'Gestion multi-rôles',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/50 relative z-10">© 2026 QuincaPro — Tous droits réservés</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">QuincaPro</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Adresse email" error={errors.email?.message as string} required>
              <Input
                type="email"
                placeholder="admin@quincaillerie.com"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message as string}
                {...register('email')}
              />
            </FormField>

            <FormField label="Mot de passe" error={errors.password?.message as string} required>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message as string}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <Button type="submit" className="w-full gap-2" loading={isSubmitting} size="lg">
              Se connecter <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-secondary border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Compte démo</p>
            <p className="text-xs font-mono text-foreground">admin@quincaillerie.com</p>
            <p className="text-xs font-mono text-foreground">Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
