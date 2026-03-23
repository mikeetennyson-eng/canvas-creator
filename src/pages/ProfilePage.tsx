import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { Sparkles, ArrowRight, Calendar, Trash2, Edit2, ExternalLink } from 'lucide-react';

interface Canvas {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserCanvases();
  }, []);

  const fetchUserCanvases = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getUserCanvases();
      setCanvases(response.canvases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load canvases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this canvas?')) return;

    try {
      await apiClient.deleteCanvas(id);
      setCanvases(canvases.filter((c) => c._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete canvas');
    }
  };

  const handleLoadCanvas = (id: string) => {
    navigate(`/editor?load=${id}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Canvas Creator</span>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* User Info Section */}
          <div className="mb-16">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="text-lg text-muted-foreground mb-4">{user?.email}</p>
              <p className="text-sm text-muted-foreground">Member since {user && formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Recent Canvases Section */}
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold">Recent Creations</h2>
              <p className="text-muted-foreground mt-2">Your last 5 saved diagrams</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : canvases.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No creations yet</h3>
                <p className="text-muted-foreground mb-6">Start creating your first diagram</p>
                <Button
                  onClick={() => navigate('/editor')}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {canvases.map((canvas) => (
                  <div
                    key={canvas._id}
                    className="group bg-card rounded-xl border border-border overflow-hidden shadow-lg hover:shadow-xl transition-all hover:border-primary/50"
                  >
                    {/* Thumbnail */}
                    {canvas.thumbnail ? (
                      <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
                        <img
                          src={canvas.thumbnail}
                          alt={canvas.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary/30" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{canvas.title}</h3>
                      {canvas.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{canvas.description}</p>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {formatDate(canvas.updatedAt)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleLoadCanvas(canvas._id)}
                          variant="default"
                          size="sm"
                          className="flex-1 gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </Button>
                        <Button
                          onClick={() => handleDelete(canvas._id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
