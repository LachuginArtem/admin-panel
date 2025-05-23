import { useState } from 'react';

export const useAuthFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authFetch = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}${endpoint}`,
        {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // Если 401 Unauthorized - разлогиниваем пользователя
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка запроса');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { authFetch, loading, error };
};