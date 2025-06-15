
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateHostFormProps {
  onHostCreated: () => void;
}

const CreateHostForm: React.FC<CreateHostFormProps> = ({ onHostCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating host via edge function:', formData.email);
      
      // Use the create-admin edge function
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        // If edge function fails, show more detailed error
        let errorMessage = 'Failed to create host';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      console.log('Host created successfully:', data);

      toast({
        title: "Success",
        description: "Host created successfully!"
      });

      setFormData({ name: '', email: '', phone: '', password: '' });
      onHostCreated();
    } catch (error) {
      console.error('Error creating host:', error);
      
      let errorMessage = 'Failed to create host';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Create New Host</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Host name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="host@example.com"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone number"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Password"
            required
          />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating...' : 'Create Host'}
        </Button>
      </form>
    </Card>
  );
};

export default CreateHostForm;
