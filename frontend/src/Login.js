import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errMessage, setErrMessage] = useState('');

  const handleChange = (e) => {
    setErrMessage('');
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem('token', token);
      window.location.href = '/';
    } catch (error) {
      console.error("Error logging in:", error);
      setErrMessage('Login failed. Check your credentials.');
    }
  };

  return (
    <Container className="mt-4 d-flex justify-content-center" style={{ minHeight: '70vh' }}>
      <Card style={{ maxWidth: '400px', width: '100%' }} className="shadow">
        <Card.Body>
          <h2 className="mb-4 text-center">Log In</h2>
          {errMessage && <Alert variant="danger">{errMessage}</Alert>}
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
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                required 
                placeholder="Enter your password"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 mb-3">Log In</Button>
          </Form>
          <div className="text-center">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
