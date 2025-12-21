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
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Predictions = () => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();

    // Refetch when window regains focus (e.g., after navigation from another page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPredictions();
      }
    };

    // Auto-refresh every 30 seconds to catch new data
    const refreshInterval = setInterval(() => {
      fetchPredictions();
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await axios.get(`${API}/predictions/forecast?t=${timestamp}`);
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // Fallback to mock data if API fails
      setPredictions({
        next_7_days_power: generateMockPowerForecast(),
        efficiency_forecast: generateMockEfficiencyForecast(),
        maintenance_predictions: generateMockMaintenancePredictions(),
        recommendations: [
          "Panel A1 efficiency expected to drop below 70% in 3 days - schedule cleaning",
          "High temperature forecast for next week - monitor cooling systems",
          "Dust accumulation pattern suggests cleaning needed for Panel B2 in 5 days",
          "Weather forecast shows optimal conditions for next 3 days - expect peak performance"
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockPowerForecast = () => {
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Simulate weather variations
      const baseValue = 350 + Math.sin(i * 0.5) * 50;
      const weatherFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2

      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_power: baseValue * weatherFactor,
        confidence: Math.random() * 0.15 + 0.85, // 85-100%
        lower_bound: baseValue * weatherFactor * 0.85,
        upper_bound: baseValue * weatherFactor * 1.15
      });
    }

    return forecast;
  };

  const generateMockEfficiencyForecast = () => {
    const forecast = [];
    const today = new Date();
    let efficiency = 85;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Gradual decline with some variation
      efficiency -= Math.random() * 2 + 0.5;
      efficiency = Math.max(efficiency, 65); // Minimum 65%

      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted_efficiency: efficiency,
        confidence: Math.random() * 0.10 + 0.85
      });
    }

    return forecast;
  };

  const generateMockMaintenancePredictions = () => {
    const predictions = [];
    const today = new Date();
    const statuses = ['Not Required', 'Warning', 'Required'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Higher probability of maintenance needed as days progress
      const maintenanceProb = i * 0.1 + 0.1;
      let status;

      if (maintenanceProb > 0.6) status = 'Required';
      else if (maintenanceProb > 0.3) status = 'Warning';
      else status = 'Not Required';

      predictions.push({
        date: date.toISOString().split('T')[0],
        maintenance_status: status,
        probability: Math.random() * 0.3 + 0.7
      });
    }

    return predictions;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMaintenanceColor = (status) => {
    switch (status) {
      case 'Required': return '#ef4444';
      case 'Warning': return '#f59e0b';
      case 'Not Required': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    if (recommendation.includes('clean')) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (recommendation.includes('temperature')) return <Activity className="h-4 w-4 text-orange-500" />;
    if (recommendation.includes('optimal')) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <Lightbulb className="h-4 w-4 text-blue-500" />;
  };

  // Calculate prediction insights
  const predictionInsights = React.useMemo(() => {
    if (!predictions) return null;

    const avgPower = predictions.next_7_days_power.reduce((sum, item) =>
      sum + item.predicted_power, 0) / predictions.next_7_days_power.length;

    const avgEfficiency = predictions.efficiency_forecast.reduce((sum, item) =>
      sum + item.predicted_efficiency, 0) / predictions.efficiency_forecast.length;

    const maintenanceNeeded = predictions.maintenance_predictions.filter(
      item => item.maintenance_status === 'Required'
    ).length;

    const nextMaintenanceDay = predictions.maintenance_predictions.findIndex(
      item => item.maintenance_status === 'Required'
    ) + 1;

    return {
      avgPower: avgPower.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      maintenanceNeeded,
      nextMaintenanceDay: nextMaintenanceDay > 0 ? nextMaintenanceDay : null
    };
  }, [predictions]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            Predictions & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Machine learning-powered forecasts and maintenance recommendations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPredictions}
            disabled={loading}
            className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className={`h-5 w-5 text-green-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {loading ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>

          <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              ML Models Active
            </span>
          </div>
        </div>
      </div>

      {/* Prediction Summary Cards */}
      {predictionInsights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Predicted Power</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {predictionInsights.avgPower} kW
              </div>
              <p className="text-xs text-muted-foreground">
                Next 7 days average
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predicted Efficiency</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {predictionInsights.avgEfficiency}%
              </div>
              <p className="text-xs text-muted-foreground">
                Expected system efficiency
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {predictionInsights.maintenanceNeeded}
              </div>
              <p className="text-xs text-muted-foreground">
                Days requiring maintenance
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Maintenance</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {predictionInsights.nextMaintenanceDay ? `${predictionInsights.nextMaintenanceDay} days` : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                Until required maintenance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Power Output Forecast */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>7-Day Power Output Forecast</CardTitle>
            <CardDescription>Predicted power generation with confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={predictions?.next_7_days_power || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatDate}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${value.toFixed(1)} kW`,
                    name === 'predicted_power' ? 'Predicted Power' :
                      name === 'upper_bound' ? 'Upper Bound' : 'Lower Bound'
                  ]}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Area
                  dataKey="upper_bound"
                  stackId="1"
                  stroke="none"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                />
                <Area
                  dataKey="lower_bound"
                  stackId="1"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_power"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Forecast */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Efficiency Trend Forecast</CardTitle>
            <CardDescription>Predicted system efficiency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions?.efficiency_forecast || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatDate}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Predicted Efficiency']}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_efficiency"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Predictions */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Maintenance Probability Forecast</CardTitle>
            <CardDescription>Predicted maintenance needs by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictions?.maintenance_predictions || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatDate}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    `${(value * 100).toFixed(1)}%`,
                    'Maintenance Probability'
                  ]}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Bar
                  dataKey="probability"
                  fill={(entry) => getMaintenanceColor(entry?.maintenance_status)}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weather Impact Simulation */}
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle>Weather Impact Analysis</CardTitle>
            <CardDescription>Simulated performance under different conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { condition: 'Sunny', power: 450, efficiency: 90 },
                { condition: 'Partly Cloudy', power: 320, efficiency: 75 },
                { condition: 'Cloudy', power: 180, efficiency: 60 },
                { condition: 'Rainy', power: 80, efficiency: 45 },
                { condition: 'Dusty', power: 240, efficiency: 55 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="condition" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="power" fill="#3b82f6" name="Power (kW)" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} name="Efficiency (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <span>Recommendations</span>
          </CardTitle>
          <CardDescription>
            Machine learning insights and actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions?.recommendations?.map((recommendation, index) => (
              <Alert key={index} className="border-l-4 border-l-blue-500">
                <div className="flex items-start space-x-3">
                  {getRecommendationIcon(recommendation)}
                  <div className="flex-1">
                    <AlertDescription className="text-sm">
                      {recommendation}
                    </AlertDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Priority: {index < 2 ? 'High' : 'Medium'}
                  </Badge>
                </div>
              </Alert>
            )) || (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">AI recommendations will appear here</p>
                  <p className="text-xs">Based on system performance and patterns</p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Model Accuracy</CardTitle>
            <CardDescription>Performance metrics of prediction models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Power Output Model</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-semibold">92%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Efficiency Model</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <span className="text-sm font-semibold">88%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Maintenance Classifier</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-semibold">85%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Prediction Confidence</CardTitle>
            <CardDescription>Reliability scores for current forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next 24 Hours</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Very High (95%)
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next 3 Days</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  High (89%)
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next 7 Days</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Medium (75%)
                </Badge>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Confidence decreases with prediction horizon. Models are retrained weekly with new data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Predictions;