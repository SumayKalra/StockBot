// src/pages/Signup.js
import React, { useState, useContext, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from './AuthContext'; // Adjust the path if necessary
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';

const Signup = () => {
  const auth = getAuth();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h2 className="text-center">Signup</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formBasicEmail" className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control 
            type="email" 
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="w-100">
          Signup
        </Button>
      </Form>
      <div className="mt-3 text-center">
        Already have an account? <Link to="/login">Login here</Link>
      </div>
    </Container>
  );
};

export default Signup;
