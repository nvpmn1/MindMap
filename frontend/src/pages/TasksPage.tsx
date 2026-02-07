import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// TasksPage redireciona para Dashboard
// Funcionalidade consolidada
export function TasksPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
}
