// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';
import ProtectedRoute from './ProtectedRoute';
import NavbarComponent from './NavbarComponent';
import RobinhoodBot from './RobinhoodBot'; // Import the Robinhood Bot component
import { AuthContext } from './AuthContext'; // Removed AuthProvider import
import { Spinner, Container } from 'react-bootstrap';

function App() {
  return (
    <Router>
      <NavbarComponent />
      <AuthWrapper />
    </Router>
  );
}

const AuthWrapper = () => {
  const { loading, user } = React.useContext(AuthContext); // Destructure loading and user

  if (loading) {
    // Show spinner while loading authentication state
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/robinhood-bot"
        element={
          <ProtectedRoute>
            <RobinhoodBot />
          </ProtectedRoute>
        }
      />
      {/* Redirect any unknown routes to Dashboard if authenticated, else to Login */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export default App;
