
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

const AdminAccess = () => {
  const [showHostLogin, setShowHostLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAccessCode = () => {
    setError('');
    
    if (accessCode === 'HOST123') {
      setShowHostLogin(true);
      setShowAdminLogin(false);
      setAccessCode('');
    } else if (accessCode === 'ADMIN456') {
      setShowAdminLogin(true);
      setShowHostLogin(false);
      setAccessCode('');
    } else {
      setError('Invalid access code');
    }
  };

  const handleHostLogin = () => {
    navigate('/host');
  };

  const handleAdminLogin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="p-6 max-w-md mx-auto bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Staff Access</h2>
        
        {!showHostLogin && !showAdminLogin && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="access-code" className="text-gray-700">Enter Access Code</Label>
              <Input
                id="access-code"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Access code"
                className="mt-1 border-gray-300 focus:border-blue-500"
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            
            <Button onClick={handleAccessCode} className="w-full bg-slate-600 hover:bg-slate-700">
              Verify Access
            </Button>
          </div>
        )}

        {showHostLogin && (
          <div className="space-y-4">
            <p className="text-green-600 text-center font-medium">Host access verified</p>
            <Button onClick={handleHostLogin} className="w-full bg-blue-600 hover:bg-blue-700">
              Enter Host Dashboard
            </Button>
            <Button 
              onClick={() => {
                setShowHostLogin(false);
                setAccessCode('');
              }} 
              variant="outline" 
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              Back
            </Button>
          </div>
        )}

        {showAdminLogin && (
          <div className="space-y-4">
            <p className="text-green-600 text-center font-medium">Admin access verified</p>
            <Button onClick={handleAdminLogin} className="w-full bg-purple-600 hover:bg-purple-700">
              Enter Admin Panel
            </Button>
            <Button 
              onClick={() => {
                setShowAdminLogin(false);
                setAccessCode('');
              }} 
              variant="outline" 
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              Back
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAccess;
