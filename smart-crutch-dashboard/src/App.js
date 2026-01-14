import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Scale, Clock } from 'lucide-react';
import './App.css';

const SmartCrutchDashboard = () => {
  const [activeTab, setActiveTab] = useState('weight-bearing');
  const [timeRange, setTimeRange] = useState('1day');
  const [arduinoConfig, setArduinoConfig] = useState({
    clientId: '',
    clientSecret: '',
    deviceId: '',
    thingId: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState({
    force: [],
    steps: [],
    asymmetry: []
  });
  const [latestValues, setLatestValues] = useState({
    leftForce: 0,
    rightForce: 0,
    stepCount: 0,
    distance: 0,
    leftAccelZ: 0,
    rightAccelZ: 0
  });
  const [weightBearingStatus, setWeightBearingStatus] = useState('Non-Weight Bearing');
  const [userProfile] = useState({
    weight: 70,
    height: 170,
    targetLoad: 25
  });

  const TIME_RANGES = [
    { value: '1hour', label: 'Last Hour' },
    { value: '1day', label: '1 Day' },
    { value: '2day', label: '2 Days' },
    { value: '7day', label: '7 Days' },
    { value: '1month', label: '1 Month' }
  ];

  const CLOUD_IDS = {
    left: {
      thing: '107cc007-7572-4866-9668-142c1c355501',
      // adc: '6a9e22d4-09a7-4720-93b8-40bdbd6787dd',
      // device_id: '3a727d88-f793-489d-988f-ba402c9d891d',
      force: 'cef95317-e4ed-45be-aa03-da929df06f38',
      // force_filtered: '9bcd6de7-756d-4000-888b-4d43476a8bc9',
      // force_unfiltered: '360947b9-6fc9-4ce3-93d7-8eebf52519b2',
      // fsr_status: '118b68cf-13fd-4617-8ad7-1bf73e948855',
      // imu_stability: '900dc51d-3b13-48fb-9063-fd14632c9be5',
      // imu_step_count: '',
      is_walking: '86cdf022-eb9f-4b62-bc17-d0a3a6bf5b11',
      left_step_time: '45746a99-3f8f-4c4a-87b9-d196e4d8867e',
      // packet: 'f329a9c3-a415-4e49-8d26-f47361a02026',
      // timestamp: 'cef9f179-95a7-4c8e-99bd-c2c6f10bb398',
      // voltage: '8f3a18fa-ae2b-4b73-bb91-a87ad90e5a22'
    },
    right: {
      thing: '82f2869e-dd4b-4514-b288-946d5cb7ac77',
      // adc: '65a2e97c-e8c6-48c4-b713-a4a5fd5af262',
      // device_id: 'b77b12f9-4039-4caf-ae29-370b7d7069f7',
      force: 'a7c0b15b-19b5-4b16-8993-092321893f80',
      // force_filtered: '889aa2e1-8ec7-4a1f-b5eb-23fd1a99ea24',
      // force_unfiltered: '663b6782-60f3-47ed-9d94-a2bcb115f902',
      // fsr_status: '2be93782-ff66-46da-9ca4-173821705da9',
      // imu_stability: '5cbcac10-9f8d-4c67-bda2-8794f64f0845',
      imu_step_count: '35b905f5-b407-4553-b310-71db36e5ab89',
      is_walking: '14127d8f-fedd-4e48-9e94-3c1a70926f9d',
      right_step_time: 'bb9b1169-a517-4fc2-8e42-2b18130d6612',
      // packet: 'bee84019-2329-4f02-aa1e-52074dd17e32',
      // session_id: '20467d5a-4a76-4c4a-ac3a-685473255d16',
      // timestamp: '16f7c644-3185-4f35-84bd-aad362e722b9',
      // voltage: ''
    }
  };

  const startDataSimulation = async () => {
    // 1. DEFINITION
    const connectToRealArduinoCloud = async () => {
      try {
        const access_payload = {
           grant_type: "client_credentials",
           client_id: "BaAMuRoqV6l0lVVLswWHZ4T9aJjQooMN",
           client_secret: "80q4xwDYfcBuG7mQZcn1Gv9Dkrah1thPWlj5NNK4zbMwuk0rxVxSihROyTDIcHoC",
           audience: "https://api2.arduino.cc/iot"
        };

        const tokenResponse = await fetch('/iot/v1/clients/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(access_payload),
        });

        const access_data = await tokenResponse.json();
        setArduinoConfig({...arduinoConfig, accessToken: access_data.access_token})
        console.log(access_data)
        console.log("access_token", access_data.access_token)

        const from_time = "2026-01-13T17:00:00.000+00:00"
        const to_time = "2026-01-14T17:13:18.000+00:00"

        const batch_requests = [];

        // Loop through left and right
        ['left', 'right'].forEach(side => {
          const thingId = CLOUD_IDS[side].thing;

          // Loop through every property inside that side
          Object.keys(CLOUD_IDS[side]).forEach(key => {
            // Skip the 'thing' ID itself, we only want the property IDs
            if (key !== 'thing' && CLOUD_IDS[side][key] !== '') {
              batch_requests.push({
                q: `property.${CLOUD_IDS[side][key]}`,
                from: from_time,
                to: to_time
              });
            }
          });
        });
        console.log('batch requests', batch_requests)

        const batch_payload = {
           resp_version: 1,
           requests: batch_requests
        };

        const batch_response = await fetch('/iot/v2/series/batch_query', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_data.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(batch_payload),
        });

        // Extract data by property name
        const result = await batch_response.json();
        console.log('batch response', result)
        const responses_array = result.responses || [];
        const getProperty = (property_id) => responses_array.find(r =>
          r.property_id === property_id
        );

        const leftForceData = getProperty(CLOUD_IDS.left.force);
        const rightForceData = getProperty(CLOUD_IDS.right.force);
        console.log(leftForceData)
        console.log('left force')
        console.log(rightForceData)
        console.log('right force')
        const stepCountData = getProperty(CLOUD_IDS.right.imu_step_count);
        const distanceData = getProperty(CLOUD_IDS.right.imu_step_count);
        const leftStepTime = getProperty(CLOUD_IDS.left.left_step_time);
        const rightStepTime = getProperty(CLOUD_IDS.right.right_step_time);
        // Update latest values
        if (leftForceData && rightForceData) {
          const latestLeft = leftForceData.values[leftForceData.values.length - 1] || 0;
          const latestRight = rightForceData.values[rightForceData.values.length - 1] || 0;

          setLatestValues({
            leftForce: latestLeft,
            rightForce: latestRight,
            stepCount: stepCountData?.values[stepCountData.values.length - 1] || 0,
            distance: distanceData?.values[distanceData.values.length - 1] || 0,
            leftAccelZ: leftStepTime?.values[leftStepTime.values.length - 1] || 0,
            rightAccelZ: rightStepTime?.values[rightStepTime.values.length - 1] || 0
          });

          // Calculate weight bearing status
          const totalForce = latestLeft + latestRight;
          const percentBodyWeight = (totalForce / (userProfile.weight * 9.81)) * 100;

          if (percentBodyWeight < 5) {
            setWeightBearingStatus('Non-Weight Bearing (NWB)');
          } else if (percentBodyWeight < 25) {
            setWeightBearingStatus('Touch-Down Weight Bearing (TDWB)');
          } else if (percentBodyWeight < 50) {
            setWeightBearingStatus('Partial Weight Bearing (PWB)');
          } else if (percentBodyWeight < 75) {
            setWeightBearingStatus('Weight Bearing As Tolerated (WBAT)');
          } else {
            setWeightBearingStatus('Full Weight Bearing (FWB)');
          }
        }

        // Process chart data
        const forceChartData = [];
        const stepChartData = [];
        const asymmetryChartData = [];

        if (leftForceData && rightForceData) {
          for (let i = 0; i < leftForceData.times.length; i++) {
            const time = new Date(leftForceData.times[i]);
            forceChartData.push({
              time: formatTime(time, timeRange),
              fullTime: time.toISOString(),
              leftForce: leftForceData.values[i] || 0,
              rightForce: rightForceData.values[i] || 0
            });
          }
        }

        if (stepCountData) {
          for (let i = 0; i < stepCountData.times.length; i++) {
            const time = new Date(stepCountData.times[i]);
            stepChartData.push({
              time: formatTime(time, timeRange),
              fullTime: time.toISOString(),
              steps: stepCountData.values[i] || 0
            });
          }
        }

        if (leftStepTime && rightStepTime) {
          for (let i = 0; i < leftStepTime.times.length; i++) {
            const time = new Date(leftStepTime.times[i]);
            asymmetryChartData.push({
              time: formatTime(time, timeRange),
              fullTime: time.toISOString(),
              asymmetry: Math.abs((leftStepTime.values[i] || 0) - (rightStepTime.values[i] || 0))
            });
          }
        }

        setChartData({
          force: forceChartData,
          steps: stepChartData,
          asymmetry: asymmetryChartData
        });
      }
      catch (error) {
        console.error("Error:", error);
      };
    };

    // 2. EXECUTION
    connectToRealArduinoCloud();
  };

  const connectToArduinoCloud = async () => {
    if (!arduinoConfig.clientId || !arduinoConfig.clientSecret) {
      alert('Please enter Arduino Cloud credentials');
      return;
    }
    startDataSimulation();
    setIsConfigured(true);
    alert('Connected to Arduino Cloud! (Simulation Mode)');

    fetchArduinoData(timeRange);
  };

  const fetchArduinoData = async (range) => {
    setIsLoading(true);

    // Simulate API call - replace with actual Arduino Cloud API
    setTimeout(() => {
      const mockData = generateMockArduinoData(range);
      setIsLoading(false);
    }, 500);
  };

  const generateMockArduinoData = (range) => {
    const numPoints = range === '1hour' ? 12 : range === '1day' ? 24 : range === '2day' ? 48 : range === '7day' ? 168 : 720;
    const now = new Date();

    const generateTimeSeries = (baseValue, variance) => {
      const times = [];
      const values = [];

      for (let i = numPoints; i >= 0; i--) {
        const time = new Date(now - i * (range === '1hour' ? 300000 : 3600000));
        times.push(time.toISOString());
        values.push(baseValue + Math.random() * variance - variance / 2);
      }

      return { times, values };
    };

    return {
      resp_version: 1,
      responses: [
        {
          property_id: "left-force-id",
          property_name: "leftForce",
          property_type: "FLOAT",
          ...generateTimeSeries(25, 20)
        },
        {
          property_id: "right-force-id",
          property_name: "rightForce",
          property_type: "FLOAT",
          ...generateTimeSeries(25, 20)
        },
        {
          property_id: "step-count-id",
          property_name: "stepCount",
          property_type: "INT",
          ...generateTimeSeries(500, 200)
        },
        {
          property_id: "distance-id",
          property_name: "distance",
          property_type: "FLOAT",
          ...generateTimeSeries(2, 1)
        },
        {
          property_id: "left-accel-z-id",
          property_name: "leftAccelZ",
          property_type: "FLOAT",
          ...generateTimeSeries(9.81, 2)
        },
        {
          property_id: "right-accel-z-id",
          property_name: "rightAccelZ",
          property_type: "FLOAT",
          ...generateTimeSeries(9.81, 2)
        }
      ]
    };
  };


  const formatTime = (date, range) => {
    if (range === '1hour') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '1day' || range === '2day') {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    fetchArduinoData(range);
  };

  const TimeRangeSelector = () => (
    <div className="flex items-center space-x-2 mb-4 flex-wrap">
      <Clock size={20} className="text-gray-600" />
      <span className="text-sm font-medium text-gray-700">Time Range:</span>
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => handleTimeRangeChange(range.value)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            timeRange === range.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const WeightBearingDashboard = () => {
    const totalForce = latestValues.leftForce + latestValues.rightForce;
    const leftPercent = totalForce > 0 ? ((latestValues.leftForce / totalForce) * 100).toFixed(1) : 0;
    const rightPercent = totalForce > 0 ? ((latestValues.rightForce / totalForce) * 100).toFixed(1) : 0;
    const bodyWeightPercent = ((totalForce / (userProfile.weight * 9.81)) * 100).toFixed(1);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h3 className="text-2xl font-bold mb-2">Current Status</h3>
          <p className="text-4xl font-bold">{weightBearingStatus}</p>
          <p className="text-lg mt-2">{bodyWeightPercent}% of body weight</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-md border-2 border-blue-200">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Left Crutch</h4>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{latestValues.leftForce.toFixed(1)} N</p>
              <p className="text-gray-600 mt-2">{leftPercent}% of load</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-2 border-green-200">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Right Crutch</h4>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{latestValues.rightForce.toFixed(1)} N</p>
              <p className="text-gray-600 mt-2">{rightPercent}% of load</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-lg font-semibold mb-4">Force Distribution Over Time</h4>
          <TimeRangeSelector />
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-gray-500">Loading data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.force}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={timeRange === '1hour' ? 0 : -45}
                  textAnchor={timeRange === '1hour' ? 'middle' : 'end'}
                  height={60}
                />
                <YAxis label={{ value: 'Force (N)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="leftForce" stroke="#3b82f6" name="Left Crutch" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rightForce" stroke="#10b981" name="Right Crutch" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  const StepCountDashboard = () => {
    const dailyGoal = 1000;
    const goalProgress = ((latestValues.stepCount / dailyGoal) * 100).toFixed(0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Steps Today</p>
                <p className="text-4xl font-bold mt-2">{Math.round(latestValues.stepCount)}</p>
                <p className="text-sm mt-2">Goal: {dailyGoal} steps</p>
              </div>
              <Activity size={48} />
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Distance Today</p>
                <p className="text-4xl font-bold mt-2">{latestValues.distance.toFixed(2)*0.45}</p>
                <p className="text-sm mt-2">kilometers</p>
              </div>
              <TrendingUp size={48} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-lg font-semibold mb-4">Step Count Trend</h4>
          <TimeRangeSelector />
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-gray-500">Loading data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.steps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={timeRange === '1hour' ? 0 : -45}
                  textAnchor={timeRange === '1hour' ? 'middle' : 'end'}
                  height={60}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="steps" stroke="#a855f7" name="Step Count" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Today's Progress</h4>
          <p className="text-gray-700">
            You've completed {goalProgress}% of your daily goal.
            {goalProgress >= 100 ? ' Excellent work!' : ` Keep going - ${dailyGoal - Math.round(latestValues.stepCount)} steps to go!`}
          </p>
        </div>
      </div>
    );
  };

  const AsymmetryDashboard = () => {
    const asymmetryScore = Math.abs(latestValues.leftAccelZ - latestValues.rightAccelZ).toFixed(2);

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Gait Asymmetry Score</p>
              <p className="text-4xl font-bold mt-2">{asymmetryScore}</p>
              <p className="text-sm mt-2">Lower is better</p>
            </div>
            <Scale size={48} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Left Crutch IMU</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Z-axis:</span>
                <span className="font-semibold">{latestValues.leftAccelZ.toFixed(2)} m/s²</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Right Crutch IMU</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Z-axis:</span>
                <span className="font-semibold">{latestValues.rightAccelZ.toFixed(2)} m/s²</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-lg font-semibold mb-4">Asymmetry Trend</h4>
          <TimeRangeSelector />
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-gray-500">Loading data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.asymmetry}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={timeRange === '1hour' ? 0 : -45}
                  textAnchor={timeRange === '1hour' ? 'middle' : 'end'}
                  height={60}
                />
                <YAxis label={{ value: 'Asymmetry', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="asymmetry" stroke="#f97316" name="Gait Asymmetry" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${asymmetryScore < 2 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
          <h4 className={`font-semibold ${asymmetryScore < 2 ? 'text-green-800' : 'text-yellow-800'} mb-2`}>
            Gait Analysis
          </h4>
          <p className="text-gray-700">
            {asymmetryScore < 2
              ? 'Your gait is well-balanced. Continue maintaining even weight distribution.'
              : 'Consider focusing on distributing weight more evenly between both crutches.'}
          </p>
        </div>
      </div>
    );
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Smart Crutch Setup</h1>
            <p className="text-gray-600 mb-6">
              Connect your Smart Crutch to Arduino Cloud to start tracking your recovery.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arduino Cloud Client ID
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Client ID"
                  value={arduinoConfig.clientId}
                  onChange={(e) => setArduinoConfig({...arduinoConfig, clientId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arduino Cloud Client Secret
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Client Secret"
                  value={arduinoConfig.clientSecret}
                  onChange={(e) => setArduinoConfig({...arduinoConfig, clientSecret: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thing ID
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Thing ID"
                  value={arduinoConfig.thingId}
                  onChange={(e) => setArduinoConfig({...arduinoConfig, thingId: e.target.value})}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This demo uses simulated time-series data matching Arduino Cloud's response format.
                </p>
              </div>

              <button
                onClick={connectToArduinoCloud}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Connect to Arduino Cloud
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Smart Crutch Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time recovery monitoring and analytics</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('weight-bearing')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'weight-bearing'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Weight Bearing
          </button>
          <button
            onClick={() => setActiveTab('step-count')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'step-count'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Steps & Distance
          </button>
          <button
            onClick={() => setActiveTab('asymmetry')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'asymmetry'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Gait Asymmetry
          </button>
        </div>

        {activeTab === 'weight-bearing' && <WeightBearingDashboard />}
        {activeTab === 'step-count' && <StepCountDashboard />}
        {activeTab === 'asymmetry' && <AsymmetryDashboard />}
      </div>
    </div>
  );
};

export default SmartCrutchDashboard;
