import { Html5Qrcode } from "html5-qrcode";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth, getAccessToken } from "./auth";
import "./Camera.css";

const AuthQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [visitorHtml, setVisitorHtml] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraId, setCameraId] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const html5QrCodeRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = "http://192.168.16.222:7003/api/v1/visitors/verify/";

  const scannerConfig = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    supportedScanTypes: [{ type: 0 }],
  };

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("qrCodeContainer");

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices);
          setCameraId(devices[0].id);
        } else {
          setError("Камеры не найдены. Проверьте подключение камеры и разрешения.");
        }
      })
      .catch((err) => {
        setError(`Ошибка доступа к камере: ${err.name} - ${err.message}`);
      });

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        stopScanner();
      }
    };
  }, []);

  const retryCameraAccess = () => {
    setError("");
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices);
          setCameraId(devices[0].id);
        } else {
          setError("Камеры не найдены.");
        }
      })
      .catch((err) => {
        setError(`Ошибка доступа к камере: ${err.name} - ${err.message}`);
      });
  };

  const verifyVisitor = async (decodedText) => {
    setIsLoading(true);
    setError("");
    setVisitorHtml(null);

    try {
      const response = await fetchWithAuth(
        `${API_URL}?unique_string=${encodeURIComponent(decodedText)}`,
        { method: "GET" }
      );

      const contentType = response.headers.get("Content-Type");

      if (contentType?.includes("application/json")) {
        const data = await response.json();
        setVisitorHtml(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
      } else if (contentType?.includes("text/html")) {
        const text = await response.text();
        if (!text.trim()) {
          setVisitorHtml(`
            <div style="background-color: #e74c3c; color: white; padding: 10px; border-radius: 4px;">
              Посетитель не зарегистрирован
            </div>
          `);
        } else {
          setVisitorHtml(text);
        }
      } else {
        throw new Error(`Неожиданный тип ответа: ${contentType}`);
      }

      setShowModal(true);
    } catch (err) {
      setError(err.message || "Ошибка при верификации");
      setVisitorHtml(null);
      if (err.message.includes("авторизация") || err.message.includes("Токен отсутствует")) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startScanner = async () => {
    try {
      if (!getAccessToken()) {
        throw new Error("Пожалуйста, войдите в систему");
      }

      if (!cameraId) {
        throw new Error("Камера не выбрана");
      }

      const qrCodeSuccess = async (decodedText) => {
        await stopScanner();
        await verifyVisitor(decodedText);
      };

      await html5QrCodeRef.current.start(
        cameraId,
        scannerConfig,
        qrCodeSuccess,
        (errorMessage) => {
          setError("Ошибка сканирования QR: " + errorMessage);
        }
      );

      setIsScanning(true);
      setError("");
    } catch (err) {
      setError(err.message || "Ошибка запуска сканера");
      setIsScanning(false);
      if (err.message.includes("войдите")) {
        setTimeout(() => navigate("/login"), 2000);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        setError("Не удалось остановить сканер: " + err.message);
      }
    }
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const handleCameraChange = async (e) => {
    const newCameraId = e.target.value;
    setCameraId(newCameraId);
    if (isScanning) {
      await stopScanner();
      await startScanner();
    }
  };

  const resetScanner = () => {
    stopScanner();
    setVisitorHtml(null);
    setShowModal(false);
    setError("");
  };

  return (
    <div className="camera-wrapper">
      <div className="scanner-container">
        {availableCameras.length > 0 && (
          <div className="camera-selector">
            <label>Выберите камеру: </label>
            <select value={cameraId || ""} onChange={handleCameraChange} disabled={isScanning}>
              {availableCameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Камера ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="controls">
          <button
            onClick={toggleScanner}
            className={`button scan-button ${isScanning ? "scanning" : ""}`}
            disabled={isLoading}
          >
            {isScanning ? "Остановить" : "Начать сканирование"}
          </button>
        </div>

        <div id="qrCodeContainer" className="scanner-viewport" />

        {isLoading && <div className="loading">Проверка данных...</div>}

        {error && (
          <div className="error-message">
            {error}
            {error.includes("авторизация") || error.includes("Токен отсутствует") ? (
              <button onClick={() => navigate("/login")} className="button login-button">
                Войти
              </button>
            ) : (
              <button onClick={retryCameraAccess} className="button retry-button">
                Повторить попытку
              </button>
            )}
          </div>
        )}

        {visitorHtml && showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">Данные посетителя</h2>
              <iframe
                title="Данные посетителя"
                srcDoc={visitorHtml}
                style={{
                  width: "100%",
                  height: "400px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                }}
              />
              <button onClick={resetScanner} className="modal-close-button">
                Закрыть и сканировать следующего
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthQRScanner;
