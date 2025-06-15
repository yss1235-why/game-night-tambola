
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AdminAccess = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'host' | 'admin' | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type') as 'host' | 'admin';
    if (type === 'host' || type === 'admin') {
      setLoginType(type);
    }
  }, [searchParams]);

  const handleLogin = () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    // Mock authentication - in a real app, this would be handled by your backend
    if (loginType === 'host') {
      if (email === 'host@tambola.com' && password === 'host123') {
        navigate('/host');
      } else {
        setError('Invalid host credentials');
      }
    } else if (loginType === 'admin') {
      if (email === 'admin@tambola.com' && password === 'admin456') {
        navigate('/admin');
      } else {
        setError('Invalid admin credentials');
      }
    }
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
            />
          </div>
          
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          
          <Button 
            onClick={handleLogin} 
            className={`w-full ${
              loginType === 'host' 
                ? 'bg-slate-600 hover:bg-slate-700' 
                : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            Login as {loginType === 'host' ? 'Host' : 'Admin'}
          </Button>
          
          <Button 
            onClick={handleBack} 
            variant="outline" 
            className="w-full border-slate-300 hover:bg-slate-50"
          >
            Back to Home
          </Button>
        </div>

        <div className="mt-6 p-3 bg-slate-50 rounded-md text-sm text-slate-600">
          <p className="font-medium mb-1">Demo Credentials:</p>
          {loginType === 'host' && (
            <p>Host: host@tambola.com / host123</p>
          )}
          {loginType === 'admin' && (
            <p>Admin: admin@tambola.com / admin456</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminAccess;
