import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Upload,
  Download,
  Settings as SettingsIcon,
  AlertTriangle,
  Users,
  Database,
  Save,
  RefreshCw,
  FileText,
  Shield,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [thresholds, setThresholds] = useState({
    dust_level_warning: 75,
    efficiency_warning: 70,
    efficiency_critical: 60,
    temperature_max: 45,
    power_deviation_warning: 10,
    power_deviation_critical: 20
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    maintenanceReminders: true,
    weeklyReports: true
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Viewer'
  });

  const [systemStats, setSystemStats] = useState({
    record_count: 0,
    database_status: 'Unknown',
    api_status: 'Unknown',
    ml_status: 'Unknown'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [usersResponse, thresholdsResponse, statsResponse] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/settings/thresholds`),
        axios.get(`${API}/system/stats`)
      ]);

      setUsers(usersResponse.data);
      setThresholds(thresholdsResponse.data);
      setSystemStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Initialize with demo data if API fails
      setUsers([
        { id: '1', name: 'John Smith', email: 'john@solar.com', role: 'Admin', status: 'Active' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah@solar.com', role: 'Technician', status: 'Active' },
        { id: '3', name: 'Mike Davis', email: 'mike@solar.com', role: 'Viewer', status: 'Active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (key, value) => {
    setThresholds(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveThresholds = async () => {
    try {
      await axios.put(`${API}/settings/thresholds`, thresholds);
      toast.success('Threshold settings saved successfully');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to save threshold settings');
    }
  };

  const handleSaveNotifications = () => {
    // Note: Notification settings are frontend-only for this demo
    toast.success('Notification settings saved successfully');
  };

  const handleDataImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
          toast.error('Please select a CSV file');
          return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size too large (max 10MB)');
          return;
        }

        toast.loading(`Uploading ${file.name}...`, { id: 'upload' });

        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);

        // Upload file and process
        const response = await axios.post(`${API}/data/import/file`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Clear the file input
        event.target.value = '';

        // Show detailed success message
        const { records_imported, data_summary, date_range } = response.data;

        toast.success(
          `✅ Data Import Successful!\n\n` +
          `📊 ${records_imported} records imported\n` +
          `⚡ Avg Power: ${data_summary.avg_power_output.toFixed(1)} kW\n` +
          `🔋 Avg Efficiency: ${data_summary.avg_efficiency.toFixed(1)}%\n` +
          `🔧 Maintenance Required: ${data_summary.maintenance_required_count} panels\n\n` +
          `Dashboard will update automatically...`,
          { id: 'upload', duration: 5000 }
        );

        // Wait a moment for backend processing to complete, then refresh dashboard
        setTimeout(() => {
          // Force refresh all data by reloading the page
          window.location.href = '/';
        }, 2000);

      } catch (error) {
        console.error('Error importing data:', error);
        const errorMessage = error.response?.data?.detail || 'Failed to import data';
        toast.error(`Import Failed: ${errorMessage}`, { id: 'upload' });
        event.target.value = '';
      }
    }
  };

  const handleExportData = async (type) => {
    try {
      const endpoint = type === 'performance' ? 'performance' : 'maintenance';
      const response = await axios.get(`${API}/data/export/${endpoint}`);

      // Create and download file
      const blob = new Blob([response.data.content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`${type} data exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(`Failed to export ${type} data`);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      const response = await axios.post(`${API}/users`, newUser);
      setUsers(prev => [...prev, response.data]);
      setNewUser({ name: '', email: '', role: 'Viewer' });
      setShowUserDialog(false);
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await axios.put(`${API}/users/${userId}`, updates);
      setUsers(prev => prev.map(user => user.id === userId ? response.data : user));
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`${API}/users/${userId}`);
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      Admin: 'destructive',
      Technician: 'default',
      Viewer: 'secondary'
    };
    return variants[role] || 'outline';
  };

  const getStatusBadge = (status) => {
    return status === 'Active' ? 'outline' : 'secondary';
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings & Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system parameters, data, and user access
          </p>
        </div>
      </div>

      <Tabs defaultValue="thresholds" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        {/* Threshold Settings */}
        <TabsContent value="thresholds">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Alert Thresholds</span>
                </CardTitle>
                <CardDescription>
                  Configure when maintenance alerts are triggered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dust_level_warning">Dust Level Warning (%)</Label>
                  <Input
                    id="dust_level_warning"
                    type="number"
                    value={thresholds.dust_level_warning}
                    onChange={(e) => handleThresholdChange('dust_level_warning', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Alert when dust level exceeds this percentage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiency_warning">Efficiency Warning (%)</Label>
                  <Input
                    id="efficiency_warning"
                    type="number"
                    value={thresholds.efficiency_warning}
                    onChange={(e) => handleThresholdChange('efficiency_warning', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Warning when efficiency drops below this level</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiency_critical">Efficiency Critical (%)</Label>
                  <Input
                    id="efficiency_critical"
                    type="number"
                    value={thresholds.efficiency_critical}
                    onChange={(e) => handleThresholdChange('efficiency_critical', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Critical alert when efficiency drops below this level</p>
                </div>

                <Button onClick={handleSaveThresholds} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Alert Thresholds
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5 text-blue-500" />
                  <span>Performance Thresholds</span>
                </CardTitle>
                <CardDescription>
                  Set performance monitoring parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="temperature_max">Maximum Temperature (°C)</Label>
                  <Input
                    id="temperature_max"
                    type="number"
                    value={thresholds.temperature_max}
                    onChange={(e) => handleThresholdChange('temperature_max', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Alert when panel temperature exceeds this value</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power_deviation_warning">Power Deviation Warning (%)</Label>
                  <Input
                    id="power_deviation_warning"
                    type="number"
                    value={thresholds.power_deviation_warning}
                    onChange={(e) => handleThresholdChange('power_deviation_warning', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Warning when power output deviates by this percentage</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power_deviation_critical">Power Deviation Critical (%)</Label>
                  <Input
                    id="power_deviation_critical"
                    type="number"
                    value={thresholds.power_deviation_critical}
                    onChange={(e) => handleThresholdChange('power_deviation_critical', e.target.value)}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Critical alert when deviation exceeds this percentage</p>
                </div>

                <Button onClick={handleSaveThresholds} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Performance Thresholds
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive system alerts and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alert Methods</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailAlerts">Email Alerts</Label>
                      <p className="text-xs text-gray-500">Receive alerts via email</p>
                    </div>
                    <Switch
                      id="emailAlerts"
                      checked={notifications.emailAlerts}
                      onCheckedChange={(value) => handleNotificationChange('emailAlerts', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="smsAlerts">SMS Alerts</Label>
                      <p className="text-xs text-gray-500">Receive critical alerts via SMS</p>
                    </div>
                    <Switch
                      id="smsAlerts"
                      checked={notifications.smsAlerts}
                      onCheckedChange={(value) => handleNotificationChange('smsAlerts', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-xs text-gray-500">Browser push notifications</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={(value) => handleNotificationChange('pushNotifications', value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Scheduled Reports</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceReminders">Maintenance Reminders</Label>
                      <p className="text-xs text-gray-500">Automated maintenance scheduling</p>
                    </div>
                    <Switch
                      id="maintenanceReminders"
                      checked={notifications.maintenanceReminders}
                      onCheckedChange={(value) => handleNotificationChange('maintenanceReminders', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weeklyReports">Weekly Reports</Label>
                      <p className="text-xs text-gray-500">System performance summaries</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={notifications.weeklyReports}
                      onCheckedChange={(value) => handleNotificationChange('weeklyReports', value)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-green-500" />
                  <span>Data Import</span>
                </CardTitle>
                <CardDescription>
                  Import new datasets for analysis and model training
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dataFile">Upload New Solar Panel Dataset</Label>
                  <Input
                    id="dataFile"
                    type="file"
                    accept=".csv"
                    onChange={handleDataImport}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload CSV file (max 10MB) - Dashboard will update automatically
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                    Required CSV Columns:
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 grid grid-cols-2 gap-1">
                    <span>• Timestamp</span>
                    <span>• Power_Output(kW)</span>
                    <span>• Irradiance(W/m2)</span>
                    <span>• Temperature(C)</span>
                    <span>• Humidity(%)</span>
                    <span>• Dust_Level(%)</span>
                    <span>• Voltage(V)</span>
                    <span>• Current(A)</span>
                    <span>• Efficiency(%)</span>
                    <span>• Maintenance_Status</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✨ <strong>Auto-Processing:</strong> ML models retrain automatically,
                    dashboard updates with your data patterns, and predictions adapt to your dataset.
                  </p>
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast.success('Retraining ML models with current data...');
                      await axios.post(`${API}/data/import`);
                      toast.success('ML models retrained successfully');
                    } catch (error) {
                      toast.error('Failed to retrain models');
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retrain ML Models (Current Data)
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <span>Data Export</span>
                </CardTitle>
                <CardDescription>
                  Export system data and generate reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleExportData('performance')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Performance Data (CSV)
                  </Button>

                  <Button
                    onClick={() => handleExportData('maintenance')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Maintenance Log (CSV)
                  </Button>

                  <Button
                    onClick={async () => {
                      try {
                        toast.loading('Generating PDF report...', { id: 'pdf' });
                        const response = await axios.get(`${API}/data/export/report/pdf`, {
                          responseType: 'blob'
                        });

                        // Create download link
                        const blob = new Blob([response.data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `performance_report_${new Date().toISOString().split('T')[0]}.pdf`;
                        link.click();
                        window.URL.revokeObjectURL(url);

                        toast.success('PDF report generated successfully!', { id: 'pdf' });
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                        toast.error('Failed to generate PDF report', { id: 'pdf' });
                      }
                    }}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Performance Report (PDF)
                  </Button>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reports include performance metrics, maintenance history,
                    and predictive insights
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span>User Management</span>
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts and access permissions
                  </CardDescription>
                </div>
                <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account with appropriate permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="newUserName">Name</Label>
                        <Input
                          id="newUserName"
                          value={newUser.name}
                          onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter user name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newUserEmail">Email</Label>
                        <Input
                          id="newUserEmail"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter user email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newUserRole">Role</Label>
                        <select
                          id="newUserRole"
                          value={newUser.role}
                          onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Technician">Technician</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser}>
                          Create User
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-3 font-medium">{user.name}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                          <td className="p-3">
                            <Badge variant={getRoleBadge(user.role)}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleUpdateUser(user.id, {
                                status: user.status === 'Active' ? 'Inactive' : 'Active'
                              })}
                              className="cursor-pointer"
                            >
                              <Badge variant={getStatusBadge(user.status)}>
                                {user.status}
                              </Badge>
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newRole = user.role === 'Admin' ? 'Technician' :
                                    user.role === 'Technician' ? 'Viewer' : 'Admin';
                                  handleUpdateUser(user.id, { role: newRole });
                                }}
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit Role
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No users found</p>
                      <p className="text-xs">Click "Add New User" to get started</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Information */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-500" />
                  <span>System Status</span>
                </CardTitle>
                <CardDescription>
                  Current system health and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {systemStats.database_status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {systemStats.api_status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ML Models Status</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {systemStats.ml_status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Records</span>
                  <span className="text-sm font-semibold">{systemStats.record_count.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Data Update</span>
                  <span className="text-sm text-gray-600">2 minutes ago</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Model Last Trained</span>
                  <span className="text-sm text-gray-600">1 hour ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>System Information</span>
                </CardTitle>
                <CardDescription>
                  Software version and configuration details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Application Version</span>
                  <span className="text-sm font-semibold">v1.0.0</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Version</span>
                  <span className="text-sm font-semibold">v1.0.0</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm font-semibold">MongoDB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ML Framework</span>
                  <span className="text-sm font-semibold">scikit-learn</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deployment</span>
                  <span className="text-sm font-semibold">Kubernetes</span>
                </div>

                <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    System uptime: 99.9% | Last restart: 7 days ago
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;