import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, fetchWithAuth } from "./auth";
import "./News.css";

const NEWS_API_URL = "http://192.168.16.222:7002/api/v1";


const News = () => {
  const [news, setNews] = useState([]);
  const [newNews, setNewNews] = useState({ title: "", body: "", image: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const newsPerPage = 9;
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [expandedBodies, setExpandedBodies] = useState({});
  const navigate = useNavigate();

  // Проверка аутентификации
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const toggleBody = (newsId) => {
    setExpandedBodies((prev) => ({
      ...prev,
      [newsId]: !prev[newsId],
    }));
  };

  // Загрузка новостей
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchWithAuth(
        `${NEWS_API_URL}/news/get/?is_paginated=true&page=${currentPage}&limit=${newsPerPage}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data?.news)) {
        setNews(
          data.news.map((item) => ({
            ...item,
            image: item.image && item.image !== "absent" ? `data:image/png;base64,${item.image}` : null,
          }))
        );
        setTotalPages(data.total_pages || Math.ceil(data.total_count / newsPerPage) || 1);
      } else {
        throw new Error("Неверная структура данных");
      }
    } catch (err) {
      console.error("Ошибка загрузки новостей:", err);
      setError(err.message);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, newsPerPage]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Обработка ввода
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNews((prev) => ({ ...prev, [name]: value }));
  };

  // Обработка изображения
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      
      setNewNews((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Добавление новости
  const addNews = async () => {
  try {
    const formData = new FormData();
    formData.append("title", newNews.title.trim());
    formData.append("body", newNews.body.trim());
    if (newNews.image && newNews.image instanceof File) {
      formData.append("image", newNews.image, newNews.image.name);
    }

   

    const response = await fetch(`https://events-zisi.onrender.com/api/v1/news/add/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (response.status === 201) {
      await fetchNews();
      setNewNews({ title: "", body: "", image: null });
      setImagePreview(null);
      setModalOpen(false);
      alert("Новость успешно добавлена!");
    } else {
      let errorMessage = `Ошибка при добавлении новости (status: ${response.status})`;
      try {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        errorMessage = errorData.detail
          ? Array.isArray(errorData.detail)
            ? errorData.detail
                .map((error) => (typeof error === "string" ? error : `${error.loc?.join(".")}: ${error.msg}`))
                .join("\n")
            : errorData.detail
          : errorMessage;
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      throw new Error(errorMessage);
    }
  } catch (err) {
    console.error("Ошибка добавления:", err);
    alert(`Ошибка: ${err.message}`);
  }
};

  // Удаление новости
  const deleteNews = async (newsId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту новость?")) return;

    try {
      const response = await fetchWithAuth(`${NEWS_API_URL}/news/delete/${newsId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка при удалении (status: ${response.status})`);
      }

      if (news.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        await fetchNews();
      }
      alert("Новость успешно удалена!");
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Пагинация
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="news-container">
      <h1>Новости</h1>
      <button className="add-news-button" onClick={() => setModalOpen(true)}>
        Добавить новость
      </button>

      {/* Модальное окно добавления */}
      {modalOpen && (
        <div className={`modal ${modalOpen ? "open" : ""}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Добавить новость</h2>
              <button className="close-button" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="label-left">Заголовок</label>
              <input
                type="text"
                name="title"
                value={newNews.title}
                onChange={handleInputChange}
                required
              />
              <label className="label-left">Текст новости</label>
              <textarea
                name="body"
                value={newNews.body}
                onChange={handleInputChange}
                required
              />
              <label className="label-left">Изображение (необязательно)</label>
              <input type="file" accept="image/png" onChange={handleImageChange} />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Превью" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setModalOpen(false)}>
                Отмена
              </button>
              <button className="save-button" onClick={addNews}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Загрузка */}
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="error-message">
          Ошибка: {error} <button onClick={fetchNews}>Повторить</button>
        </div>
      )}

      {/* Список новостей */}
      {!loading && !error && (
        <>
          <div className="news-grid">
            {news.length > 0 ? (
              news.map((item) => (
                <div key={item.id} className="news-card">
                  {item.image && (
                    <div className="news-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                  <div className="news-content">
                    <h3>{item.title}</h3>
                    <button className="show-body-button" onClick={() => toggleBody(item.id)}>
                      {expandedBodies[item.id] ? "Скрыть текст" : "Показать текст"}
                    </button>
                    <div className={`news-body-container ${expandedBodies[item.id] ? "expanded" : ""}`}>
                      <p className="news-body">{item.body}</p>
                    </div>
                    <p className="news-date">{new Date(item.created_at).toLocaleDateString()}</p>
                    <button className="delete-button" onClick={() => deleteNews(item.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-news">Новостей не найдено</div>
            )}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                Назад
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={currentPage === i + 1 ? "active" : ""}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Вперед
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default News;