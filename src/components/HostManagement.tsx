import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Trash2, Edit, Calendar } from 'lucide-react';

interface Host {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subscription_expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const HostManagement: React.FC = () => {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [extensionDays, setExtensionDays] = useState('30');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      setIsLoading(true);
      console.log('HostManagement: Fetching hosts from database...');
      
      const { data, error } = await supabase
        .from('hosts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('HostManagement: Error fetching hosts:', error);
        throw error;
      }
      
      console.log('HostManagement: Fetched hosts:', data);
      setHosts(data || []);
    } catch (error) {
      console.error('HostManagement: Error fetching hosts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hosts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extendSubscription = async (hostId: string) => {
    try {
      const days = parseInt(extensionDays);
      const extensionDate = new Date();
      extensionDate.setDate(extensionDate.getDate() + days);

      const { error } = await supabase
        .from('hosts')
        .update({ subscription_expires_at: extensionDate.toISOString() })
        .eq('id', hostId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription extended by ${days} days`
      });

      fetchHosts();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast({
        title: "Error",
        description: "Failed to extend subscription",
        variant: "destructive"
      });
    }
  };

  const changePassword = async (hostId: string) => {
    if (!newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(hostId, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully"
      });

      setNewPassword('');
      setEditingHost(null);
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    }
  };

  const deleteHost = async (hostId: string) => {
    if (!confirm('Are you sure you want to delete this host? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(hostId);
      
      // Call the edge function to delete the host
      const { data, error } = await supabase.functions.invoke('delete-host', {
        body: { hostId }
      });

      if (error) {
        console.error('Error calling delete-host function:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: "Host deleted successfully"
      });

      fetchHosts();
    } catch (error) {
      console.error('Error deleting host:', error);
      toast({
        title: "Error",
        description: "Failed to delete host",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading hosts...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Host Management</h3>
      
      {/* Debug info */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>Database Connection:</strong> Successfully loaded {hosts.length} hosts from database
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <Label>Extend Subscription (days)</Label>
            <Input
              type="number"
              value={extensionDays}
              onChange={(e) => setExtensionDays(e.target.value)}
              placeholder="30"
              className="w-32"
            />
          </div>
        </div>
      </div>

      {hosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hosts found in database</p>
          <p className="text-sm text-gray-400 mt-2">Create a new host using the "Create Host" tab</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Subscription Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => (
                <TableRow key={host.id}>
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell>{host.email}</TableCell>
                  <TableCell>{host.phone || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(host.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {host.subscription_expires_at 
                      ? new Date(host.subscription_expires_at).toLocaleDateString()
                      : 'No expiry'
                    }
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      host.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {host.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => extendSubscription(host.id)}
                        title="Extend Subscription"
                      >
                        <Calendar size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingHost(host)}
                        title="Change Password"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteHost(host.id)}
                        disabled={isDeleting === host.id}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Host"
                      >
                        {isDeleting === host.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingHost && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-4">Change Password for {editingHost.name}</h4>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <Button onClick={() => changePassword(editingHost.id)}>
              Update Password
            </Button>
            <Button variant="outline" onClick={() => setEditingHost(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default HostManagement;
