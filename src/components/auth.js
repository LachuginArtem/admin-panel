// auth.js — вспомогательные функции
export const isAuthenticated = () => !!localStorage.getItem('accessToken');

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const fetchWithAuth = async (url, options = {}) => {
  let tempAccessToken = getAccessToken();
  let tempRefreshToken = getRefreshToken()
  // Проверяем наличие токена
  if (!tempAccessToken) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
  }

  // Формируем заголовки, сохраняя Content-Type из options или задавая по умолчанию
  const headers = {
     // По умолчанию для большинства запросов
    ...(options.headers || {}), // Сохраняем переданные заголовки
   "Content-Type": "application/json",
        "X-Access-Token": tempAccessToken,
        "X-Refresh-Token": tempRefreshToken, // Добавляем токен
  };

  // Выполняем исходный запрос
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Обрабатываем 401 ошибку
  if (response.status === 401) {
    const refreshToken = getRefreshToken();

    // Проверяем наличие refreshToken
    if (!refreshToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Refresh токен отсутствует. Пожалуйста, войдите в систему.');
    }

    try {
      const refreshRes = await fetch('https://registration-s6rk.onrender.com/api/v1/authorizations/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      // Проверяем, что ответ содержит JSON
      const contentType = refreshRes.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Ответ сервера не в формате JSON');
      }

      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.access) {
        // Сохраняем новый accessToken
        localStorage.setItem('accessToken', refreshData.access);
        tempAccessToken = refreshData.access;
        
        // Повторяем исходный запрос с новым токеном
        response = await fetch(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            "X-Access-Token": tempAccessToken,
        "X-Refresh-Token": tempRefreshToken, // Добавляем токен
          },
        });
      } else {
        // Если обновление не удалось, очищаем токены и перенаправляем
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw new Error(refreshData.message || 'Не удалось обновить токен');
      }
    } catch (err) {
      console.error('Ошибка при обновлении токена:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Ошибка при обновлении токена: ' + err.message);
    }
  }

  return response;
};