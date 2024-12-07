import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar, Nav, Container, Row, Col, Card, Button, Table, Spinner } from 'react-bootstrap';

const Dashboard = () => {
  const [stockAnalysisData, setStockAnalysisData] = useState([]);
  const [americanBullData, setAmericanBullData] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [showData, setShowData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000', // Adjust if hosted elsewhere
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  useEffect(() => {
    axiosInstance.get('/stocks')
      .then(response => setStockList(response.data.stocks))
      .catch(error => {
        console.error('Error fetching stock list:', error);
        setError('Failed to fetch stock list.');
      });
  }, [axiosInstance]);

  const displayStockData = () => {
    setLoading(true);
    setError('');
    setShowData(false);

    axiosInstance.post('/execute_analysis')
      .then(() =>
        Promise.all([
          axiosInstance.get('/data/Stock Analysis', { params: { timestamp: new Date().getTime() } }),
          axiosInstance.get('/data/American Bull Info', { params: { timestamp: new Date().getTime() } }),
        ])
      )
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

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Trading Dashboard</Navbar.Brand>
          <Navbar.Toggle aria-controls="dashboard-navbar-nav" />
          <Navbar.Collapse id="dashboard-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#stock-list">Your Stocks</Nav.Link>
              <Nav.Link href="#stock-data">Stock Data</Nav.Link>
            </Nav>
            <Button variant="outline-light" onClick={logout}>Logout</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row id="stock-list">
          <Col>
            <h2>Your Stock List</h2>
            <Card className="mb-4">
              <Card.Body>
                {stockList.length === 0 ? (
                  <p>You currently have no stocks.</p>
                ) : (
                  <ul className="list-unstyled">
                    {stockList.map((stock, index) => (
                      <li key={index} className="mb-2" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                        {stock}
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-start">
              <Button variant="success" onClick={displayStockData}>
                Refresh/Display Stock Data
              </Button>
            </div>

            {loading && (
              <div className="my-3 d-flex align-items-center">
                <Spinner animation="border" variant="primary" className="me-2" />
                <span>Loading data...</span>
              </div>
            )}
            {error && <p style={{ color: 'red' }} className="mt-3">{error}</p>}
          </Col>
        </Row>

        {showData && (
          <Row className="mt-5" id="stock-data">
            <Col>
              <h2>Stock Analysis</h2>
              <Card className="mb-4">
                <Card.Body>
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
                          <td>{item['%K']}</td>
                          <td>{item['%D']}</td>
                          <td>{item['Zone']}</td>
                          <td>{item['Decision']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <h2>American Bull Info</h2>
              <Card className="mb-4">
                <Card.Body>
                  <Table striped bordered hover responsive>
                    <thead className="table-dark">
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
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
};

export default Dashboard;
