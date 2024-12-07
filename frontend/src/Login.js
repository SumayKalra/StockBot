// src/pages/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from './AuthContext'; // Import AuthContext
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Alert, Spinner } from 'react-bootstrap';

const Login = () => {
  const auth = getAuth();
  const { user, loading } = useContext(AuthContext); // Access user and loading state
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false); // State to show spinner during login

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard'); // Redirect to Dashboard if already logged in
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect will be handled by useEffect
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading) {
    // Optionally, display a spinner while checking auth state
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container style={{ maxWidth: '500px', marginTop: '50px' }}>
      <h2 className="text-center">Login</h2>
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
        <Button variant="primary" type="submit" className="w-100" disabled={loggingIn}>
          {loggingIn ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </Form>
      <div className="mt-3 text-center">
        Don't have an account? <Link to="/signup">Signup here</Link>
      </div>
    </Container>
  );
};

export default Login;
