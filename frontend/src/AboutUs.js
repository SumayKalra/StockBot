import React from "react";
import { Container, Row, Col, Card, Image } from "react-bootstrap";

const AboutUs = () => {
  return (
    <Container className="py-5">
      <Card className="shadow-sm p-4">
        <h1 className="text-center mb-4">About Us</h1>

        {/* Mission Section */}
        <Row className="mb-5">
          <Col>
            <h3>Our Mission</h3>
            <p>
              At Stock App, our mission is to empower individuals to make smarter investment decisions
              by providing cutting-edge tools and insights. We strive to bridge the gap between
              complex stock market data and user-friendly solutions that cater to both novice and
              experienced investors. Our goal is to foster financial literacy and confidence, enabling
              users to achieve their financial aspirations.
            </p>
            <p>
              By leveraging the latest advancements in technology, including artificial intelligence
              and data analytics, we aim to provide unparalleled accuracy and actionable recommendations.
              At Stock App, we believe in the transformative power of knowledge and innovation to create
              a better financial future for everyone.
            </p>
          </Col>
        </Row>

        {/* Team Section */}
        <Row className="mb-5">
          <Col>
            <h3>Meet the Team</h3>
            <p>
              Our team is a dynamic group of passionate developers, analysts, and visionaries committed
              to building a platform that makes investing accessible to all. With diverse backgrounds and
              expertise, we work collaboratively to bring our shared vision to life. Meet the people who
              are making Stock App a reality:
            </p>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Card className="mb-3 shadow-sm">
              <Image
                src="https://via.placeholder.com/200"
                roundedCircle
                className="mx-auto d-block mt-3"
                style={{ width: "150px", height: "150px" }}
              />
              <Card.Body className="text-center">
                <Card.Title>Sumay Kalra</Card.Title>
                <Card.Text>Developer</Card.Text>
                <p>
                  Sumay is a skilled developer with a passion for creating intuitive applications that
                  solve real-world problems. With expertise in full-stack development, Sumay brings
                  innovation and dedication to every project.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-3 shadow-sm">
              <Image
                src="https://via.placeholder.com/200"
                roundedCircle
                className="mx-auto d-block mt-3"
                style={{ width: "150px", height: "150px" }}
              />
              <Card.Body className="text-center">
                <Card.Title>Gautam Chaudhri</Card.Title>
                <Card.Text>Developer</Card.Text>
                <p>
                  Gautam is an innovative developer with a knack for solving complex problems. With a
                  background in software engineering, he ensures that every feature is optimized for
                  performance and reliability.
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-3 shadow-sm">
              <Image
                src="https://via.placeholder.com/200"
                roundedCircle
                className="mx-auto d-block mt-3"
                style={{ width: "150px", height: "150px" }}
              />
              <Card.Body className="text-center">
                <Card.Title>Sean Tran</Card.Title>
                <Card.Text>Developer</Card.Text>
                <p>
                  Sean is a dedicated developer with a focus on user experience and design. He ensures
                  that every interface is intuitive and seamless, making Stock App accessible to users
                  of all levels.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Vision Section */}
        <Row>
          <Col>
            <h3>Our Vision</h3>
            <p>
              We envision a world where anyone can confidently navigate the stock market using
              advanced technology and accessible tools. By democratizing access to investment
              insights and automation, we aim to create a level playing field for all investors.
            </p>
            <p>
              Our vision is rooted in the belief that financial growth should not be limited by
              complexity or inaccessibility. With Stock App, we strive to empower users to take
              control of their financial futures, one informed decision at a time.
            </p>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default AboutUs;
