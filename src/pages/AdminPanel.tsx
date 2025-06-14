
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              Back to Game
            </Button>
          </div>
          
          <div className="text-center text-gray-600 py-8">
            <p className="text-lg">Admin features coming soon...</p>
            <p className="text-sm mt-2">This will include winner management and game administration tools.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
