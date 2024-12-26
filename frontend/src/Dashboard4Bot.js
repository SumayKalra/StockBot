// src/Dashboard4Bot.js
import React, { useEffect, useState } from "react";
import { Container, Card, Button, Table, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "./AuthContext"; // Import useAuth hook
import { useNavigate } from "react-router-dom";

const Dashboard4Bot = () => {
  const { user, token, logout } = useAuth(); // Destructure authentication functions and state
  const navigate = useNavigate();

  const [stockAnalysis, setStockAnalysis] = useState([]);
  const [americanBullInfo, setAmericanBullInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Fetch Stock Analysis Data
   */
  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:8000/stock_analysis", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStockAnalysis(data.stock_analysis);

      const bullResponse = await fetch("http://localhost:8000/american_bull_info", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const bullData = await bullResponse.json();
      setAmericanBullInfo(bullData.american_bull_info);
    } catch (err) {
      setError("Failed to fetch data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  /**
   * Handle Logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      setError("Failed to logout.");
      console.error(err);
    }
  };

  /**
   * Handle Execute Analysis
   */
  const handleExecuteAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/execute_analysis", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === "Analysis executed") {
        // Refresh data after analysis
        await fetchData();
      } else {
        setError(data.status || "Failed to execute analysis.");
      }
    } catch (err) {
      setError("Failed to execute analysis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card className="shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>Trading Dashboard</h2>
          <Button variant="outline-danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        <Button variant="primary" className="mt-3" onClick={handleExecuteAnalysis} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Execute Analysis"}
        </Button>

        <h4 className="mt-4">Stock Analysis</h4>
        {stockAnalysis.length === 0 ? (
          <p>No stock analysis data available.</p>
        ) : (
          <Table striped bordered hover className="mt-2">
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Price</th>
                <th>%K</th>
                <th>%D</th>
                <th>Zone</th>
                <th>Decision</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {stockAnalysis.map((stock, index) => (
                <tr key={index}>
                  <td>{stock["Stock Name"]}</td>
                  <td>{stock["Price"]}</td>
                  <td>{stock["%K"]}</td>
                  <td>{stock["%D"]}</td>
                  <td>{stock["Zone"]}</td>
                  <td>{stock["Decision"]}</td>
                  <td>
                    {stock["Last Updated"]
                      ? new Date(stock["Last Updated"].seconds * 1000).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <h4 className="mt-4">American Bull Info</h4>
        {americanBullInfo.length === 0 ? (
          <p>No American Bull info available.</p>
        ) : (
          <Table striped bordered hover className="mt-2">
            <thead>
              <tr>
                <th>Stock Name</th>
                <th>Signal</th>
                <th>Date</th>
                <th>Price</th>
                <th>Change%</th>
                <th>Value</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {americanBullInfo.map((bull, index) => (
                <tr key={index}>
                  <td>{bull["Stock Name"]}</td>
                  <td>{bull["Signal"]}</td>
                  <td>{bull["Date"]}</td>
                  <td>{bull["Price"]}</td>
                  <td>{bull["Change%"]}</td>
                  <td>{bull["Value"]}</td>
                  <td>
                    {bull["Last Updated"]
                      ? new Date(bull["Last Updated"].seconds * 1000).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
};

export default Dashboard4Bot;
