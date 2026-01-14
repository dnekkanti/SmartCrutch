import React, { useState, useEffect } from 'react';
import { ArduinoIoTCloud } from 'arduino-iot-js';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Scale } from 'lucide-react';
import './App.css';

const SmartCrutchDashboard = () => {
  const [activeTab, setActiveTab] = useState('weight-bearing');
  const [arduinoConfig, setArduinoConfig] = useState({
    clientId: '',
    clientSecret: '',
    deviceId: '',
    thingId: '',
    accessToken: '',
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [crutchData, setCrutchData] = useState({
    leftForce: 0,
    rightForce: 0,
    stepCount: 0,
    distance: 0,
    leftAccel: { x: 0, y: 0, z: 0 },
    rightAccel: { x: 0, y: 0, z: 0 }
  });
  const TIME_RANGES = [
  { value: '1hour', label: 'Last Hour' },
  { value: '1day', label: '1 Day' },
  { value: '2day', label: '2 Days' },
  { value: '7day', label: '7 Days' },
  { value: '1month', label: '1 Month' }
];
  const [historicalData, setHistoricalData] = useState([]);
  const [weightBearingStatus, setWeightBearingStatus] = useState('Non-Weight Bearing');
  const [userProfile] = useState({
    weight: 70,
    height: 170,
    targetLoad: 25
  });

  const connectToArduinoCloud = async () => {
    if (!arduinoConfig.clientId || !arduinoConfig.clientSecret) {
      alert('Please enter Arduino Cloud credentials');
      return;
    }

    setIsConfigured(true);
    alert('Connected to Arduino Cloud! (Simulation Mode)');
    startDataSimulation();
  };

  const startDataSimulation = () => {
    // 1. DEFINITION
    const connectToRealArduinoCloud = async () => {
      try {
        const payload = {
           grant_type: "client_credentials",
           client_id: "BaAMuRoqV6l0lVVLswWHZ4T9aJjQooMN",
           client_secret: "80q4xwDYfcBuG7mQZcn1Gv9Dkrah1thPWlj5NNK4zbMwuk0rxVxSihROyTDIcHoC",
           audience: "https://api2.arduino.cc/iot"
        };

        const tokenResponse = await fetch('/iot/v1/clients/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await tokenResponse.json();
        setArduinoConfig({...arduinoConfig, accessToken: data.access_token})
        console.log(data)
        console.log("access_token", data.access_token)

        const left_force_thing_id = '107cc007-7572-4866-9668-142c1c355501';
        const right_force_thing_id = '82f2869e-dd4b-4514-b288-946d5cb7ac77';
        const response = await fetch(`/iot/v2/things/${left_force_thing_id}/properties`, {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        const properties = await response.json();
        console.log("Thing Properties:", properties);
      } catch (error) {
        console.error("Error:", error);
      }

      };

    // 2. EXECUTION
    connectToRealArduinoCloud();
  };

  // const startDataSimulation = () => {
  //   alert("I am running here!");
  //   const connectToRealArduinoCloud = async () => {
  //     // 1. Get OAuth token
  //
  //     const payload = {
  //         grant_type: "client_credentials",
  //         client_id: "BaAMuRoqV6l0lVVLswWHZ4T9aJjQooMN",
  //         client_secret: "80q4xwDYfcBuG7mQZcn1Gv9Dkrah1thPWlj5NNK4zbMwuk0rxVxSihROyTDIcHoC",
  //         audience: "https://api2.arduino.cc/iot"
  //     };
  //
  //     const tokenResponse = await fetch('https://api2.arduino.cc/iot/v1/clients/token', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     });
  //     console.log('tokenResponse', tokenResponse);
  //     alert("I am running!");
  //
  //   const { access_token } = await tokenResponse.json();
  //
  //   // 2. Fetch data from Arduino Cloud every 2 seconds
  //   setInterval(async () => {
  //     const response = await fetch(`https://api2.arduino.cc/iot/v2/things`, {
  //       headers: {
  //         'Authorization': `Bearer ${access_token}`
  //       }
  //     });
  //
  //     const properties = await response.json();
  //
  //
  //
  //     const left_force_thing_id = '107cc007-7572-4866-9668-142c1c355501';
  //     const right_force_thing_id = '82f2869e-dd4b-4514-b288-946d5cb7ac77';
  //
  //     console.log('ALL PROPERTIES FROM ARDUINO CLOUD:', properties);
  //     console.log('Number of properties:', properties.length);
  //
  //     console.log('Fetching data from Thing ID:', arduinoConfig.left_force_thing_id)
  //     console.log('Fetching data from Thing ID:', arduinoConfig.right_force_thing_id)
  //
  //
  //
  //     // 3. Map Arduino Cloud properties to your data structure
  //     const newData = {
  //       leftForce: properties.find(p => p.name === 'Left-Force')?.last_value || 0,
  //       rightForce: properties.find(p => p.name === 'Right-Force')?.last_value || 0,
  //       stepCount: properties.find(p => p.name === 'stepCount')?.last_value || 0,
  //       distance: properties.find(p => p.name === 'distance')?.last_value || 0,
  //       leftAccel: {
  //         x: properties.find(p => p.name === 'leftAccelX')?.last_value || 0,
  //         y: properties.find(p => p.name === 'leftAccelY')?.last_value || 0,
  //         z: properties.find(p => p.name === 'leftAccelZ')?.last_value || 0
  //       },
  //       rightAccel: {
  //         x: properties.find(p => p.name === 'rightAccelX')?.last_value || 0,
  //         y: properties.find(p => p.name === 'rightAccelY')?.last_value || 0,
  //         z: properties.find(p => p.name === 'rightAccelZ')?.last_value || 0
  //       }
  //     };
  //
  //     setCrutchData(newData);
  //   }, 2000);
  // };
  //   // setInterval(() => {
  //   //   const newData = {
  //   //     leftForce: Math.random() * 50 + 10,
  //   //     rightForce: Math.random() * 50 + 10,
  //   //     stepCount: Math.floor(Math.random() * 100) + 500,
  //   //     distance: (Math.random() * 2 + 1).toFixed(2),
  //   //     leftAccel: {
  //   //       x: (Math.random() * 2 - 1).toFixed(2),
  //   //       y: (Math.random() * 2 - 1).toFixed(2),
  //   //       z: (Math.random() * 10 + 8).toFixed(2)
  //   //     },
  //   //     rightAccel: {
  //   //       x: (Math.random() * 2 - 1).toFixed(2),
  //   //       y: (Math.random() * 2 - 1).toFixed(2),
  //   //       z: (Math.random() * 10 + 8).toFixed(2)
  //   //     }
  //   //   };
  //   //
  //   //   setCrutchData(newData);
  //   //
  //   //   setHistoricalData(prev => {
  //   //     const newEntry = {
  //   //       time: new Date().toLocaleTimeString(),
  //   //       leftForce: newData.leftForce,
  //   //       rightForce: newData.rightForce,
  //   //       steps: newData.stepCount,
  //   //       asymmetry: Math.abs(parseFloat(newData.leftAccel.z) - parseFloat(newData.rightAccel.z))
  //   //     };
  //   //     return [...prev.slice(-20), newEntry];
  //   //   });
  //   //
  //   //   const totalForce = newData.leftForce + newData.rightForce;
  //   //   const percentBodyWeight = (totalForce / (userProfile.weight * 9.81)) * 100;
  //   //
  //   //   if (percentBodyWeight < 5) {
  //   //     setWeightBearingStatus('Non-Weight Bearing (NWB)');
  //   //   } else if (percentBodyWeight < 25) {
  //   //     setWeightBearingStatus('Touch-Down Weight Bearing (TDWB)');
  //   //   } else if (percentBodyWeight < 50) {
  //   //     setWeightBearingStatus('Partial Weight Bearing (PWB)');
  //   //   } else if (percentBodyWeight < 75) {
  //   //     setWeightBearingStatus('Weight Bearing As Tolerated (WBAT)');
  //   //   } else {
  //   //     setWeightBearingStatus('Full Weight Bearing (FWB)');
  //   //   }
  //   // }, 2000);
  // };

  const WeightBearingDashboard = () => {
    const totalForce = crutchData.leftForce + crutchData.rightForce;
    const leftPercent = totalForce > 0 ? ((crutchData.leftForce / totalForce) * 100).toFixed(1) : 0;
    const rightPercent = totalForce > 0 ? ((crutchData.rightForce / totalForce) * 100).toFixed(1) : 0;
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
              <p className="text-4xl font-bold text-blue-600">{crutchData.leftForce.toFixed(1)} N</p>
              <p className="text-gray-600 mt-2">{leftPercent}% of load</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-2 border-green-200">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Right Crutch</h4>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{crutchData.rightForce.toFixed(1)} N</p>
              <p className="text-gray-600 mt-2">{rightPercent}% of load</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-lg font-semibold mb-4">Force Distribution Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Force (N)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leftForce" stroke="#3b82f6" name="Left Crutch" />
              <Line type="monotone" dataKey="rightForce" stroke="#10b981" name="Right Crutch" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const StepCountDashboard = () => {
    const dailyGoal = 1000;
    const goalProgress = ((crutchData.stepCount / dailyGoal) * 100).toFixed(0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Steps Today</p>
                <p className="text-4xl font-bold mt-2">{crutchData.stepCount}</p>
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
                <p className="text-4xl font-bold mt-2">{crutchData.distance}</p>
                <p className="text-sm mt-2">kilometers</p>
              </div>
              <TrendingUp size={48} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-lg font-semibold mb-4">Daily Activity Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="steps" fill="#a855f7" name="Step Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Today's Progress</h4>
          <p className="text-gray-700">
            You've completed {goalProgress}% of your daily goal.
            {goalProgress >= 100 ? ' Excellent work!' : ` Keep going - ${dailyGoal - crutchData.stepCount} steps to go!`}
          </p>
        </div>
      </div>
    );
  };

  const AsymmetryDashboard = () => {
    const asymmetryScore = Math.abs(parseFloat(crutchData.leftAccel.z) - parseFloat(crutchData.rightAccel.z)).toFixed(2);

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
                <span className="text-gray-600">X-axis:</span>
                <span className="font-semibold">{crutchData.leftAccel.x} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Y-axis:</span>
                <span className="font-semibold">{crutchData.leftAccel.y} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Z-axis:</span>
                <span className="font-semibold">{crutchData.leftAccel.z} m/s²</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Right Crutch IMU</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">X-axis:</span>
                <span className="font-semibold">{crutchData.rightAccel.x} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Y-axis:</span>
                <span className="font-semibold">{crutchData.rightAccel.y} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Z-axis:</span>
                <span className="font-semibold">{crutchData.rightAccel.z} m/s²</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <h4 className="text-lg font-semibold mb-4">Asymmetry Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Asymmetry', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="asymmetry" stroke="#f97316" name="Gait Asymmetry" />
            </LineChart>
          </ResponsiveContainer>
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
                  Device ID (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Device ID"
                  value={arduinoConfig.deviceId}
                  onChange={(e) => setArduinoConfig({...arduinoConfig, deviceId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thing ID (Optional)
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
                  <strong>Note:</strong> This demo uses simulated data. In production, enter your actual
                  Arduino Cloud credentials to connect to your Smart Crutch devices.
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


        // const response = await fetch(`/iot/v2/things/${left_force_thing_id}/properties`, {
        //   headers: {
        //     'Authorization': `Bearer ${data.access_token}`,
        //     'Content-Type': 'application/json'
        //   }
        // });
        // const properties = await response.json();
        // console.log("Thing Properties:", properties);
