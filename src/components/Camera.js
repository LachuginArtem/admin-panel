import { Html5Qrcode } from "html5-qrcode";
import React, { useState, useEffect, useRef } from "react";
import "./Camera.css";

function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [error, setError] = useState("");
  const [cameraId, setCameraId] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const html5QrCodeRef = useRef(null);

  // Вынесем конфигурацию в константу вне useEffect
  const scannerConfig = { 
    fps: 10, 
    qrbox: { width: 250, height: 250 },
    rememberLastUsedCamera: true,
    supportedScanTypes: [{ type: 0 }] // Заменили Html5QrcodeScanType.SCAN_TYPE_CAMERA на числовой эквивалент
  };

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("qrCodeContainer");

    // Get available cameras on mount
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setAvailableCameras(devices);
          setCameraId(devices[0].id); // Default to first camera
        }
      })
      .catch(err => {
        console.error("Camera error:", err);
        setError("Could not access camera. Please check permissions.");
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      if (!cameraId) {
        throw new Error("No camera selected");
      }

      const qrCodeSuccess = (decodedText) => {
        setQrMessage(decodedText);
        setIsScanning(false);
        stopScanner();
      };

      await html5QrCodeRef.current.start(
        cameraId, 
        scannerConfig, // Используем scannerConfig вместо config
        qrCodeSuccess,
        undefined // verbose logging
      );
      
      setIsScanning(true);
      setError("");
    } catch (err) {
      console.error("Scanner error:", err);
      setError(err.message);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => {
          console.log("Scanner stopped");
          setIsScanning(false);
        })
        .catch(err => {
          console.error("Stop error:", err);
          setError("Failed to stop scanner");
        });
    }
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const handleCameraChange = (e) => {
    setCameraId(e.target.value);
    if (isScanning) {
      stopScanner().then(startScanner);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrMessage)
      .then(() => alert("Copied to clipboard!"))
      .catch(err => setError("Failed to copy"));
  };

  return (
    <div className="scanner-container">
      <h1>QR Code Scanner</h1>
      
      {availableCameras.length > 1 && (
        <div className="camera-selector">
          <label htmlFor="camera-select">Select Camera: </label>
          <select 
            id="camera-select" 
            value={cameraId || ""}
            onChange={handleCameraChange}
            disabled={isScanning}
          >
            {availableCameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div id="qrCodeContainer" className="scanner-viewport" />
      
      {error && <div className="error-message">{error}</div>}
      
      {qrMessage && (
        <div className="qr-result">
          <h3>Scanned Result:</h3>
          <p>{qrMessage}</p>
          <button onClick={copyToClipboard} className="copy-button">
            Copy to Clipboard
          </button>
        </div>
      )}

      <div className="controls">
        <button 
          onClick={toggleScanner} 
          className={`scan-button ${isScanning ? 'scanning' : ''}`}
        >
          {isScanning ? "Stop Scanning" : "Start Scanning"}
        </button>
        
        {qrMessage && (
          <button 
            onClick={() => setQrMessage("")} 
            className="clear-button"
          >
            Clear Result
          </button>
        )}
      </div>
    </div>
  );
}

export default App;