
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CreateAdmin = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createAdmin = async () => {
    setIsCreating(true);
    try {
      console.log('Creating admin user...');
      
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: 'yurs@gmail.com',
          password: 'Qwe123',
          name: 'Admin User',
          phone: null
        }
      });

      if (error) {
        console.error('Error creating admin:', error);
        throw error;
      }

      console.log('Admin created successfully:', data);
      
      toast({
        title: "Success",
        description: "Admin user created successfully! You can now login with yurs@gmail.com"
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Create Admin User</h3>
      <p className="text-sm text-gray-600 mb-4">
        This will create an admin user with email: yurs@gmail.com
      </p>
      <Button 
        onClick={createAdmin} 
        disabled={isCreating}
        className="w-full"
      >
        {isCreating ? 'Creating...' : 'Create Admin User'}
      </Button>
    </Card>
  );
};

export default CreateAdmin;
