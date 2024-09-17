import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ token }) => {
  const [stockAnalysisData, setStockAnalysisData] = useState([]);
  const [americanBullData, setAmericanBullData] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [showData, setShowData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch user's stock list on component mount
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    axios.get('http://localhost:8000/stocks', { headers })
      .then(response => {
        setStockList(response.data.stocks);
      })
      .catch(error => {
        console.error('Error fetching stock list:', error);
      });
  }, [token]);

  const displayStockData = () => {
    setLoading(true);
    setError('');
    setShowData(false);

    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // First, execute the analysis
    axios.post('http://localhost:8000/execute_analysis', {}, { headers })
      .then(() => {
        // Then, fetch the data
        return Promise.all([
          axios.get('http://localhost:8000/data/Stock Analysis', { headers }),
          axios.get('http://localhost:8000/data/American Bull Info', { headers }),
        ]);
      })
      .then(([stockAnalysisRes, americanBullRes]) => {
        setStockAnalysisData(stockAnalysisRes.data.data);
        setAmericanBullData(americanBullRes.data.data);
        setShowData(true);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('An error occurred while fetching data.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <h2>Your Stock List</h2>
      <ul>
        {stockList.map((stock, index) => (
          <li key={index}>{stock}</li>
        ))}
      </ul>

      <button onClick={displayStockData}>Display Stock Data</button>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showData && (
        <div>
          <h2>Stock Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Price</th>
                <th>%K</th>
                <th>%D</th>
                <th>Zone</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {stockAnalysisData.map((item, index) => (
                <tr key={index}>
                  <td>{item['Stock Name']}</td>
                  <td>{item['Price']}</td>
                  <td>{item['%K']}</td>
                  <td>{item['%D']}</td>
                  <td>{item['Zone']}</td>
                  <td>{item['Decision']}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>American Bull Info</h2>
          <table>
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Signal</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {americanBullData.map((item, index) => (
                <tr key={index}>
                  <td>{item['Stock Name']}</td>
                  <td>{item['Signal']}</td>
                  <td>{item['Date']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
