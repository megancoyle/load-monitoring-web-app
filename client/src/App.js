import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Chart } from "./Chart.js";
import { BarChart } from "./BarChart.js";
import "./App.css";

function App() {
  const TIME_WINDOW = 12; // window of time for high/recovering CPU load
  const REFRESH_INTERVAL = 10000; // refreshes every 10 seconds
  const HISTORY_LIMIT = 600; // limits history to 10 minutes
  const CPU_LOAD_MAX = 1; // if CPU is over this number, we track it as high load

  // setup ChartJS charts
  const [chartData, setChartData] = useState({});
  const [barChartData, setBarChartData] = useState({});
  // keeping track of high/recovered average CPU history
  const [highAverageLoad, setHighAverageLoad] = useState([]);
  const [recoveredAverageLoad, setRecoveredAverageLoad] = useState([]);
  // tracks history of CPU load
  const [cpuLoadArray, setCpuLoadArray] = useState([]);
  // for formatting the chart time label
  const [timeArray, setTimeArray] = useState([]);
  const countRef = useRef(0);
  const tallyHighLoad = useRef(0);
  const tallyRecoveredLoad = useRef(0);
  const previousHighLoad = useRef(false);

  const fetchAndTrackData = async () => {
    const response = await fetch("/api");
    const json = await response.json();
    setCpuLoadArray(cpuLoadArray => [...cpuLoadArray, json.loadAverage]);

    // Keep track of the last few high loads/recover loads with tallies
    if (json.loadAverage > CPU_LOAD_MAX) {
      tallyHighLoad.current++;
      tallyRecoveredLoad.current = 0;
    } else {
      tallyHighLoad.current = 0;
    }

    // Recover tallies only increase if previous high load lasted two minutes
    // and there hasn't been a recent high load triggered
    if (previousHighLoad.current === true && tallyHighLoad.current === 0) {
      tallyRecoveredLoad.current++;
    }

    // Keep track of high load/recovered high loads in arrays
    if (tallyHighLoad.current >= TIME_WINDOW) {
      setHighAverageLoad(highAverageLoad => [...highAverageLoad, json.loadAverage]);
      setRecoveredAverageLoad(recoveredAverageLoad => [...recoveredAverageLoad, 0]);
      previousHighLoad.current = true;
    } else {
      setHighAverageLoad(highAverageLoad => [...highAverageLoad, 0]);
      previousHighLoad.current = false;
      setRecoveredAverageLoad(recoveredAverageLoad => [...recoveredAverageLoad, 0]);
    }
    if (tallyRecoveredLoad.current >= TIME_WINDOW) {
      setRecoveredAverageLoad(recoveredAverageLoad => [...recoveredAverageLoad, json.loadAverage])
    }

    // Trigger toast messages if high load/recovered load has lasted more than two minutes
    if (tallyHighLoad.current === TIME_WINDOW) {
      toast.error('High CPU Load');
    }

    if (tallyRecoveredLoad.current === TIME_WINDOW) {
      toast.success('CPU Load Recovered');
    }
  }

  useEffect(() => {
    // initial data load
    fetchAndTrackData();
    setTimeArray(timeArray => [...timeArray, `${countRef.current}s`])
  }, []);

  useEffect(() => {
    const stopTimer = countRef.current > HISTORY_LIMIT;

    if (!stopTimer) {
        const interval = setInterval(() => {
        fetchAndTrackData();
        countRef.current = countRef.current + 10;
        setTimeArray(timeArray => [...timeArray, `${countRef.current}s`]);
      }, REFRESH_INTERVAL);
      return () => {
        clearInterval(interval);
      }
    }
  }, [countRef, timeArray]);

  // Set up the charts and update them as more data is retrieved
  useEffect(() => {
    setChartData({
        labels: timeArray,
        datasets: [
          {
            label: 'CPU Load',
            data: cpuLoadArray,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ]
    });
  }, [cpuLoadArray, timeArray]);

  useEffect(() => {
    setBarChartData({
        labels: timeArray,
        datasets: [
          {
            label: 'High CPU Load',
            data: highAverageLoad,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            barPercentage: 1.0,
          },
          {
            label: 'Recovered CPU Load',
            data: recoveredAverageLoad,
            backgroundColor: 'rgb(75, 192, 192)',
            barPercentage: 1.0,
          },
        ]
    });
  }, [highAverageLoad, timeArray]);

  const isDataAvailable = cpuLoadArray.length > 0;
  const currentCpuAverage = cpuLoadArray[cpuLoadArray.length - 1];

  return (
    <div className="App">
      <Toaster position="top-right"/>
      <header className="App-header">
       {!isDataAvailable ? "Loading..." : (
          <>
            <p>Current CPU Average: {currentCpuAverage}</p>
            <Chart chartData={chartData} />
            <BarChart chartData={barChartData} />
          </>
        )
       }
      </header>
    </div>
  );
}

export default App;