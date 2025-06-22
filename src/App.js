import { useState, Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';


const ModuleList = lazy(() => import('./components/ModuleList'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});


function UserHandler({ setUser }) {
  const navigate = useNavigate();

  const { data: user, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true,
      });
      return response.data;
    },
    retry: false,
    onError: () => {
      console.log('Error fetching user');
      setUser(null);
    },
    onSuccess: (data) => {
      setUser({ id: data.discord_id, name: data.username, email: data.email });
    },
  });

  useEffect(() => {
    if (user && window.location.pathname === '/profile') {
      navigate('/');
    }
  }, [user, navigate]);

  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [moduleScores, setModuleScores] = useState({});

  const { data: scoresData } = useQuery({
    queryKey: ['scores', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const response = await axios.get('http://localhost:5000/api/scores', {
        withCredentials: true,
      });

      return response.data.reduce((acc, score) => ({
        ...acc,
        [score.module_id]: {
          defuser: score.defuser_confidence,
          expert: score.expert_confidence,
        },
      }), {});
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (scoresData) {
      setModuleScores(scoresData);
    }
  }, [scoresData]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/discord';
  };

  const handleLogout = () => {
    axios.get('http://localhost:5000/auth/logout', { withCredentials: true })
      .then(() => {
        setUser(null);
        queryClient.invalidateQueries(['user']);
      })
      .catch((error) => console.error('Logout failed:', error));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="container">
          <nav className="d-flex justify-content-between align-items-center mb-4" role="navigation">
            <img src="./Logo.svg" alt="KTaNE Who Can Solve? Logo" width={400} />
            {user ? (
              <div className="d-flex gap-3">
                <button
                  onClick={() => setCurrentPage('account')}
                  className="btn action-button"
                  aria-label="View my account"
                >
                  My Account
                </button>
                <button
                  onClick={handleLogout}
                  className="btn logout-button"
                  aria-label="Log out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="btn action-button discord-button"
                aria-label="Log in with Discord"
              >
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
                    <ModuleList user={user} scores={moduleScores} setScores={setModuleScores} />
                  </Suspense>
                )
              }
            />
            <Route path="/profile" element={<UserHandler setUser={setUser} />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;