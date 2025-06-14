
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import PlayerView from './PlayerView';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        <Card className="mb-6 p-6 text-center bg-white/80 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Tambola Game</h1>
          <p className="text-lg text-gray-600 mb-6">Join the fun and win exciting prizes!</p>
          
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate('/host')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Host Login
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Admin Panel
            </Button>
          </div>
        </Card>

        <PlayerView />
      </div>
    </div>
  );
};

export default Index;
