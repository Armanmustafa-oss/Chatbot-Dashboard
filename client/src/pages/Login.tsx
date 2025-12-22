import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Demo credentials - hardcoded for static auth
const DEMO_CREDENTIALS = {
  admin: 'password123',
  demo: 'demo123456',
  test: 'test123456',
};

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate credentials against demo accounts
      if (!username || !password) {
        toast.error('Username and password are required');
        return;
      }

      // Check if credentials match any demo account
      const validPassword = DEMO_CREDENTIALS[username as keyof typeof DEMO_CREDENTIALS];
      if (!validPassword || validPassword !== password) {
        toast.error('Invalid username or password');
        return;
      }

      // Store authentication in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        username,
        email: `${username}@example.com`,
        name: username.charAt(0).toUpperCase() + username.slice(1),
      }));

      toast.success('Signed in successfully!');
      
      // Redirect to dashboard
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }

    // After successful login
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user-session', JSON.stringify({ name: 'Admin User', email: 'admin@example.com' }));
    window.location.href = '/'; // Redirect to dashboard
  };

  // const handleLogout = () => {
  //   localStorage.removeItem('isAuthenticated');
  //   localStorage.removeItem('user');
  //   setUsername('admin');
  //   setPassword('password123');
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Sign In
          </h1>
          <p className="text-slate-400">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <p className="text-xs text-slate-300 mb-3 font-semibold">
            📝 Demo Credentials:
          </p>
          <div className="space-y-2 text-xs text-slate-400">
            <div>
              <strong className="text-slate-300">Account 1:</strong>
              <br />
              Username: <code className="text-blue-300">admin</code>
              <br />
              Password: <code className="text-blue-300">password123</code>
            </div>
            <div className="pt-2 border-t border-slate-600">
              <strong className="text-slate-300">Account 2:</strong>
              <br />
              Username: <code className="text-blue-300">demo</code>
              <br />
              Password: <code className="text-blue-300">demo123456</code>
            </div>
            <div className="pt-2 border-t border-slate-600">
              <strong className="text-slate-300">Account 3:</strong>
              <br />
              Username: <code className="text-blue-300">test</code>
              <br />
              Password: <code className="text-blue-300">test123456</code>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          This is a demo login. No server required.
        </p>
      </Card>
    </div>
  );
}
