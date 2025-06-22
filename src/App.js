import { useState, Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import UserHandler from './components/UserHandler.jsx'

const ModuleList = lazy(() => import('./components/ModuleList'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [scores, setScores] = useState({});

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/discord';
  };

  const handleLogout = () => {
    axios.get('http://localhost:5000/auth/logout', { withCredentials: true })
      .then(() => {
        setUser(null);
        setScores({});
        queryClient.invalidateQueries(['user']);
      })
      .catch((error) => console.error('Logout failed:', error));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <UserHandler
        setUser={setUser}
        setScores={setScores}
        setCurrentPage={setCurrentPage}
      />
        <div className="container">
          <nav className="d-flex justify-content-between align-items-center mb-4" role="navigation">
            <img src="./Logo.svg" alt="KTaNE Who Can Solve? Logo" width={400} />
            {user ? (
              <div className="d-flex gap-3">
                <button onClick={() => setCurrentPage('myAccount')} className="btn action-button" aria-label="View my account">
                  My Account
                </button>
                <button onClick={handleLogout} className="btn logout-button" aria-label="Log out">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="btn action-button discord-button" aria-label="Log in with Discord">
                Login with Discord
              </button>
            )}
          </nav>

          <Routes>
            <Route
              path="/"
              element={
                currentPage === 'home' && (
                  <Suspense fallback={<p>Loading modules...</p>}>
                    <ModuleList user={user} setScores={setScores} scores={scores} />
                  </Suspense>
                )
              }
            />
            <Route path="/profile" />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;