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

  const handleActivateBot = () => {
    setBotActive(!botActive);
  };

  const handleRefreshDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await validateAndFetchTrades(username, password, totpSecret);

      if (result.isValid) {
        setTrades(result.trades || []);
        setBalance(parseFloat(result.balance || 0));
        setBuyingPower(parseFloat(result.buying_power || 0));
        setCash(parseFloat(result.cash || 0));
        setRecommendations(result.recommendations || []);
      } else {
        setError("Failed to refresh the dashboard. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while refreshing the dashboard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      {!isLoggedIn ? (
        <Card className="shadow-sm p-4">
          <h1>Robinhood Bot</h1>
          <p>
            <strong>About Robinhood Bot:</strong> The Robinhood Bot is your trusted, AI-powered trading assistant, designed to help you maximize your investment potential with ease and efficiency. Whether you're a novice trader looking to understand the basics or an experienced investor seeking advanced insights, this bot is tailored to meet your needs. Here's what it offers:
          </p>
          <ul>
            <li>Gain a clear, real-time view of your trading history, account balance, buying power, and other essential account details. The Robinhood Bot organizes your data, allowing you to make well-informed financial decisions.</li>
            <li>Powered by intelligent algorithms and market analytics, the bot provides personalized trade recommendations based on real-time market trends, performance indicators, and your trading history. These recommendations are designed to help you identify promising opportunities and mitigate potential risks.</li>
            <li>Unlock the power of automation by enabling the bot’s automated trading feature. This allows the bot to execute trades on your behalf, following predefined strategies and risk parameters you control. It's ideal for active traders who want to seize market opportunities without constant monitoring.</li>
            <li>Built with a strong focus on security and user privacy, the bot uses encryption and other security measures to protect your credentials and trading information. Your data stays confidential and is never shared with third parties.</li>
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
            <strong>DISCLAIMER:</strong> By entering your Robinhood credentials, you acknowledge and agree to the following:
            <ul>
              <li>
                <strong>Data Usage:</strong> The Robinhood Bot will access your Robinhood account to retrieve information
                regarding your trading history, account balance, and other relevant data. This information is used solely
                for the purpose of providing insights and recommendations within the application.
              </li>
              <li>
                <strong>Account Security:</strong> While we take reasonable precautions to secure your information, 
                including encryption and secure storage of credentials, we cannot guarantee absolute security. By using
                this application, you accept the inherent risks of transmitting sensitive data online.
              </li>
              <li>
                <strong>Third-Party Access:</strong> This application is not affiliated with or endorsed by Robinhood Markets, Inc.
                Use of this bot is at your own discretion, and you agree to release Robinhood Markets, Inc., as well as the 
                developers of this bot, from any liability arising from its use.
              </li>
              <li>
                <strong>Automated Trading:</strong> If you choose to activate the automated trading feature, you are responsible 
                for monitoring and managing the actions of the bot. Poor trading decisions, loss of funds, or other financial 
                impacts are solely your responsibility.
              </li>
              <li>
                <strong>Regulatory Compliance:</strong> It is your responsibility to ensure that the use of this bot complies 
                with all applicable laws, regulations, and Robinhood’s terms of service.
              </li>
              <li>
                <strong>Privacy:</strong> Your credentials and other sensitive information will not be shared with third parties 
                under any circumstances. However, by using this bot, you acknowledge and accept that some information will be 
                stored temporarily for the purpose of functionality.
              </li>
              <li>
                <strong>Monitoring:</strong> Regularly monitor your Robinhood account to verify the accuracy of data displayed 
                by this bot and to ensure no unauthorized actions have occurred. Promptly report any issues to Robinhood’s 
                customer support.
              </li>
              <li>
                <strong>Assumption of Risk:</strong> Use of this bot is entirely at your own risk. By proceeding, you accept 
                full responsibility for any potential losses, damages, or unintended outcomes resulting from its use.
              </li>
              <li>
                <strong>No Guarantees:</strong> This bot is provided "as is" with no guarantees regarding accuracy, reliability, 
                or performance. Recommendations provided by the bot are for informational purposes only and should not be 
                construed as financial advice.
              </li>
            </ul>
            <p>
              By continuing to use the Robinhood Bot, you confirm that you have read, understood, and accepted the terms of 
              this disclaimer. If you do not agree to these terms, please refrain from entering your credentials or using 
              the application.
            </p>
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

            <Button onClick={handleLogin} disabled={loading} className="me-2">
              {loading ? <Spinner animation="border" size="sm" /> : "Login"}
            </Button>
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Past Trades</h3>
                <Button variant="primary" onClick={handleRefreshDashboard} disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : "Refresh Dashboard"}
                </Button>
              </div>
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
