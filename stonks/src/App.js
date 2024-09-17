// App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState('');
  const [rhUsername, setRhUsername] = useState('');
  const [rhPassword, setRhPassword] = useState('');
  const [stockAnalysisData, setStockAnalysisData] = useState([]);
  const [americanBullData, setAmericanBullData] = useState([]);
  const [showData, setShowData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
  });

  useEffect(() => {
    // Fetch user's stocks
    axiosInstance.get('/stocks')
      .then(response => setStocks(response.data.stocks))
      .catch(error => console.error('Error fetching stocks:', error));
  }, []);

  const addStock = () => {
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

        // Refresh data if it's currently displayed
        if (showData) {
          displayStockData();
        }
      })
      .catch(error => {
        if (error.response && error.response.data.detail) {
          alert(error.response.data.detail);
        } else {
          console.error('Error removing stock:', error);
        }
      });
  };

  const removeStockData = (stockSymbol) => {
    axiosInstance.post('/remove_stock_data', null, { params: { stock_symbol: stockSymbol } })
      .then(response => {
        alert(response.data.message);
        // Refresh data
        displayStockData();
      })
      .catch(error => {
        console.error('Error removing stock data:', error);
      });
  };

  const saveRobinhoodCredentials = () => {
    axiosInstance.post('/save_robinhood_credentials', null, {
      params: { rh_username: rhUsername, rh_password: rhPassword }
    })
    .then(response => alert(response.data.message))
    .catch(error => console.error('Error saving Robinhood credentials:', error));
  };

  const displayStockData = () => {
    setLoading(true);
    setError('');
    setShowData(false);

    // First, execute the analysis
    axiosInstance.post('/execute_analysis')
      .then(() => {
        // Then, fetch the data
        return Promise.all([
          axiosInstance.get('/data/Stock Analysis'),
          axiosInstance.get('/data/American Bull Info'),
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
      <h1>Welcome to Your Trading Dashboard</h1>

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

      <h2>Save Robinhood Credentials</h2>
      <input
        type="text"
        placeholder="Robinhood Username"
        value={rhUsername}
        onChange={(e) => setRhUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Robinhood Password"
        value={rhPassword}
        onChange={(e) => setRhPassword(e.target.value)}
      />
      <button onClick={saveRobinhoodCredentials}>Save Credentials</button>

      <h2>Stock Data</h2>
      <button onClick={displayStockData}>Display Stock Data</button>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showData && (
        <div>
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
                <th>Actions</th> {/* Added Actions Column */}
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

          <h3>American Bull Info</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Signal</th>
                <th>Date</th>
                <th>Actions</th> {/* Added Actions Column */}
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
