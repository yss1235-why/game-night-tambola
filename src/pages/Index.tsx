
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
        {/* Header with Staff Access button in top right */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setShowStaffAccess(!showStaffAccess)}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50"
          >
            Staff Access
          </Button>
        </div>

        {/* Staff Access Login Buttons */}
        {showStaffAccess && (
          <Card className="mb-6 p-4 bg-white/90 backdrop-blur-sm shadow-lg border-slate-200">
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/access')}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                Host Login
              </Button>
              <Button 
                onClick={() => navigate('/access')}
                className="bg-slate-800 hover:bg-slate-900 text-white"
              >
                Admin Login
              </Button>
            </div>
          </Card>
        )}

        <Card className="mb-6 p-6 text-center bg-white/90 backdrop-blur-sm shadow-lg border-slate-200">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Tambola Game</h1>
          <p className="text-lg text-slate-600 mb-6">Join the fun and win exciting prizes!</p>
        </Card>

        <PlayerView />
      </div>
    </div>
  );
};

export default Index;
