import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import GetStarted from './GetStarted';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isAdmin) navigate('/admin');
    else if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, isAdmin, loading, navigate]);

  return <GetStarted />;
};

export default Index;
