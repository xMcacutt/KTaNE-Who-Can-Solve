import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function UserHandler({ setUser, setScores }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, error: userError, isFetching: isFetchingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true,
      });
      console.log('User response:', response.data);
      return {
        id: response.data.discord_id,
        name: response.data.username,
        email: response.data.email,
      };
    },
    retry: false,
    onError: (err) => {
      console.log('User query error:', err);
      setUser(null);
    },
  });

  const { data: scores, error: scoresError, isFetching: isFetchingScores } = useQuery({
    queryKey: ['scores', user?.id],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/scores', {
        withCredentials: true,
      });
      console.log('Scores response:', response.data);
      return response.data.reduce(
        (acc, score) => ({
          ...acc,
          [score.module_id]: {
            defuserConfidence: score.defuser_confidence,
            expertConfidence: score.expert_confidence,
          },
        }),
        {},
      );
    },
    enabled: !!user, 
    retry: false,
  });

  useEffect(() => {
    if (user) {
      console.log('Setting user:', user);
      setUser(user);
    }
  }, [user, setUser]);

  useEffect(() => {
    if (scores) {
      setScores(scores);
    }
  }, [scores, setScores]);

  useEffect(() => {
    console.log('useEffect running, user:', user, 'path:', window.location.pathname);
    if (user && window.location.pathname === '/profile') {
      navigate('/');
    }
  }, [user, navigate]);

  console.log('UserHandler rendered, user:', user, 'scores:', scores, 'isFetchingUser:', isFetchingUser, 'isFetchingScores:', isFetchingScores);

  return null;
}

export default UserHandler;