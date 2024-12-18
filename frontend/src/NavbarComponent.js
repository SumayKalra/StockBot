import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext'; // Import AuthContext
import { Navbar, Nav, Button, Container } from 'react-bootstrap';

const NavbarComponent = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // Sign out the user
      navigate('/login'); // Redirect to Login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Stock App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">Home</Nav.Link> {/* Home Link */}
            <Nav.Link as={Link} to="/about">About Us</Nav.Link> {/* About Us Link */}
            {user ? (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/robinhood-bot">Robinhood Bot</Nav.Link>
                
                {/* Display user email if available */}
                {user.email && (
                  <Nav.Item className="text-light mx-2">
                    {user.email}
                  </Nav.Item>
                )}
                
                <Button variant="outline-light" onClick={handleLogout} className="ms-2">Logout</Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
