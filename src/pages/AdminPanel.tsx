
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
            >
              Back to Game
            </Button>
          </div>
          
          <div className="text-center text-gray-500 py-8">
            <p>Admin features coming soon...</p>
            <p className="text-sm mt-2">This will include winner management and game administration tools.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
