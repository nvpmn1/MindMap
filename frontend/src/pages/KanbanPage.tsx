import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// KanbanPage redireciona para Dashboard
// Funcionalidade consolidada
export function KanbanPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return null;
}
