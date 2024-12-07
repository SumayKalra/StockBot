// App.js
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';
import ProtectedRoute from './ProtectedRoute';
import NavbarComponent from './NavbarComponent';
import RobinhoodBot from './RobinhoodBot'; // Import the new component
import { AuthContext } from './AuthContext';
import { Spinner } from 'react-bootstrap';

function App() {
  const { loading } = useContext(AuthContext); // Access the loading state

  if (loading) {
    // Show spinner while loading
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Router>
      <NavbarComponent />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
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
      </Routes>
    </Router>
  );
}

export default App;
