import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Activity, TrendingUp, Scale, Clock, FileText, Download } from 'lucide-react';

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
  const [isExporting, setIsExporting] = useState(false);
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
    targetLoad: 25,
    patientName: 'John Doe',
    patientId: 'PT-2026-001',
    injuryDate: '2026-01-01',
    diagnosis: 'Post-operative tibial fracture repair',
    age: 45,
    gender: 'Male',
    surgeon: 'Dr. Sarah Johnson',
    physicalTherapist: 'Dr. Michael Chen, PT',
    treatmentPlan: {
      phase1: {
        weeks: '1-2',
        weightBearing: 'Non-Weight Bearing (NWB)',
        targetLoad: '0%',
        dailySteps: '0-100',
        notes: 'Complete rest, crutch mobility only for essential movement'
      },
      phase2: {
        weeks: '3-4',
        weightBearing: 'Touch-Down Weight Bearing (TDWB)',
        targetLoad: '10-15%',
        dailySteps: '100-300',
        notes: 'Light touch for balance, gradually increase tolerance'
      },
      phase3: {
        weeks: '5-6',
        weightBearing: 'Partial Weight Bearing (PWB)',
        targetLoad: '25-50%',
        dailySteps: '300-800',
        notes: 'Progressive loading with physical therapy exercises'
      },
      phase4: {
        weeks: '7-8',
        weightBearing: 'Weight Bearing As Tolerated (WBAT)',
        targetLoad: '50-75%',
        dailySteps: '800-1500',
        notes: 'Increase activity as comfort allows, begin strength training'
      },
      phase5: {
        weeks: '9-12',
        weightBearing: 'Full Weight Bearing (FWB)',
        targetLoad: '75-100%',
        dailySteps: '1500+',
        notes: 'Transition to normal gait, continue strengthening exercises'
      }
    },
    currentPhase: 'phase3'
  });
  const forceChartRef = useRef(null);
  const stepChartRef = useRef(null);
  const asymmetryChartRef = useRef(null);
  const [from_time, setFromTime] = useState("2026-01-13T17:00:00.000+00:00");
  const [to_time, setToTime] = useState("2026-01-14T17:00:00.000+00:00");
  const TIME_RANGES = [
    { value: '2min', label: 'Last 2 Min'},
    { value: '1hour', label: 'Last Hour' },
    { value: '1day', label: '1 Day' },
    { value: '2day', label: '2 Days' },
    { value: '7day', label: '7 Days' },
    { value: '1month', label: '1 Month' }
  ];

  const CLOUD_IDS = {
    left: {
      thing: '82f2869e-dd4b-4514-b288-946d5cb7ac77',
      // adc: '6a9e22d4-09a7-4720-93b8-40bdbd6787dd',
      // device_id: '3a727d88-f793-489d-988f-ba402c9d891d',
      force: 'a7c0b15b-19b5-4b16-8993-092321893f80',
      // force_filtered: '9bcd6de7-756d-4000-888b-4d43476a8bc9',
      // force_unfiltered: '360947b9-6fc9-4ce3-93d7-8eebf52519b2',
      // fsr_status: '118b68cf-13fd-4617-8ad7-1bf73e948855',
      // imu_stability: '900dc51d-3b13-48fb-9063-fd14632c9be5',
      // imu_step_count: '',
      is_walking: '14127d8f-fedd-4e48-9e94-3c1a70926f9d',
      left_step_time: 'bb9b1169-a517-4fc2-8e42-2b18130d6612',
      // packet: 'f329a9c3-a415-4e49-8d26-f47361a02026',
      // timestamp: 'cef9f179-95a7-4c8e-99bd-c2c6f10bb398',
      // voltage: '8f3a18fa-ae2b-4b73-bb91-a87ad90e5a22'
    },
    right: {
      thing: '107cc007-7572-4866-9668-142c1c355501',
      // adc: '65a2e97c-e8c6-48c4-b713-a4a5fd5af262',
      // device_id: 'b77b12f9-4039-4caf-ae29-370b7d7069f7',
      force: 'cef95317-e4ed-45be-aa03-da929df06f38',
      // force_filtered: '889aa2e1-8ec7-4a1f-b5eb-23fd1a99ea24',
      // force_unfiltered: '663b6782-60f3-47ed-9d94-a2bcb115f902',
      // fsr_status: '2be93782-ff66-46da-9ca4-173821705da9',
      // imu_stability: '5cbcac10-9f8d-4c67-bda2-8794f64f0845',
      imu_step_count: '9353a461-6485-45ec-beec-294271e7a91d',
      is_walking: '86cdf022-eb9f-4b62-bc17-d0a3a6bf5b11',
      right_step_time: '45746a99-3f8f-4c4a-87b9-d196e4d8867e',
      // packet: 'bee84019-2329-4f02-aa1e-52074dd17e32',
      // session_id: '20467d5a-4a76-4c4a-ac3a-685473255d16',
      // timestamp: '16f7c644-3185-4f35-84bd-aad362e722b9',
      // voltage: ''
    }
  };

  const makeBatchDataRequest = async (token) => {
    try {
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
              to: to_time,
              interval: 1
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
          'Authorization': `Bearer ${token}`,
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
        const calculateTodaySteps = (stepCountData) => {
        // 1. Get today's date string in local time (e.g., "2026-01-14")
          const today = new Date().toISOString().split('T')[0];

          // 2. Use reduce to iterate through the lists
          const totalSteps = stepCountData.times.reduce((accumulator, timeString, index) => {
            // Convert the sensor time string to a date string for comparison
            const recordDate = new Date(timeString).toISOString().split('T')[0];
            // 3. If the dates match, add the value at the current index to our sum
            if (recordDate === today) {
              return accumulator + stepCountData.values[index];
            }
            return accumulator;
          }, 0);
            return totalSteps;
        };
        const todayStepTotal = calculateTodaySteps(stepCountData);

        setLatestValues({
          leftForce: latestLeft,
          rightForce: latestRight,
          stepCount: todayStepTotal,
          distance: todayStepTotal * 0.000621371 * 0.5, //average crutch length
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
    } catch (error) {
      console.error("Error:", error);
    };
  };

const generateMockArduinoData = (range) => {
    // Increase data points: 1 hour = 3600 points (1 per second)
    // Adjusting these numbers based on your performance needs
    const numPoints = range === '1hour' ? 3600 : range === '1day' ? 1440 : range === '2min' ? 30 : 2000;
    const now = new Date();

    const generateTimeSeries = (type, baseValue, variance, isRightCrutch = false) => {
      const times = [];
      const values = [];
      let runningStepCount = 0;

      for (let i = 0; i <= numPoints; i++) {
        // 1. Calculate Time (1-second intervals for '1hour' range)
        const timeInterval = range === '1hour' ? 1000 : 60000;
        const time = new Date(now - (numPoints - i) * timeInterval);
        times.push(time.toISOString());

        // 2. Recovery Logic: Asymmetry improves over time
        // progress goes from 0 to 1 as we move through the array
        const progress = i / numPoints;

        if (type === 'cadence') {
          // Walking cadence: peaks every ~2 seconds (Math.PI / 1)
          const sineWave = Math.max(0, Math.sin(i * 1.5));
          const noise = (Math.random() * variance) - (variance / 2);

          // Asymmetry Logic:
          // Early on (progress 0), Right is much heavier than Left.
          // Later (progress 1), they become nearly equal.
          let asymmetryOffset = isRightCrutch ? (5 * (1 - progress)) : 0;

          const val = (sineWave * (baseValue + asymmetryOffset)) + noise;
          values.push(Number(Math.max(0, val).toFixed(2)));

        } else if (type === 'linear') {
          // Steps: Increment every time the sine wave would have peaked
          // Approximately 1 step every 2 iterations based on the 1.5 multiplier above
          if (i % 2 === 0) {
            runningStepCount += 1;
          }
          values.push(runningStepCount);
        }
      }

      return { times, values };
    };

    // Pre-calculate steps to ensure distance and stepCount are perfectly synced
    const stepData = generateTimeSeries('linear', 0, 0);

    return {
      resp_version: 1,
      responses: [
        {
          property_id: "left-force-id",
          property_name: "leftForce",
          property_type: "FLOAT",
          ...generateTimeSeries('cadence', 20, 3, false)
        },
        {
          property_id: "right-force-id",
          property_name: "rightForce",
          property_type: "FLOAT",
          ...generateTimeSeries('cadence', 20, 3, true) // Right starts with +5kg offset
        },
        {
          property_id: "step-count-id",
          property_name: "stepCount",
          property_type: "INT",
          ...stepData
        },
        {
          property_id: "distance-id",
          property_name: "distance",
          property_type: "FLOAT",
          times: stepData.times,
          values: stepData.values.map(s => Number((s * 0.45 * 0.000621371).toFixed(2)))
        },
        {
          property_id: "left-accel-z-id",
          property_name: "leftAccelZ",
          property_type: "FLOAT",
          // Base acceleration (9.81 m/s² for gravity) with standard walking cadence
          ...generateTimeSeries('cadence', 9.81, 2, false)
        },
        {
          property_id: "right-accel-z-id",
          property_name: "rightAccelZ",
          property_type: "FLOAT",
          // Starts with higher impact/vibration (base 12.0)
          // and improves over time to meet the left side's 9.81
          ...generateTimeSeries('cadence', 9.81, 2, true)
        }
      ]
    };
};

  const calculateStatistics = () => {
    const forceData = chartData.force;
    const stepData = chartData.steps;
    const asymmetryData = chartData.asymmetry;

    const calculateStats = (data, key) => {
      if (!data || data.length === 0) return { avg: 0, max: 0, min: 0 };
      const values = data.map(d => d[key]).filter(v => v != null);
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values)
      };
    };

    return {
      leftForce: calculateStats(forceData, 'leftForce'),
      rightForce: calculateStats(forceData, 'rightForce'),
      steps: calculateStats(stepData, 'steps'),
      asymmetry: calculateStats(asymmetryData, 'asymmetry'),
      totalDataPoints: forceData.length,
      adherenceScore: calculateAdherence()
    };
  };

  const calculateAdherence = () => {
    // Calculate adherence based on target load
    const totalForce = latestValues.leftForce + latestValues.rightForce;
    const percentBodyWeight = (totalForce / (userProfile.weight * 9.81)) * 100;
    const targetPercent = userProfile.targetLoad;
    const deviation = Math.abs(percentBodyWeight - targetPercent);

    if (deviation < 5) return 'Excellent';
    if (deviation < 10) return 'Good';
    if (deviation < 20) return 'Fair';
    return 'Needs Improvement';
  };

  const exportClinicalReport = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('CLINICAL RECOVERY REPORT', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('Smart Crutch Monitoring System', pageWidth / 2, 30, { align: 'center' });

      // Patient Information
      yPosition = 50;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Patient Information', 15, yPosition);

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Patient Name: ${userProfile.patientName}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Patient ID: ${userProfile.patientId}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Diagnosis: ${userProfile.diagnosis}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Injury Date: ${userProfile.injuryDate}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Report Generated: ${new Date().toLocaleDateString()}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Analysis Period: ${TIME_RANGES.find(r => r.value === timeRange)?.label}`, 15, yPosition);

      // Clinical Metrics Section
      yPosition += 12;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Clinical Metrics', 15, yPosition);

      const stats = calculateStatistics();
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      // Weight Bearing Status
      pdf.setFont(undefined, 'bold');
      pdf.text('Current Weight Bearing Status:', 15, yPosition);
      pdf.setFont(undefined, 'normal');
      pdf.text(weightBearingStatus, 80, yPosition);

      yPosition += 6;
      const totalForce = latestValues.leftForce + latestValues.rightForce;
      const bodyWeightPercent = ((totalForce / (userProfile.weight * 9.81)) * 100).toFixed(1);
      pdf.text(`Current Load: ${bodyWeightPercent}% of body weight`, 15, yPosition);

      yPosition += 6;
      pdf.text(`Target Load: ${userProfile.targetLoad}% of body weight`, 15, yPosition);

      yPosition += 6;
      pdf.setFont(undefined, 'bold');
      pdf.text('Adherence Rating:', 15, yPosition);
      pdf.setFont(undefined, 'normal');
      const adherence = stats.adherenceScore;
      pdf.setTextColor(adherence === 'Excellent' || adherence === 'Good' ? 0 : 200,
                        adherence === 'Excellent' ? 128 : adherence === 'Good' ? 100 : 0, 0);
      pdf.text(adherence, 80, yPosition);
      pdf.setTextColor(0, 0, 0);

      // Force Distribution
      yPosition += 10;
      pdf.setFont(undefined, 'bold');
      pdf.text('Force Distribution Analysis:', 15, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      pdf.text(`Left Crutch - Avg: ${stats.leftForce.avg.toFixed(1)}N, Max: ${stats.leftForce.max.toFixed(1)}N, Min: ${stats.leftForce.min.toFixed(1)}N`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Right Crutch - Avg: ${stats.rightForce.avg.toFixed(1)}N, Max: ${stats.rightForce.max.toFixed(1)}N, Min: ${stats.rightForce.min.toFixed(1)}N`, 15, yPosition);

      const leftPercent = totalForce > 0 ? ((latestValues.leftForce / totalForce) * 100).toFixed(1) : 0;
      const rightPercent = totalForce > 0 ? ((latestValues.rightForce / totalForce) * 100).toFixed(1) : 0;
      yPosition += 6;
      pdf.text(`Load Distribution: Left ${leftPercent}% / Right ${rightPercent}%`, 15, yPosition);

      // Activity Metrics
      yPosition += 10;
      pdf.setFont(undefined, 'bold');
      pdf.text('Activity Metrics:', 15, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      pdf.text(`Total Steps (Current): ${Math.round(latestValues.stepCount)}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Average Steps: ${Math.round(stats.steps.avg)}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Distance Covered: ${latestValues.distance.toFixed(2)} km`, 15, yPosition);

      // Gait Asymmetry
      yPosition += 10;
      pdf.setFont(undefined, 'bold');
      pdf.text('Gait Asymmetry Analysis:', 15, yPosition);
      yPosition += 6;
      pdf.setFont(undefined, 'normal');
      const currentAsymmetry = Math.abs(latestValues.leftAccelZ - latestValues.rightAccelZ).toFixed(2);
      pdf.text(`Current Asymmetry Score: ${currentAsymmetry}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Average Asymmetry: ${stats.asymmetry.avg.toFixed(2)}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Assessment: ${parseFloat(currentAsymmetry) < 2 ? 'Well-balanced gait pattern' : 'Gait imbalance detected - recommend PT evaluation'}`, 15, yPosition);

      // Clinical Recommendations
      yPosition += 12;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Clinical Recommendations', 15, yPosition);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      const recommendations = [];
      if (parseFloat(bodyWeightPercent) < userProfile.targetLoad - 10) {
        recommendations.push('• Patient is under-loading. Consider progressive weight-bearing exercises.');
      } else if (parseFloat(bodyWeightPercent) > userProfile.targetLoad + 10) {
        recommendations.push('• Patient is over-loading. Reinforce weight-bearing restrictions.');
      } else {
        recommendations.push('• Patient is maintaining appropriate weight-bearing levels.');
      }

      if (parseFloat(currentAsymmetry) > 2) {
        recommendations.push('• Significant gait asymmetry detected. Recommend gait training and strengthening exercises.');
      }

      if (Math.abs(parseFloat(leftPercent) - parseFloat(rightPercent)) > 15) {
        recommendations.push('• Uneven crutch usage detected. Educate patient on bilateral weight distribution.');
      }

      if (latestValues.stepCount < 500) {
        recommendations.push('• Low activity level. Encourage increased ambulatory activity within restrictions.');
      }

      recommendations.forEach(rec => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(rec, 15, yPosition);
        yPosition += 6;
      });

      // Add charts if there's space, otherwise new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      } else {
        yPosition += 10;
      }

      // Capture and add charts
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Data Visualizations', 15, yPosition);
      yPosition += 10;

      // Force Chart
      if (forceChartRef.current) {
        const canvas = await html2canvas(forceChartRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight > pageHeight - 10) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }

      // Footer
      const footerY = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('This report is generated by the Smart Crutch Monitoring System for clinical use only.', pageWidth / 2, footerY, { align: 'center' });
      pdf.text(`Page 1 | Generated: ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 4, { align: 'center' });

      // Save PDF
      const fileName = `Smart_Crutch_Clinical_Report_${userProfile.patientId}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      alert('Clinical report exported successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const connectToRealArduinoCloud = async () => {
    try {
      const access_payload = {
         grant_type: "client_credentials",
         client_id: "",
         client_secret: "",
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
      setArduinoConfig({...arduinoConfig, accessToken: access_data.access_token});
      console.log(access_data);
      console.log("access_token", access_data.access_token);
      return access_data.access_token;
    }
    catch (error) {
      console.error("Error:", error);
    };
  };

  const startDataSimulation = async () => {
    // 1. DEFINITION
    // 2. EXECUTION
    const token = await connectToRealArduinoCloud();
    // const mockData = generateMockArduinoData('1day');
    // processArduinoData(mockData);
    makeBatchDataRequest(token);
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
    const getQueryTimestamps = (rangeValue) => {
      const toTime = new Date().toISOString().replace('Z', '+00:00');
      let fromTime = new Date();

      switch (rangeValue) {
        case '1hour':
          fromTime.setHours(fromTime.getHours() - 1);
          break;
        case '1day':
          fromTime.setDate(fromTime.getDate() - 1);
          break;
        case '2day':
          fromTime.setDate(fromTime.getDate() - 2);
          break;
        case '7day':
          fromTime.setDate(fromTime.getDate() - 7);
          break;
        case '1month':
          fromTime.setMonth(fromTime.getMonth() - 1);
          break;
        default:
          fromTime.setDate(fromTime.getDate() - 1);
      };

      setFromTime(fromTime.toISOString().replace('Z', '+00:00'));
      setToTime(toTime);
      console.log(fromTime, toTime, 'TIMES');
    };
    getQueryTimestamps(range);
    // Simulate API call - replace with actual Arduino Cloud API
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
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

  const processArduinoData = (data) => {
    const responses = data.responses;

    // Extract data by property name
    const getProperty = (name) => responses.find(r => r.property_name === name);

    const leftForceData = getProperty('leftForce');
    const rightForceData = getProperty('rightForce');
    const stepCountData = getProperty('stepCount');
    const distanceData = getProperty('distance');
    const leftAccelZData = getProperty('leftAccelZ');
    const rightAccelZData = getProperty('rightAccelZ');

    // Update latest values
    if (leftForceData && rightForceData) {
      const latestLeft = leftForceData.values[leftForceData.values.length - 1] || 0;
      const latestRight = rightForceData.values[rightForceData.values.length - 1] || 0;

      setLatestValues({
        leftForce: latestLeft,
        rightForce: latestRight,
        stepCount: stepCountData?.values[stepCountData.values.length - 1] || 0,
        distance: distanceData?.values[distanceData.values.length - 1] || 0,
        leftAccelZ: leftAccelZData?.values[leftAccelZData.values.length - 1] || 0,
        rightAccelZ: rightAccelZData?.values[rightAccelZData.values.length - 1] || 0
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

    if (leftAccelZData && rightAccelZData) {
      for (let i = 0; i < leftAccelZData.times.length; i++) {
        const time = new Date(leftAccelZData.times[i]);
        asymmetryChartData.push({
          time: formatTime(time, timeRange),
          fullTime: time.toISOString(),
          asymmetry: Math.abs((leftAccelZData.values[i] || 0) - (rightAccelZData.values[i] || 0))
        });
      }
    }

    setChartData({
      force: forceChartData,
      steps: stepChartData,
      asymmetry: asymmetryChartData
    });
  };

  const handleTimeRangeChange = async (range) => {
    setTimeRange(range);
    fetchArduinoData(range);
    const token = await connectToRealArduinoCloud();
    // const mockData = generateMockArduinoData(range);
    // processArduinoData(mockData);
    makeBatchDataRequest(token);
  };

  const TimeRangeSelector = () => {
    return (
      <div className="flex items-center space-x-3 mb-6 flex-wrap gap-y-3">
        <div className="flex items-center space-x-2 text-slate-700 mr-2">
          <Clock size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Time Range</span>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          {TIME_RANGES.map((range) => {
            const isActive = timeRange === range.value;

            return (
              <button
                key={range.value}
                onClick={() => handleTimeRangeChange(range.value)}
                className={`
                  px-4 py-2 rounded-md text-sm font-bold transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 shadow-md' // Deep blue with white text won't vanish
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }
                `}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };


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
              <p className="text-4xl font-bold text-blue-600">{latestValues.leftForce.toFixed(2)} N</p>
              <p className="text-gray-600 mt-2">{leftPercent}% of load</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-2 border-green-200">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Right Crutch</h4>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{latestValues.rightForce.toFixed(2)} N</p>
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
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  height={36} // This reserves 36px of space so it doesn't overlap the X-axis
                  wrapperStyle={{
                    paddingTop: "20px" // Manually pushes the legend text further down
                  }}
                />
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
    console.log("latest values", latestValues)
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
                <p className="text-4xl font-bold mt-2">{latestValues.distance.toFixed(2)}</p>
                <p className="text-sm mt-2">miles</p>
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

  const TreatmentPlanDashboard = () => {
    const currentPhaseData = userProfile.treatmentPlan[userProfile.currentPhase];
    const allPhases = Object.keys(userProfile.treatmentPlan).map(key => ({
      key,
      ...userProfile.treatmentPlan[key]
    }));

    return (
      <div className="space-y-6">
        {/* Patient Profile Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-gray-700">
          <h3 className="text-2xl font-bold text-gray-700 mb-4">Patient Profile</h3>
          <div className="grid grid-cols-2 text-gray-700 gap-4">
            <div>
              <p className="text-sm text-gray-700">Patient Name</p>
              <p className="text-lg text-gray-700 font-semibold">{userProfile.patientName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Patient ID</p>
              <p className="text-lg text-gray-700 font-semibold">{userProfile.patientId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Age / Gender</p>
              <p className="text-lg text-gray-700 font-semibold">{userProfile.age} / {userProfile.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Weight / Height</p>
              <p className="text-lg text-gray-700 font-semibold">{userProfile.weight} kg / {userProfile.height} cm</p>
            </div>
          </div>
        </div>

        {/* Injury & Medical Team */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Injury Details</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Diagnosis</p>
                <p className="font-semibold text-gray-800">{userProfile.diagnosis}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Injury Date</p>
                <p className="font-semibold text-gray-800">{new Date(userProfile.injuryDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Days Since Injury</p>
                <p className="font-semibold text-gray-800">
                  {Math.floor((new Date() - new Date(userProfile.injuryDate)) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Medical Team</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Orthopedic Surgeon</p>
                <p className="font-semibold text-gray-800">{userProfile.surgeon}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Physical Therapist</p>
                <p className="font-semibold text-gray-800">{userProfile.physicalTherapist}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Phase Highlight */}
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900">Current Treatment Phase</h3>
            <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              Weeks {currentPhaseData.weeks}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Weight Bearing Status</p>
              <p className="text-lg font-bold text-blue-900">{currentPhaseData.weightBearing}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Target Load</p>
              <p className="text-lg font-bold text-blue-900">{currentPhaseData.targetLoad} body weight</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Daily Step Goal</p>
              <p className="text-lg font-bold text-blue-900">{currentPhaseData.dailySteps}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Current Progress</p>
              <p className="text-lg font-bold text-blue-900">{Math.round(latestValues.stepCount)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Phase Notes:</p>
            <p className="text-gray-800">{currentPhaseData.notes}</p>
          </div>
        </div>

        {/* Full Treatment Timeline */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Complete Treatment Timeline</h3>
          <div className="space-y-4">
            {allPhases.map((phase, index) => {
              const isCurrent = phase.key === userProfile.currentPhase;
              const isPast = allPhases.findIndex(p => p.key === userProfile.currentPhase) > index;

              return (
                <div
                  key={phase.key}
                  className={`border-l-4 pl-4 py-3 ${
                    isCurrent ? 'border-blue-500 bg-blue-50' :
                    isPast ? 'border-green-500 bg-green-50' :
                    'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        isCurrent ? 'bg-blue-500 text-blue-600' :
                        isPast ? 'bg-green-500 text-blue-600' :
                        'bg-gray-400 text-blue-600'
                      }`}>
                        Weeks {phase.weeks}
                      </span>
                      <h4 className="font-bold text-gray-800"> {phase.weightBearing}</h4>
                      {isCurrent && <span className="text-blue-600 text-sm font-semibold"> ← Current Phase</span>}
                      {isPast && <span className="text-green-600 text-sm font-semibold"> ✓ Completed</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-2 text-sm">
                    <div>
                      <span className="text-gray-600">Target Load: </span>
                      <span className="font-semibold text-gray-800 ml-2">{phase.targetLoad}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Daily Steps: </span>
                      <span className="font-semibold text-gray-800 ml-2">{phase.dailySteps}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">{phase.notes} </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 Next Steps</h4>
          <p className="text-gray-700">
            Continue with your current phase exercises. Your next evaluation is scheduled for Week {parseInt(currentPhaseData.weeks.split('-')[1]) + 1}.
            Maintain consistent daily activity within your prescribed limits and monitor for any pain or discomfort.
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
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  value={arduinoConfig.clientId}
                  onChange={(e) => setArduinoConfig({...arduinoConfig, clientId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  value={arduinoConfig.clientSecret}
                  onChange={(e) => setArduinoConfig({...arduinoConfig, clientSecret: e.target.value})}
                />
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
      {/* Top Right Button */}
  <button
    onClick={exportClinicalReport}
    disabled={isExporting}
    className="flex items-center space-x-2 bg-blue-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 active:bg-blue-100 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
  >
    {isExporting ? (
      <>
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        <span>Exporting...</span>
      </>
    ) : (
      <>
        <FileText size={20} />
        <span>Export Summary for Clinician</span>
      </>
    )}
  </button>
  </div></div>

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
          <button
           onClick={() => setActiveTab('treatment-plan')}
           className={`pb-3 px-4 font-semibold transition-colors ${
             activeTab === 'treatment-plan'
               ? 'border-b-2 border-blue-600 text-blue-600'
               : 'text-gray-600 hover:text-gray-800'
           }`}
         >
           Treatment Plan
         </button>
        </div>

        {activeTab === 'weight-bearing' && <WeightBearingDashboard />}
        {activeTab === 'step-count' && <StepCountDashboard />}
        {activeTab === 'asymmetry' && <AsymmetryDashboard />}
        {activeTab === 'treatment-plan' && <TreatmentPlanDashboard />}
      </div>
    </div>
  );
};

export default SmartCrutchDashboard;
