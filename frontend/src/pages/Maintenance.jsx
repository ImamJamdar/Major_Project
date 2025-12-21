import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Plus,
  History,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Maintenance = () => {
  const [alerts, setAlerts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    panel_id: '',
    task_type: 'Cleaning',
    description: '',
    priority: 'Medium',
    scheduled_date: '',
    estimated_duration: '',
    assigned_to: ''
  });

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const [alertsResponse, kpisResponse, tasksResponse] = await Promise.all([
        axios.get(`${API}/dashboard/alerts`),
        axios.get(`${API}/dashboard/kpis`),
        axios.get(`${API}/maintenance/tasks`).catch(() => ({ data: [] }))
      ]);

      setAlerts(alertsResponse.data);
      setKpis(kpisResponse.data);
      setMaintenanceTasks(tasksResponse.data);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.panel_id || !newTask.description || !newTask.scheduled_date || !newTask.assigned_to) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        ...newTask,
        scheduled_date: new Date(newTask.scheduled_date).toISOString()
      };

      const response = await axios.post(`${API}/maintenance/tasks`, taskData);
      setMaintenanceTasks(prev => [...prev, response.data]);
      setNewTask({
        panel_id: '',
        task_type: 'Cleaning',
        description: '',
        priority: 'Medium',
        scheduled_date: '',
        estimated_duration: '',
        assigned_to: ''
      });
      setShowTaskDialog(false);
      toast.success('Maintenance task scheduled successfully');
    } catch (error) {
      console.error('Error creating maintenance task:', error);
      toast.error('Failed to schedule maintenance task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`${API}/maintenance/tasks/${taskId}?status=${status}`);
      setMaintenanceTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status } : task
        )
      );
      toast.success(`Task marked as ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Derive maintenance schedule from active tasks and alerts
  const maintenanceSchedule = React.useMemo(() => {
    // Map active tasks
    const activeTasks = maintenanceTasks
      .filter(task => task.status !== 'Completed')
      .map(task => ({
        id: task.id || Math.random().toString(),
        panelId: task.panel_id,
        status: task.priority === 'High' ? 'Required' : 'Warning',
        issue: task.description,
        lastMaintenance: 'N/A',
        nextMaintenance: task.scheduled_date,
        priority: task.priority.toLowerCase(),
        estimatedTime: task.estimated_duration
      }));

    // If we have alerts but no tasks, we could optionally show them here
    // For now, we'll just show the active tasks
    return activeTasks;
  }, [maintenanceTasks]);

  // Derive maintenance history from completed tasks
  const maintenanceHistory = React.useMemo(() => {
    return maintenanceTasks
      .filter(task => task.status === 'Completed')
      .map(task => ({
        id: task.id || Math.random().toString(),
        date: task.scheduled_date,
        panel: task.panel_id,
        action: task.task_type,
        technician: task.assigned_to,
        duration: task.estimated_duration,
        status: 'completed',
        notes: task.description
      }));
  }, [maintenanceTasks]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Required': return 'bg-red-500';
      case 'Warning': return 'bg-yellow-500';
      case 'Not Required': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    return variants[priority] || 'outline';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Required': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'Not Required': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredSchedule = filter === 'all'
    ? maintenanceSchedule
    : maintenanceSchedule.filter(item => item.status === filter);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Maintenance Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule, track, and manage solar panel maintenance activities
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance Task</DialogTitle>
                <DialogDescription>
                  Create a new maintenance task for a solar panel.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="panel_id">Panel ID</Label>
                  <Input
                    id="panel_id"
                    value={newTask.panel_id}
                    onChange={(e) => setNewTask(prev => ({ ...prev, panel_id: e.target.value }))}
                    placeholder="e.g., Panel A1"
                  />
                </div>
                <div>
                  <Label htmlFor="task_type">Task Type</Label>
                  <select
                    id="task_type"
                    value={newTask.task_type}
                    onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value="Cleaning">Cleaning</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Repair">Repair</option>
                    <option value="Replacement">Replacement</option>
                    <option value="Calibration">Calibration</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the maintenance task"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="estimated_duration">Duration</Label>
                    <Input
                      id="estimated_duration"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: e.target.value }))}
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="scheduled_date">Scheduled Date</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={newTask.scheduled_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Input
                    id="assigned_to"
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                    placeholder="Technician name"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>
                    <Save className="h-4 w-4 mr-2" />
                    Schedule Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panels Requiring Maintenance</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {maintenanceSchedule.filter(item => item.status === 'Required').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate attention needed
            </p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panels Under Warning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {maintenanceSchedule.filter(item => item.status === 'Warning').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor closely
            </p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panels Operating Normally</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {maintenanceSchedule.filter(item => item.status === 'Not Required').length}
            </div>
            <p className="text-xs text-muted-foreground">
              No issues detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Schedule */}
      <Card className="animate-scale-in">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Maintenance Schedule</CardTitle>
              <CardDescription>Current maintenance status and upcoming tasks</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">All Panels</option>
                <option value="Required">Requires Maintenance</option>
                <option value="Warning">Warning</option>
                <option value="Not Required">Normal</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-medium">Panel ID</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Issue Description</th>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Last Maintenance</th>
                  <th className="text-left p-3 font-medium">Next Scheduled</th>
                  <th className="text-left p-3 font-medium">Est. Time</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.length > 0 ? (
                  filteredSchedule.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-medium">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span>{item.panelId}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></div>
                          <span>{item.status}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {item.issue}
                      </td>
                      <td className="p-3">
                        <Badge variant={getPriorityBadge(item.priority)}>
                          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                        {item.lastMaintenance !== 'N/A' ? new Date(item.lastMaintenance).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                        {new Date(item.nextMaintenance).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {item.estimatedTime}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Wrench className="h-3 w-3 mr-1" />
                            Schedule
                          </Button>
                          <Button size="sm" variant="ghost">
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colspan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <p className="font-medium">No maintenance tasks found</p>
                        <p className="text-xs mt-1">All systems are operating normally or no tasks match your filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance History Timeline */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
          <CardDescription>Recent maintenance activities and outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {maintenanceHistory.map((item, index) => (
              <div key={item.id} className="flex items-start space-x-4 relative">
                {/* Timeline line */}
                {index < maintenanceHistory.length - 1 && (
                  <div className="absolute left-4 top-10 w-px h-16 bg-gray-200 dark:bg-gray-700"></div>
                )}

                {/* Timeline dot */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-500' :
                  item.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}>
                  {item.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : item.status === 'pending' ? (
                    <Clock className="h-4 w-4 text-white" />
                  ) : (
                    <Wrench className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.action}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.panel} • {item.technician} • {item.duration}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {item.notes}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                      <Badge
                        variant={item.status === 'completed' ? 'outline' : 'secondary'}
                        className="mt-1"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;