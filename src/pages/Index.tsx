
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PlayerView from './PlayerView';

const Index = () => {
  const navigate = useNavigate();
  const [showStaffAccess, setShowStaffAccess] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto p-4">
        <Card className="mb-6 p-6 text-center bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Tambola Game</h1>
          <p className="text-lg text-gray-600 mb-6">Join the fun and win exciting prizes!</p>
          
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setShowStaffAccess(!showStaffAccess)}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Staff Access
            </Button>
          </div>

          {showStaffAccess && (
            <div className="mt-6 flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/access')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Host Login
              </Button>
              <Button 
                onClick={() => navigate('/access')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Admin Login
              </Button>
            </div>
          )}
        </Card>

        <PlayerView />
      </div>
    </div>
  );
};

export default Index;
