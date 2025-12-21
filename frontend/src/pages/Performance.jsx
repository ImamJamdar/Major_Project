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
  ScatterChart,
  Scatter
} from 'recharts';
import { Calendar, Filter, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Performance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedPanel, setSelectedPanel] = useState('all');

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedDays]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/dashboard/performance?days=${selectedDays}`);
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
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

  const formatDate = (timeString) => {
    return new Date(timeString).toLocaleDateString();
  };

  // Calculate performance metrics
  const performanceMetrics = React.useMemo(() => {
    if (!performanceData.length) return null;

    const totalPower = performanceData.reduce((sum, item) => sum + item.power_output, 0);
    const avgEfficiency = performanceData.reduce((sum, item) => sum + item.efficiency, 0) / performanceData.length;
    const maxPower = Math.max(...performanceData.map(item => item.power_output));
    const avgDeviation = performanceData.reduce((sum, item) => sum + Math.abs(item.deviation), 0) / performanceData.length;

    return {
      totalPower: totalPower.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      maxPower: maxPower.toFixed(1),
      avgDeviation: avgDeviation.toFixed(1)
    };
  }, [performanceData]);

  // Generate comparison table data
  const comparisonData = React.useMemo(() => {
    return performanceData.slice(-20).map((item, index) => ({
      ...item,
      id: index + 1,
      status: Math.abs(item.deviation) > 10 ? 'critical' : Math.abs(item.deviation) > 5 ? 'warning' : 'normal'
    }));
  }, [performanceData]);

  // Generate scatter plot data (Irradiance vs Power Output)
  const scatterData = React.useMemo(() => {
    return performanceData.map(item => ({
      irradiance: item.irradiance || (item.power_output * 2), // Use real irradiance or fallback estimate
      power: item.power_output,
      efficiency: item.efficiency
    }));
  }, [performanceData]);

  // Calculate efficiency distribution from actual data
  const efficiencyDistribution = React.useMemo(() => {
    if (!performanceData.length) return [];

    const ranges = {
      '0-20%': 0,
      '20-40%': 0,
      '40-60%': 0,
      '60-80%': 0,
      '80-100%': 0
    };

    performanceData.forEach(item => {
      const eff = item.efficiency;
      if (eff >= 0 && eff < 20) ranges['0-20%']++;
      else if (eff >= 20 && eff < 40) ranges['20-40%']++;
      else if (eff >= 40 && eff < 60) ranges['40-60%']++;
      else if (eff >= 60 && eff < 80) ranges['60-80%']++;
      else if (eff >= 80 && eff <= 100) ranges['80-100%']++;
    });

    return [
      { range: '0-20%', count: ranges['0-20%'], color: '#ef4444' },
      { range: '20-40%', count: ranges['20-40%'], color: '#f59e0b' },
      { range: '40-60%', count: ranges['40-60%'], color: '#eab308' },
      { range: '60-80%', count: ranges['60-80%'], color: '#22c55e' },
      { range: '80-100%', count: ranges['80-100%'], color: '#10b981' }
    ];
  }, [performanceData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'normal': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
            Performance Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed performance metrics and trend analysis
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedPanel}
              onChange={(e) => setSelectedPanel(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Panels</option>
              <option value="A-1">Panel A-1</option>
              <option value="A-2">Panel A-2</option>
              <option value="A-3">Panel A-3</option>
              <option value="A-4">Panel A-4</option>
              <option value="A-5">Panel A-5</option>
              <option value="A-6">Panel A-6</option>
              <option value="A-7">Panel A-7</option>
              <option value="A-8">Panel A-8</option>
              <option value="A-9">Panel A-9</option>
              <option value="A-10">Panel A-10</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Power Generated</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {performanceMetrics.totalPower} kW
              </div>
              <p className="text-xs text-muted-foreground">
                Over selected period
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {performanceMetrics.avgEfficiency}%
              </div>
              <p className="text-xs text-muted-foreground">
                System performance
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Power Output</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {performanceMetrics.maxPower} kW
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum recorded
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Deviation</CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics.avgDeviation}%
              </div>
              <p className="text-xs text-muted-foreground">
                From expected output
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Power Output vs Efficiency */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Power Output vs Efficiency Trend</CardTitle>
            <CardDescription>Correlation between power generation and system efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={selectedDays === 1 ? formatTime : formatDate}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'power_output' ? `${value.toFixed(1)} kW` : `${value.toFixed(1)}%`,
                    name === 'power_output' ? 'Power Output' : 'Efficiency'
                  ]}
                  labelFormatter={(label) => selectedDays === 1 ? `Time: ${formatTime(label)}` : `Date: ${formatDate(label)}`}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="power_output"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="power_output"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="efficiency"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expected vs Actual Output */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Expected vs Actual Power Output</CardTitle>
            <CardDescription>Performance comparison against predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={selectedDays === 1 ? formatTime : formatDate}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${value.toFixed(1)} kW`,
                    name === 'expected_power' ? 'Expected' : 'Actual'
                  ]}
                />
                <Bar dataKey="expected_power" fill="#94a3b8" name="expected_power" />
                <Bar dataKey="power_output" fill="#3b82f6" name="power_output" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Irradiance vs Power Output Scatter */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Irradiance vs Power Output</CardTitle>
            <CardDescription>Correlation between solar irradiance and power generation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={scatterData.slice(-50)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  type="number"
                  dataKey="irradiance"
                  name="Irradiance"
                  unit=" W/m²"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="power"
                  name="Power"
                  unit=" kW"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Irradiance: {data.irradiance?.toFixed(0)} W/m²
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Power Output: {data.power?.toFixed(1)} kW
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter dataKey="power" fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Efficiency distribution over time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efficiencyDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} readings`, 'Count']} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Performance Comparison Table</CardTitle>
          <CardDescription>Detailed comparison of expected vs actual performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-medium">Time</th>
                  <th className="text-left p-3 font-medium">Expected Output</th>
                  <th className="text-left p-3 font-medium">Actual Output</th>
                  <th className="text-left p-3 font-medium">Deviation</th>
                  <th className="text-left p-3 font-medium">Efficiency</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3">
                      {selectedDays === 1 ? formatTime(item.timestamp) : formatDate(item.timestamp)}
                    </td>
                    <td className="p-3 font-mono">
                      {item.expected_power?.toFixed(1)} kW
                    </td>
                    <td className="p-3 font-mono">
                      {item.power_output?.toFixed(1)} kW
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`${item.deviation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.deviation > 0 ? '+' : ''}{item.deviation?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      {item.efficiency?.toFixed(1)}%
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(item.status)} border-0`}
                      >
                        {item.status === 'critical' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {item.status === 'warning' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;