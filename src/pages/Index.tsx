
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import PlayerView from './PlayerView';

const Index = () => {
  const navigate = useNavigate();

  const handleHostLogin = () => {
    navigate('/access?type=host');
  };

  const handleAdminLogin = () => {
    navigate('/access?type=admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto p-4">
        {/* Header with Login dropdown in top right */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="border-slate-300 hover:bg-slate-50"
              >
                Login
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white border border-slate-200 shadow-lg">
              <DropdownMenuItem 
                onClick={handleHostLogin}
                className="cursor-pointer hover:bg-slate-50"
              >
                Host
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleAdminLogin}
                className="cursor-pointer hover:bg-slate-50"
              >
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
