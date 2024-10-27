// App.js

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

function App() {
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState('');
  const [stockAnalysisData, setStockAnalysisData] = useState([]);
  const [americanBullData, setAmericanBullData] = useState([]);
  const [showData, setShowData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update the base URL to port 5000 where your backend is running
  const axiosInstance = useMemo(() => axios.create({
    baseURL: 'http://localhost:8000',
  }), []);

  // Fetch user's stocks on component mount
  useEffect(() => {
    axiosInstance.get('/stocks')
      .then(response => setStocks(response.data.stocks))
      .catch(error => console.error('Error fetching stocks:', error));
  }, [axiosInstance]); // Include axiosInstance as a dependency

  const addStock = () => {
    const confirmed = window.confirm(`Are you sure you want to add stock ${newStock.toUpperCase()}?`);
    if (!confirmed) return;

    axiosInstance.post('/add_stock', null, { params: { stock_symbol: newStock } })
      .then(response => {
        alert(response.data.message);
        if (!stocks.includes(newStock.toUpperCase())) {
          setStocks([...stocks, newStock.toUpperCase()]);
        }
        setNewStock('');
      })
      .catch(error => {
        if (error.response && error.response.data.detail) {
          alert(error.response.data.detail);
        } else {
          console.error('Error adding stock:', error);
        }
      });
  };

  const removeStock = (stockSymbol) => {
    axiosInstance.post('/remove_stock', null, { params: { stock_symbol: stockSymbol } })
      .then(response => {
        alert(response.data.message);
        setStocks(stocks.filter(stock => stock !== stockSymbol));
        if (showData) {
          displayStockData();
        }
      })
      .catch(error => {
        console.error('Error removing stock:', error);
      });
  };

  const removeStockData = (stockSymbol) => {
    axiosInstance.post('/remove_stock_data', null, { params: { stock_symbol: stockSymbol } })
      .then(response => {
        alert(response.data.message);
        displayStockData();
      })
      .catch(error => {
        console.error('Error removing stock data:', error);
      });
  };

  const displayStockData = () => {
    setLoading(true);
    setError('');
    setShowData(false);

    axiosInstance.post('/execute_analysis')
      .then(() => Promise.all([
        axiosInstance.get('/data/Stock Analysis'),
        axiosInstance.get('/data/American Bull Info'),
      ]))
      .then(([stockAnalysisRes, americanBullRes]) => {
        setStockAnalysisData(stockAnalysisRes.data.data);
        setAmericanBullData(americanBullRes.data.data);
        setShowData(true);
      })
      .catch(error => {
        console.error('Error during displayStockData:', error);  // Detailed error logging
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        } else if (error.request) {
          console.error('Request data:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
        setError('An error occurred while fetching data.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      <h1>Welcome to Your Trading Dashboard</h1>

      {/* Stock List Section */}
      <h2>Your Stocks</h2>
      <ul>
        {stocks.map((stock, idx) => (
          <li key={idx}>
            {stock}
            <button onClick={() => removeStock(stock)}>Remove</button>
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Add Stock Symbol"
        value={newStock}
        onChange={(e) => setNewStock(e.target.value)}
      />
      <button onClick={addStock}>Add Stock</button>

      {/* Stock Data Section */}
      <h2>Stock Data</h2>
      <button onClick={displayStockData}>Display Stock Data</button>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showData && (
        <div>
          {/* Stock Analysis Table */}
          <h3>Stock Analysis</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Price</th>
                <th>%K</th>
                <th>%D</th>
                <th>Zone</th>
                <th>Decision</th>
                <th>Actions</th>
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
                  <td>
                    <button onClick={() => removeStockData(item['Stock Name'])}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* American Bull Info Table */}
          <h3>American Bull Info</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Signal</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {americanBullData.map((item, index) => (
                <tr key={index}>
                  <td>{item['Stock Name']}</td>
                  <td>{item['Signal']}</td>
                  <td>{item['Date']}</td>
                  <td>
                    <button onClick={() => removeStockData(item['Stock Name'])}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
