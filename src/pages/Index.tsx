import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GetStarted from './GetStarted';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    } else if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return <GetStarted />;
};

export default Index;
