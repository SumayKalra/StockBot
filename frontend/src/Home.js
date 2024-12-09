import React from 'react';
import { Container, Row, Col, Button, Card, Carousel, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-dark text-white py-5 text-center">
        <Container>
          <h1 className="display-4">Welcome to Stock App</h1>
          <p className="lead">
            Your one-stop solution for stock analysis, tracking, and insights.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="me-3"
            onClick={() => navigate('/signup')}
          >
            Get Started
          </Button>
          <Button
            variant="outline-light"
            size="lg"
            onClick={() => navigate('/about')}
          >
            Learn More
          </Button>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Why Choose Stock App?</h2>
        <Row>
          <Col md={4}>
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <Card.Title>Real-Time Stock Data</Card.Title>
                <Card.Text>
                  Access live stock prices and performance metrics to stay ahead of the market.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <Card.Title>Comprehensive Analysis</Card.Title>
                <Card.Text>
                  Leverage advanced tools for technical and fundamental analysis of your portfolio.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-3 shadow-sm">
              <Card.Body>
                <Card.Title>Insights from Top Traders</Card.Title>
                <Card.Text>
                  Get recommendations and insights from experts like Nancy Pelosi's trading data.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* How It Works Section */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-4">How It Works</h2>
          <Row>
            <Col md={3}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>1. Sign Up</Card.Title>
                  <Card.Text>
                    Create your free account to start tracking and analyzing stocks.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>2. Add Stocks</Card.Title>
                  <Card.Text>
                    Add your favorite stocks to your portfolio for real-time updates and alerts.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>3. Analyze</Card.Title>
                  <Card.Text>
                    Use our advanced analysis tools to make informed decisions.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>4. Stay Ahead</Card.Title>
                  <Card.Text>
                    Leverage insights and data-driven recommendations to maximize your gains.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Featured Stocks Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Trending Stocks</h2>
        <Table striped bordered hover>
          <thead className="table-dark">
            <tr>
              <th>Stock Name</th>
              <th>Price</th>
              <th>Change</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Apple (AAPL)</td>
              <td>$180.50</td>
              <td>+1.35%</td>
              <td>120M</td>
            </tr>
            <tr>
              <td>Microsoft (MSFT)</td>
              <td>$320.10</td>
              <td>+0.90%</td>
              <td>95M</td>
            </tr>
            <tr>
              <td>Amazon (AMZN)</td>
              <td>$135.20</td>
              <td>-0.45%</td>
              <td>80M</td>
            </tr>
            <tr>
              <td>Tesla (TSLA)</td>
              <td>$250.75</td>
              <td>+2.10%</td>
              <td>150M</td>
            </tr>
          </tbody>
        </Table>
      </Container>

      {/* Testimonials Section */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-4">What Our Users Say</h2>
          <Carousel>
            <Carousel.Item>
              <p className="text-center">
                "Stock App has completely changed the way I trade. The insights are incredible, and the
                interface is so user-friendly!"
              </p>
              <p className="text-center"><strong>- John Trader</strong></p>
            </Carousel.Item>
            <Carousel.Item>
              <p className="text-center">
                "I love the AI-powered analysis. It's like having a financial advisor at my fingertips."
              </p>
              <p className="text-center"><strong>- Jane Investor</strong></p>
            </Carousel.Item>
            <Carousel.Item>
              <p className="text-center">
                "Tracking Nancy Pelosi's trades has never been easier. I'm seeing great results!"
              </p>
              <p className="text-center"><strong>- Sam Analyst</strong></p>
            </Carousel.Item>
          </Carousel>
        </Container>
      </div>

      {/* Call-to-Action Section */}
      <div className="bg-dark text-white py-5 text-center">
        <Container>
          <h2>Ready to Start Your Journey?</h2>
          <p>
            Join thousands of investors who trust Stock App for their trading needs.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="me-3"
            onClick={() => navigate('/signup')}
          >
            Get Started Now
          </Button>
        </Container>
      </div>
    </div>
  );
};

export default Home;
