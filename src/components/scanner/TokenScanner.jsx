import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Upload, CheckCircle2 } from 'lucide-react';

export const TokenScanner = ({ onScanSuccess, onScanError }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraState, setCameraState] = useState('CAMERA_READY'); // CAMERA_READY, SCANNING, ERROR
  const [errorMessage, setErrorMessage] = useState('');
  const qrScannerRef = useRef(null);

  const startScanner = async () => {
    setErrorMessage('');
    setCameraState('SCANNING');

    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode('qr-reader-element');
      }

      await qrScannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (decodedText) => {
          console.log('[QR Code Scanned]:', decodedText);
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          // ignore transient scan frame read failures
        }
      );
      setIsCameraActive(true);
    } catch (err) {
      console.error('[Camera Access Error]:', err);
      setCameraState('ERROR');
      setIsCameraActive(false);
      setErrorMessage('Camera access unavailable or permission denied.');
      if (onScanError) onScanError(err);
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && isCameraActive) {
      try {
        await qrScannerRef.current.stop();
        setIsCameraActive(false);
        setCameraState('CAMERA_READY');
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-file-temp');
      const result = await html5Qrcode.scanFile(file, true);
      if (onScanSuccess) onScanSuccess(result);
    } catch (err) {
      alert('Could not decode QR code from selected image.');
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current && isCameraActive) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, [isCameraActive]);

  return (
    <div className="card">
      <div className="card-title flex items-center justify-between">
        <span>Scan Customer QR Token</span>
        <span 
          style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            borderRadius: 12,
            backgroundColor: isCameraActive ? '#ECFDF5' : '#F1F5F9',
            color: isCameraActive ? '#059669' : '#64748B'
          }}
        >
          {isCameraActive ? '● Camera Active' : cameraState === 'ERROR' ? '✕ Camera Access Denied' : 'Camera Ready'}
        </span>
      </div>
      <div className="card-subtitle">
        Position the customer QR token inside the frame to verify transaction HMAC signature.
      </div>

      <div className="scanner-container">
        <div id="qr-reader-element" style={{ width: '100%', height: '100%' }} />
        <div id="qr-reader-file-temp" style={{ display: 'none' }} />

        {/* Framing & Laser Overlay */}
        {isCameraActive && (
          <div className="scanner-frame-overlay">
            <div className="corner-bracket corner-tl" />
            <div className="corner-bracket corner-tr" />
            <div className="corner-bracket corner-bl" />
            <div className="corner-bracket corner-br" />
            <div className="scan-line" />
          </div>
        )}

        {!isCameraActive && cameraState !== 'ERROR' && (
          <div className="flex flex-col items-center gap-3" style={{ color: '#94A3B8' }}>
            <Camera size={48} style={{ opacity: 0.6 }} />
            <p style={{ fontSize: '0.85rem' }}>Camera Stream Standby</p>
          </div>
        )}

        {cameraState === 'ERROR' && (
          <div className="flex flex-col items-center gap-3" style={{ color: '#EF4444', padding: '1.5rem', textAlign: 'center' }}>
            <CameraOff size={44} />
            <p style={{ fontSize: '0.85rem' }}>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: '1.25rem' }}>
        {!isCameraActive ? (
          <button className="btn btn-primary" onClick={startScanner}>
            <Camera size={16} />
            <span>Start Camera</span>
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={stopScanner}>
            <CameraOff size={16} />
            <span>Stop Camera</span>
          </button>
        )}

        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          <Upload size={16} />
          <span>Upload Image</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
};
