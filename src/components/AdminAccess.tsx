
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminAccess = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<'host' | 'admin' | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type') as 'host' | 'admin';
    if (type === 'host' || type === 'admin') {
      setLoginType(type);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user exists in hosts table to determine if they're a host/admin
        const { data: hostData, error: hostError } = await supabase
          .from('hosts')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (hostError && hostError.code !== 'PGRST116') {
          console.error('Host check error:', hostError);
          setError('Error verifying user permissions');
          setLoading(false);
          return;
        }

        if (hostData) {
          // User is a host/admin, redirect to appropriate dashboard
          if (loginType === 'host') {
            navigate('/host');
          } else if (loginType === 'admin') {
            navigate('/admin');
          }
        } else {
          setError('User not authorized for this login type');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-lg border-slate-200">
          <p className="text-slate-600 text-center">Invalid login type. Please go back and try again.</p>
          <Button onClick={handleBack} className="w-full mt-4 bg-slate-600 hover:bg-slate-700">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="p-6 max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-lg border-slate-200">
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">
          {loginType === 'host' ? 'Host Login' : 'Admin Login'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 border-slate-300 focus:border-slate-500"
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-slate-700">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 border-slate-300 focus:border-slate-500"
              disabled={loading}
            />
          </div>
          
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className={`w-full ${
              loginType === 'host' 
                ? 'bg-slate-600 hover:bg-slate-700' 
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {loading ? 'Logging in...' : `Login as ${loginType === 'host' ? 'Host' : 'Admin'}`}
          </Button>
          
          <Button 
            onClick={handleBack} 
            variant="outline" 
            disabled={loading}
            className="w-full border-slate-300 hover:bg-slate-50"
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminAccess;
