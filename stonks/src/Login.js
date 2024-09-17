import React, { useState } from 'react';
import axios from 'axios';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const submitHandler = (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/token';
    axios.post(`http://localhost:8000${endpoint}`, new URLSearchParams({
      username,
      password,
    }))
    .then(response => {
      if (!isRegistering) {
        setToken(response.data.access_token);
      } else {
        alert('Registration successful! You can now log in.');
        setIsRegistering(false);
      }
    })
    .catch(error => {
      console.error('Error during authentication:', error);
      alert('Authentication failed.');
    });
  };

  return (
    <div>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={submitHandler}>
        <input type="text" placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? 'Already have an account? Login' : 'New user? Register'}
      </button>
    </div>
  );
}

export default Login;
