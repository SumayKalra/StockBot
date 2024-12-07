import React, { useState } from 'react';
import { Form, Button, Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Signup() {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      alert("Account created successfully! You can now log in.");
      window.location.href = '/login';
    } catch (error) {
      console.error("Error registering:", error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: '400px' }}>
      <Card>
        <Card.Body>
          <h2 className="mb-3 text-center">Create an Account</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                required 
                placeholder="Enter your email"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                required 
                placeholder="Create a password"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-3">Sign Up</Button>
          </Form>
          <div className="text-center">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Signup;
