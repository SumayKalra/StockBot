import React, { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner, Table, Row, Col } from "react-bootstrap";

const validateAndFetchTrades = async (username, password) => {
  try {
    const response = await fetch("http://localhost:8000/validate_and_fetch_trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error validating and fetching trades:", error);
    return { isValid: false, error: "An error occurred while validating credentials." };
  }
};

const RobinhoodBot = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      const result = await validateAndFetchTrades(username, password);

      if (result.isValid) {
        setIsLoggedIn(true);
        setTrades(result.trades || []);
        setBalance(parseFloat(result.balance || 0)); // Ensure it's a number
        setBuyingPower(parseFloat(result.buying_power || 0)); // Ensure it's a number
        setCash(parseFloat(result.cash || 0)); // Ensure it's a number
        setRecommendations(result.recommendations || []);
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while logging in.");
    } finally {
      setLoading(false);
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
            <strong>About Robinhood Bot:</strong> The Robinhood Bot is your automated companion for managing stock trading. This application integrates seamlessly with your Robinhood account to streamline your trading experience. Once logged in, the bot provides:
          </p>
          <ul>
            <li>Comprehensive access to your trading history, account balance, and buying power.</li>
            <li>Intelligent trade recommendations based on market analytics.</li>
            <li>An optional automated trading feature to execute trades on your behalf.</li>
          </ul>
          <p>
            Designed for both novice and experienced traders, this bot simplifies trading and helps you make informed decisions efficiently. The automation feature employs predefined strategies to capitalize on market opportunities in real time.
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
            <strong>DISCLAIMER:</strong> By entering your Robinhood credentials, you agree to give the Robinhood Bot secure access to your account data for trading purposes. <u>We do not store your credentials in plaintext.</u> Instead, they are encrypted and securely managed. However, automated trading comes with inherent financial risks, and results may vary depending on market conditions. Use this application with caution, as the developers are not liable for any financial losses you may incur while using the bot.
          </p>
          <p>
            It is strongly recommended that you monitor your trades regularly and only use funds that you are willing to risk. Please read our full terms and conditions for detailed information.
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

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="d-flex align-items-center mt-3">
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Login"}
            </Button>

            {loading && (
              <p className="mb-0 ms-3 text-muted">Taking a few seconds to retrieve your Robinhood data...</p>
            )}
          </div>
          </Form>

          {/* Embedded YouTube Video */}
          <div className="mt-4">
            <h4>Watch the Tutorial</h4>
            <p>
              Learn how to use Robinhood Bot effectively by watching the video below:
            </p>
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
          {/* Left Column: Past Trades */}
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

          {/* Right Column: Summary and Actions */}
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
                Activating the Stock Bot allows automatic trading based on predefined strategies.
                Please use at your own risk. Performance is not guaranteed.
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
