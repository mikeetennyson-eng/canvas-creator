import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { 
  Zap, 
  Palette, 
  Download, 
  Share2, 
  Sparkles, 
  ArrowRight,
  Grid3x3,
  Layers,
  Wind
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const features = [
    {
      icon: Grid3x3,
      title: 'Intuitive Canvas',
      description: 'Elegant drawing interface with real-time editing and zoom controls',
    },
    {
      icon: Palette,
      title: 'Rich Icon Library',
      description: 'Access thousands of professional icons for your diagrams',
    },
    {
      icon: Layers,
      title: 'Advanced Shapes',
      description: 'Create rectangles, circles, arrows, and text elements',
    },
    {
      icon: Download,
      title: 'Multiple Exports',
      description: 'Export your work as PNG images or JSON files',
    },
    {
      icon: Wind,
      title: 'Smooth Performance',
      description: 'Lightning-fast rendering with optimized canvas manipulation',
    },
    {
      icon: Sparkles,
      title: 'Dark Mode Support',
      description: 'Work comfortably in any lighting condition',
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Canvas Creator</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/editor')}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  Create <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  Sign Up <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Gradient background elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="flex items-center gap-2 text-sm font-medium text-primary">
              <Zap className="w-4 h-4" />
              Visual Diagram Creation Made Easy
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create Beautiful Diagrams in Seconds
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Unleash your creativity with our powerful canvas editor. Design professional diagrams, wireframes, and visual content with an intuitive interface and unlimited possibilities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => navigate('/editor')}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Start Creating Now <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              variant="outline"
              size="lg"
            >
              Learn More
            </Button>
          </div>

          {/* Preview card */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Grid3x3 className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Your canvas awaits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Powerful Features at Your Fingertips
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional diagrams and designs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:bg-card"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join creators who are building amazing visual content every day
          </p>
          <Button
            onClick={() => navigate('/editor')}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Launch Canvas Creator <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 Canvas Creator. Built with ❤️ for creative minds.</p>
        </div>
      </footer>
    </div>
  );
}

