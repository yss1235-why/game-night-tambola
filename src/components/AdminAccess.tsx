
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
    // For now, direct navigation without authentication
    // In a real app, you'd implement proper authentication here
    navigate('/host');
  };

  const handleAdminLogin = () => {
    // For now, direct navigation without authentication
    // In a real app, you'd implement proper authentication here
    navigate('/admin');
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Staff Access</h2>
      
      {!showHostLogin && !showAdminLogin && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="access-code">Enter Access Code</Label>
            <Input
              id="access-code"
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Access code"
              className="mt-1"
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          <Button onClick={handleAccessCode} className="w-full">
            Verify Access
          </Button>
        </div>
      )}

      {showHostLogin && (
        <div className="space-y-4">
          <p className="text-green-600 text-center">Host access verified</p>
          <Button onClick={handleHostLogin} className="w-full bg-blue-600 hover:bg-blue-700">
            Enter Host Dashboard
          </Button>
          <Button 
            onClick={() => {
              setShowHostLogin(false);
              setAccessCode('');
            }} 
            variant="outline" 
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}

      {showAdminLogin && (
        <div className="space-y-4">
          <p className="text-green-600 text-center">Admin access verified</p>
          <Button onClick={handleAdminLogin} className="w-full bg-purple-600 hover:bg-purple-700">
            Enter Admin Panel
          </Button>
          <Button 
            onClick={() => {
              setShowAdminLogin(false);
              setAccessCode('');
            }} 
            variant="outline" 
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AdminAccess;
