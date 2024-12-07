import React from 'react';
import { Nav, Navbar, Container } from 'react-bootstrap';

function NavbarComponent() {
  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand href="/">Stock App</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-basic" />
        <Navbar.Collapse id="navbar-basic">
          <Nav className="me-auto">
            {/* Add nav links as needed */}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
