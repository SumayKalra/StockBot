// src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Form, Dropdown, Modal } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import { AuthContext } from './AuthContext'; // Import AuthContext

const Dashboard = () => {
  const { token } = useContext(AuthContext); // Access token from AuthContext
  const [stockList, setStockList] = useState([]);
  const [stockAnalysisData, setStockAnalysisData] = useState([]);
  const [americanBullData, setAmericanBullData] = useState([]);
  const [nancyStockData, setNancyStockData] = useState([]);
  const [newStock, setNewStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false); // State for Modal

  const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000', // Fallback to localhost
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const fetchStocks = async () => {
    try {
      const response = await axiosInstance.get('/stocks');
      setStockList(response.data.stocks);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to fetch stocks.');
    }
  };

  const fetchAnalysisData = async () => {
    try {
      const [analysisRes, bullRes, nancyRes] = await Promise.all([
        axiosInstance.get('/stock_analysis'),
        axiosInstance.get('/american_bull_info'),
        axiosInstance.get('/nancy_stock_stalker')
      ]);
      console.log('Nancy Stock Stalker API Response:', nancyRes.data); // Debugging line
      setStockAnalysisData(analysisRes.data.stock_analysis);
      setAmericanBullData(bullRes.data.american_bull_info);
      setNancyStockData(nancyRes.data.nancy_trades);
      console.log('nancyStockData:', nancyRes.data.trades);  //debugging
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setError('Failed to fetch analysis data.');
    }
  };

  const executeAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      const res = await axiosInstance.post('/execute_analysis');
      setMessage(res.data.status);
      await fetchAnalysisData();
    } catch (err) {
      console.error('Error executing analysis:', err);
      setError('Failed to execute analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchAnalysisData();
    // eslint-disable-next-line
  }, [token]); // Re-fetch when token changes

  const addStock = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const trimmedStock = newStock.trim().toUpperCase();
    if (!trimmedStock) return;

    try {
      const res = await axiosInstance.post(`/add_stock?stock_symbol=${trimmedStock}`);
      setMessage(res.data.message);
      setNewStock('');
      await fetchStocks();

      // After adding a stock, execute analysis to update data
      await executeAnalysis();
    } catch (err) {
      console.error('Error adding stock:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error adding stock. Please try again.');
      }
    }
  };

  const removeStock = async (stockSymbol) => {
    setMessage('');
    setError('');
    try {
      const res = await axiosInstance.post(`/remove_stock?stock_symbol=${stockSymbol}`);
      setMessage(res.data.message);
      await fetchStocks();

      // After removing a stock, execute analysis to update data
      await executeAnalysis();
    } catch (err) {
      console.error('Error removing stock:', err);
      setError('Could not remove stock.');
    }
  };

  const deleteAllStocks = async () => {
    setMessage('');
    setError('');
    try {
      const res = await axiosInstance.post('/delete_all_stocks');
      setMessage(res.data.message);
      setStockList([]);
      setStockAnalysisData([]);
      setAmericanBullData([]);
    } catch (err) {
      console.error('Error deleting all stocks:', err);
      setError('Failed to delete all stocks.');
    } finally {
      setShowDeleteAllModal(false);
    }

    
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Handle missing dates
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
  };

  const handleShowDeleteAllModal = () => setShowDeleteAllModal(true);
  const handleCloseDeleteAllModal = () => setShowDeleteAllModal(false);

  return (
    <>
      <Container className="mt-4">
        {error && <Alert variant="danger" className="my-3">{error}</Alert>}
        {message && <Alert variant="success" className="my-3">{message}</Alert>}

        <Row className="mb-4">
          <Col md={6}>
            <h2>Your Stock List</h2>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                {stockList.length === 0 ? (
                  <p className="text-muted">You currently have no stocks.</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {stockList.map((stock, index) => (
                      <li key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{stock}</span>
                        <Button variant="danger" size="sm" onClick={() => removeStock(stock)}>
                          <FaTrash /> Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm p-3">
              <h4>Add Stock</h4>
              <Form onSubmit={addStock} className="d-flex align-items-center">
                <Form.Control 
                  type="text" 
                  placeholder="Enter stock symbol (e.g., AAPL)" 
                  value={newStock} 
                  onChange={(e) => setNewStock(e.target.value)} 
                  className="me-2"
                />
                <Button variant="primary" type="submit" disabled={!newStock.trim()}>
                  Add
                </Button>
              </Form>

              {stockList.length > 0 && (
                <Dropdown className="mt-3">
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                    Manage Stocks
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {stockList.map((stock, index) => (
                      <Dropdown.Item key={index} onClick={() => removeStock(stock)}>
                        <FaTrash /> Remove {stock}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Card>

            {stockList.length > 0 && (
              <Button variant="danger" onClick={handleShowDeleteAllModal}>
                Delete All Stocks
              </Button>
            )}

            <Button variant="success" onClick={executeAnalysis} disabled={stockList.length === 0} className="ms-3">
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Executing...
                </>
              ) : (
                "Refresh/Display Stock Data"
              )}
            </Button>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col>
            <h2>Stock Analysis</h2>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                {stockAnalysisData.length === 0 ? (
                  <p className="text-muted">No analysis data available.</p>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead className="table-dark">
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
                          <td>{item['%K']?.toFixed(2)}</td>
                          <td>{item['%D']?.toFixed(2)}</td>
                          <td>{item['Zone']}</td>
                          <td>{item['Decision']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            <h2>American Bull Info</h2>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                {americanBullData.length === 0 ? (
                  <p className="text-muted">No American Bull data available.</p>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead className="table-dark">
                      <tr>
                        <th>Stock Name</th>
                        <th>Signal</th>
                        <th>Date</th>
                        <th>Price</th>
                        <th>Change%</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {americanBullData.map((item, index) => (
                        <tr key={index}>
                          <td>{item['Stock Name']}</td>
                          <td>{item['Signal']}</td>
                          <td>{item['Date']}</td>
                          <td>{item['Price']}</td>
                          <td>{item['Change%']}</td>
                          <td>{item['Value']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

      <Row className="mt-5">
          <Col>
            <h2>Nancy Stock Stalker</h2>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                {/* Scrollable container for table */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table striped bordered hover responsive>
                    <thead className="table-dark" style={{ position: 'sticky', top: 0, backgroundColor: '#343a40', zIndex: 10}}>
                      <tr>
                        <th>Stock Name</th>
                        <th>Transaction Type</th>
                        <th>Transaction Amount</th>
                        <th>File Date</th>
                        <th>Trade Date</th>
                        <th>Delay (Days)</th>
                        <th>% Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!nancyStockData || nancyStockData.length === 0) ? (
                        <tr>
                          <td colSpan="7" className="text-center">No Nancy Stock Stalker data available.</td>
                        </tr>
                      ) : (
                        nancyStockData.map((item, index) => (
                          <tr key={index}>
                            <td>{item['ticker'] || 'N/A'}</td>
                            <td>{item['transaction_type'] || 'N/A'}</td>
                            <td>{item['transaction_amount'] || 'N/A'}</td>
                            {/* Format the file_date and trade_date */}
                            <td>{formatDate(item['file_date'])}</td>
                            <td>{formatDate(item['trade_date'])}</td>
                            <td>{item['delay_in_days'] || 'N/A'}</td>
                            <td>{item['gain_or_loss'] || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete All Confirmation Modal */}
      <Modal show={showDeleteAllModal} onHide={handleCloseDeleteAllModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete All</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete all your stocks and associated data? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteAllModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteAllStocks}>
            Delete All
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Dashboard;
