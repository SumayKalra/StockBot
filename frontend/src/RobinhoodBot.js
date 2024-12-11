import React, { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner, Table, Row, Col } from "react-bootstrap";

const validateAndFetchTrades = async (username, password, totpSecret) => {
  try {
    const response = await fetch("http://localhost:8000/validate_and_fetch_trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, totp_secret: totpSecret }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error validating and fetching trades:", error);
    return { isValid: false, error: "An error occurred while validating credentials." };
  }
};

const getUserCredentials = async (username) => {
  try {
    const response = await fetch(`http://localhost:8000/get_credentials?username=${encodeURIComponent(username)}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching saved credentials:", error);
    return { error: "An error occurred." };
  }
};

const RobinhoodBot = () => {
  const [username, setUsername] = useState(localStorage.getItem("rh_username") || "");
  const [password, setPassword] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [trades, setTrades] = useState([]);
  const [balance, setBalance] = useState(0);
  const [buyingPower, setBuyingPower] = useState(0);
  const [cash, setCash] = useState(0);
  const [botActive, setBotActive] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await validateAndFetchTrades(username, password, totpSecret);

      if (result.isValid) {
        setIsLoggedIn(true);
        setTrades(result.trades || []);
        setBalance(parseFloat(result.balance || 0));
        setBuyingPower(parseFloat(result.buying_power || 0));
        setCash(parseFloat(result.cash || 0));
        setRecommendations(result.recommendations || []);
        localStorage.setItem("rh_username", username);
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while logging in.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCredentials = async () => {
    if (!username) {
      setError("Please enter a username before loading saved credentials.");
      return;
    }

    setError("");
    const creds = await getUserCredentials(username);
    if (creds.error) {
      setError(creds.error);
    } else {
      // Fill in the password and totpSecret from stored creds
      setPassword(creds.password || "");
      setTotpSecret(creds.totp_secret || "");
    }
  };

  const handleActivateBot = () => {
    setBotActive(!botActive);
  };

  return (
    <Container className="mt-4">
      {!isLoggedIn ? (
        <Card className="shadow-sm p-4">
          <h1>Robinhood Bot</h1>
          <p>
            <strong>About Robinhood Bot:</strong> The Robinhood Bot is your automated companion ...
          </p>
          <ul>
            <li>Comprehensive access to your trading history, account balance, and buying power.</li>
            <li>Intelligent trade recommendations based on market analytics.</li>
            <li>An optional automated trading feature to execute trades on your behalf.</li>
          </ul>
          <p>
            Designed for both novice and experienced traders, this bot simplifies trading ...
          </p>
          <p
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              border: "1px solid #ffeeba",
              borderRadius: "5px",
              padding: "15px",
              fontWeight: "bold",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <strong>DISCLAIMER:</strong> By entering your Robinhood credentials ...
          </p>
          <p>
            It is strongly recommended that you monitor your trades regularly ...
          </p>
          <Form>
            <Form.Group controlId="username" className="mb-3">
              <Form.Label>Robinhood Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your Robinhood Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="password" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your Robinhood Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="totpSecret" className="mb-3">
              <Form.Label>TOTP Secret</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your TOTP Secret"
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
              />
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="d-flex align-items-center mt-3">
              <Button onClick={handleLogin} disabled={loading} className="me-2">
                {loading ? <Spinner animation="border" size="sm" /> : "Login"}
              </Button>
              <Button variant="secondary" onClick={handleLoadCredentials} disabled={loading}>
                Load Saved Credentials
              </Button>
              {loading && (
                <p className="mb-0 ms-3 text-muted">
                  Retrieving your Robinhood data... If you've logged in before, this may take a few seconds.
                </p>
              )}
            </div>
          </Form>

          {/* Embedded YouTube Video */}
          <div className="mt-4">
            <h4>Watch the Tutorial</h4>
            <p>Learn how to use Robinhood Bot effectively by watching the video below:</p>
            <div className="ratio ratio-16x9">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Robinhood Bot Tutorial"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </Card>
      ) : (
        <Row>
          <Col md={8}>
            <Card className="shadow-sm p-4">
              <h3>Past Trades</h3>
              <Table striped bordered hover className="mt-4">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, index) => (
                    <tr key={index}>
                      <td>{new Date(trade.date).toLocaleString()}</td>
                      <td>{trade.symbol}</td>
                      <td>{trade.side}</td>
                      <td>{trade.quantity}</td>
                      <td>${parseFloat(trade.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm p-4 mb-4">
              <h4>Balance and Profit</h4>
              <p>Balance: ${balance.toFixed(2)}</p>
              <p>Buying Power: ${buyingPower.toFixed(2)}</p>
              <p>Cash: ${cash.toFixed(2)}</p>
            </Card>

            <Card className="shadow-sm p-4 mb-4">
              <h4>Activate Stock Bot</h4>
              <p>
                Activating the Stock Bot allows automatic trading based on predefined strategies. ...
              </p>
              <Button
                variant={botActive ? "danger" : "success"}
                onClick={handleActivateBot}
              >
                {botActive ? "Deactivate Bot" : "Activate Bot"}
              </Button>
            </Card>

            <Card className="shadow-sm p-4">
              <h4>Recommended Trades</h4>
              {recommendations.length === 0 ? (
                <p>No recommendations available.</p>
              ) : (
                <ul>
                  {recommendations.map((rec, index) => (
                    <li key={index}>
                      {rec.symbol}: {rec.reason}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default RobinhoodBot;
