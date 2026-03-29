import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Sparkles, ArrowRight, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) return;
    
    try {
      await login(email, password);
      navigate('/editor');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setGeneralError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Canvas Creator</span>
          </Link>
          {isAuthenticated ? (
            <>
              <Button
                onClick={() => navigate('/profile')}
                variant="ghost"
                size="sm"
              >
                Profile
              </Button>
              <Button
                onClick={() => navigate('/editor')}
                variant="default"
                size="sm"
                className="gap-2"
              >
                Create <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/">
              <Button variant="ghost">Back Home</Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20 pt-32">
        <div className="w-full max-w-md">
          {/* Decorative elements */}
          <div className="absolute top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

          {/* Form Container */}
          <div className="relative z-10 bg-card rounded-2xl border border-border p-8 shadow-xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to your Canvas Creator account</p>
            </div>

            {/* Error Messages */}
            {generalError && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{generalError}</p>
              </div>
            )}

            {authError && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{authError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">Don't have an account?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Signup Link */}
            <Link to="/signup">
              <Button variant="outline" className="w-full">
                Create new account
              </Button>
            </Link>

            {/* Back to Home */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              <Link to="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
