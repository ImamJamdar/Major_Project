import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Zap,
  Thermometer,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Wind,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh data every 30 seconds
    const dataInterval = setInterval(fetchDashboardData, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [kpisResponse, performanceResponse, alertsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/kpis`),
        axios.get(`${API}/dashboard/performance?days=1`),
        axios.get(`${API}/dashboard/alerts`)
      ]);

      setKpis(kpisResponse.data);
      setPerformanceData(performanceResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPower = (value) => `${value?.toFixed(1)} kW`;
  const formatEfficiency = (value) => `${value?.toFixed(1)}%`;
  const formatTemperature = (value) => `${value?.toFixed(1)}°C`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Required': return 'bg-red-500';
      case 'Warning': return 'bg-yellow-500';
      case 'Not Required': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: 'destructive',
      warning: 'secondary',
      info: 'outline'
    };
    return variants[severity] || 'outline';
  };

  // Sample data for charts if no real data
  const chartData = performanceData.length > 0 ? performanceData.slice(-24) : [
    { timestamp: '06:00', power_output: 0, efficiency: 0 },
    { timestamp: '08:00', power_output: 120, efficiency: 65 },
    { timestamp: '10:00', power_output: 280, efficiency: 78 },
    { timestamp: '12:00', power_output: 450, efficiency: 85 },
    { timestamp: '14:00', power_output: 380, efficiency: 82 },
    { timestamp: '16:00', power_output: 220, efficiency: 75 },
    { timestamp: '18:00', power_output: 50, efficiency: 45 },
  ];

  const efficiencyDistribution = React.useMemo(() => {
    if (!performanceData.length) return [];

    const optimal = performanceData.filter(d => d.efficiency >= 80).length;
    const good = performanceData.filter(d => d.efficiency >= 60 && d.efficiency < 80).length;
    const poor = performanceData.filter(d => d.efficiency < 60).length;
    const total = performanceData.length;

    return [
      { name: 'Optimal (>80%)', value: Math.round((optimal / total) * 100), color: '#10b981' },
      { name: 'Good (60-80%)', value: Math.round((good / total) * 100), color: '#f59e0b' },
      { name: 'Poor (<60%)', value: Math.round((poor / total) * 100), color: '#ef4444' }
    ];
  }, [performanceData]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
            Solar Panel Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring and predictive maintenance overview
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <Calendar className="h-4 w-4" />
            <span>{currentTime.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Power Output</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPower(kpis?.current_power_output)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Efficiency</CardTitle>
            <Gauge className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatEfficiency(kpis?.efficiency_percentage)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -2% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panel Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatTemperature(kpis?.panel_temperature)}
            </div>
            <p className="text-xs text-muted-foreground">
              Optimal range: 25-35°C
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-bl-full opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dust Level</CardTitle>
            <Wind className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-purple-600">
                {kpis?.dust_level_index || 'Medium'}
              </div>
              <div className={`w-3 h-3 rounded-full ${kpis?.dust_level_index === 'Low' ? 'bg-green-500' :
                kpis?.dust_level_index === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Cleaning scheduled: 3 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Power Output Chart */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Power Output Trend</CardTitle>
            <CardDescription>24-hour power generation curve</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatTime}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatPower(value), 'Power Output']}
                  labelFormatter={(label) => `Time: ${formatTime(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="power_output"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Chart */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Efficiency Analysis</CardTitle>
            <CardDescription>System efficiency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatTime}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatEfficiency(value), 'Efficiency']}
                  labelFormatter={(label) => `Time: ${formatTime(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status and Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Maintenance Status */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Maintenance Status</CardTitle>
            <CardDescription>System health overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Panels</span>
              <span className="text-2xl font-bold">{kpis?.total_panels || 10}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">Operational</span>
              <span className="font-semibold">{kpis?.panels_operational ?? 8}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-600">Warning</span>
              <span className="font-semibold">{kpis?.panels_warning ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">Requires Maintenance</span>
              <span className="font-semibold">{kpis?.panels_requiring_maintenance ?? 2}</span>
            </div>
            <div className="pt-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(kpis?.maintenance_status)}`}></div>
                <span className="text-sm font-medium">Overall Status: {kpis?.maintenance_status || 'Warning'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Efficiency Distribution */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Efficiency Distribution</CardTitle>
            <CardDescription>Panel performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={efficiencyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {efficiencyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {efficiencyDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert, index) => (
                <div key={alert.id || index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="mt-0.5">
                    {alert.severity === 'critical' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {alert.panel_id}
                      </p>
                      <Badge variant={getSeverityBadge(alert.severity)} className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No alerts at this time</p>
                <p className="text-xs">All systems operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;