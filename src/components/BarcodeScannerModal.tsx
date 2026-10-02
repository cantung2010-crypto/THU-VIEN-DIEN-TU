import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer,
  HTMLCanvasElementLuminanceSource,
} from '@zxing/library';
import {
  X,
  Camera,
  AlertCircle,
  RefreshCw,
  Upload,
  Sparkles,
  ScanLine,
  Zap,
  ZapOff,
  SwitchCamera,
  Barcode,
  ArrowRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (isbn: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [manualIsbn, setManualIsbn] = useState('');
  const [availableCameras, setAvailableCameras] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasDetectedRef = useRef(false);
  const isDecodingRef = useRef(false);
  const zxingReaderRef = useRef<MultiFormatReader | null>(null);
  const barcodeDetectorRef = useRef<any>(null);

  // Initialize ZXing reader with full book barcode formats
  const getZxingReader = useCallback(() => {
    if (!zxingReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new MultiFormatReader();
      reader.setHints(hints);
      zxingReaderRef.current = reader;
    }
    return zxingReaderRef.current;
  }, []);

  // Initialize Hardware BarcodeDetector if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const supported = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'];
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: supported });
      } catch (e) {
        console.warn('BarcodeDetector initialization:', e);
      }
    }
  }, []);

  // Clean raw scanned string to valid Library Code or ISBN / barcode digits
  const cleanBarcode = useCallback((raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();

    // Priority 0: Match new library code format (e.g. LIB-18324, MS-10023, BOOK-01)
    const matchLib = trimmed.match(/(?:LIB|MS|BOOK)[-_]?[0-9A-Z]{2,12}/i);
    if (matchLib) {
      return matchLib[0].toUpperCase().replace('_', '-');
    }

    // Priority 1: Match standard ISBN-13 starting with 978 or 979
    const match13 = trimmed.match(/(?:97[89][-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9]|97[89][0-9]{10})/);
    if (match13) return match13[0].replace(/[^0-9]/g, '');

    // Priority 2: Match Vietnam GS1 barcode 893 (books & publications published in Vietnam)
    const match893 = trimmed.match(/(?:893[-\s]?[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9]|893[0-9]{10})/);
    if (match893) return match893[0].replace(/[^0-9]/g, '');

    // Priority 3: Match standard 10-digit ISBN-10
    const match10 = trimmed.match(/(?:[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X]|[0-9]{9}[0-9X])/i);
    if (match10 && match10[0].replace(/[^0-9X]/gi, '').length === 10) {
      return match10[0].replace(/[^0-9X]/gi, '').toUpperCase();
    }

    // Priority 4: Match sequence of 4 to 14 digits
    const matchDigits = trimmed.match(/\d{4,14}/);
    if (matchDigits) return matchDigits[0];

    // Priority 5: Alphanumeric code (minimum 4 characters)
    const alnum = trimmed.replace(/[^0-9A-Z-]/gi, '').toUpperCase();
    if (alnum.length >= 4) return alnum;

    return trimmed;
  }, []);

  // Stop camera tracks cleanly
  const stopAllScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }

    setHasTorch(false);
    setIsTorchOn(false);
  }, []);

  // Instant trigger when barcode is recognized - immediately outputs code
  const handleImmediateDetection = useCallback(
    (rawCode: string) => {
      if (hasDetectedRef.current) return;
      const clean = cleanBarcode(rawCode);
      if (!clean || clean.length < 8) return;

      hasDetectedRef.current = true;

      // Audio & Haptic Feedback
      if (soundEnabled) {
        try {
          sounds.playScanSuccess();
        } catch {}
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([70, 40, 110]);
        } catch {}
      }

      stopAllScanning();
      onDetected(clean);
    },
    [cleanBarcode, onDetected, soundEnabled, stopAllScanning]
  );

  // Synchronous ZXing multi-format decoding with both GlobalHistogram & Hybrid binarizers
  const decodeCanvasWithZXing = useCallback(
    (canvas: HTMLCanvasElement): string | null => {
      try {
        const reader = getZxingReader();
        const lumSource = new HTMLCanvasElementLuminanceSource(canvas);

        // Pass 1: GlobalHistogramBinarizer (superior for 1D bar codes like EAN-13 & ISBN)
        try {
          const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(lumSource));
          const res = reader.decode(bitmap);
          if (res && res.getText()) {
            const clean = cleanBarcode(res.getText());
            if (clean && clean.length >= 4) return clean;
          }
        } catch {}

        // Pass 2: HybridBinarizer (for QR codes and colored / noisy backgrounds)
        try {
          const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
          const res = reader.decode(bitmap);
          if (res && res.getText()) {
            const clean = cleanBarcode(res.getText());
            if (clean && clean.length >= 4) return clean;
          }
        } catch {}
      } catch {}
      return null;
    },
    [cleanBarcode, getZxingReader]
  );

  // High-performance client-side multi-pass barcode decoding
  const decodeFrameClientSide = useCallback(
    async (source: HTMLCanvasElement | HTMLVideoElement): Promise<string | null> => {
      // 1. Hardware BarcodeDetector API (fastest, GPU-accelerated on Chrome)
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(source);
          if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
            const clean = cleanBarcode(barcodes[0].rawValue);
            if (clean && clean.length >= 4) return clean;
          }
        } catch {}
      }

      // Convert to working canvas
      let baseCanvas: HTMLCanvasElement;
      if (source instanceof HTMLCanvasElement) {
        baseCanvas = source;
      } else {
        baseCanvas = (window as any).__scanCanvas;
        if (!baseCanvas) {
          baseCanvas = document.createElement('canvas');
          (window as any).__scanCanvas = baseCanvas;
        }
        const vw = source.videoWidth;
        const vh = source.videoHeight;
        if (!vw || !vh) return null;

        const targetW = Math.min(vw, 800);
        const targetH = Math.round((vh * targetW) / vw);
        baseCanvas.width = targetW;
        baseCanvas.height = targetH;
        const bCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
        if (!bCtx) return null;
        bCtx.drawImage(source, 0, 0, targetW, targetH);
      }

      // 2. Center-Crop Pass (acts as high-magnification lens for book barcodes)
      try {
        const cw = Math.floor(baseCanvas.width * 0.7);
        const ch = Math.floor(baseCanvas.height * 0.6);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cw;
        cropCanvas.height = ch;
        const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
        if (cropCtx) {
          cropCtx.drawImage(
            baseCanvas,
            Math.floor((baseCanvas.width - cw) / 2),
            Math.floor((baseCanvas.height - ch) / 2),
            cw,
            ch,
            0,
            0,
            cw,
            ch
          );
          const cropResult = decodeCanvasWithZXing(cropCanvas);
          if (cropResult) return cropResult;
        }
      } catch {}

      // 3. Full-frame ZXing pass
      const directResult = decodeCanvasWithZXing(baseCanvas);
      if (directResult) return directResult;

      // 4. 90-degree Rotation Pass (for book spines and rotated covers)
      try {
        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = baseCanvas.height;
        rotCanvas.height = baseCanvas.width;
        const rotCtx = rotCanvas.getContext('2d', { willReadFrequently: true });
        if (rotCtx) {
          rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rotCtx.rotate(Math.PI / 2);
          rotCtx.drawImage(baseCanvas, -baseCanvas.width / 2, -baseCanvas.height / 2);
          const rotResult = decodeCanvasWithZXing(rotCanvas);
          if (rotResult) return rotResult;
        }
      } catch {}

      return null;
    },
    [cleanBarcode, decodeCanvasWithZXing]
  );

  // Start WebRTC Camera Stream directly
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        setIsStarting(true);
        setError(null);
        hasDetectedRef.current = false;

        stopAllScanning();

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh trực tiếp.');
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Build flexible constraints that work on 100% of devices
        const constraintsList: MediaStreamConstraints[] = [];

        if (deviceId && deviceId.trim()) {
          constraintsList.push({
            audio: false,
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        }

        // Standard adaptive constraints with soft ideal preferences
        if (isMobile) {
          constraintsList.push({
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          constraintsList.push({
            audio: false,
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 1280 },
            },
          });
        } else {
          // On laptop/desktop: try user/webcam first
          constraintsList.push({
            audio: false,
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          constraintsList.push({
            audio: false,
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
            },
          });
        }

        // Universal fallback
        constraintsList.push({
          audio: false,
          video: true,
        });

        let activeStream: MediaStream | null = null;
        let lastErr: any = null;

        for (const c of constraintsList) {
          try {
            activeStream = await navigator.mediaDevices.getUserMedia(c);
            if (activeStream) break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (!activeStream) {
          throw lastErr || new Error('Không thể nhận luồng hình ảnh từ máy ảnh.');
        }

        streamRef.current = activeStream;

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.setAttribute('playsinline', 'true');
          try {
            await videoRef.current.play();
          } catch (pErr) {
            console.warn('Video auto-play interrupted:', pErr);
          }
        }

        // Camera is now actively streaming!
        setIsStarting(false);

        // Check torch capability
        try {
          const track = activeStream.getVideoTracks()[0];
          const caps: any = track?.getCapabilities?.() || {};
          if (caps.torch) {
            setHasTorch(true);
          }
        } catch {}

        // Enumerate other cameras for switching dropdown
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          if (videoDevs.length > 0) {
            setAvailableCameras(
              videoDevs.map((d, idx) => ({
                deviceId: d.deviceId,
                label: d.label || `Camera ${idx + 1}`,
              }))
            );
          }
        } catch {}

        // Start High-Speed Real-time Recognition Loop (Runs every 60ms)
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = setInterval(async () => {
          if (hasDetectedRef.current || isDecodingRef.current) return;
          const v = videoRef.current;
          if (!v || v.paused || v.ended || v.videoWidth === 0) return;

          isDecodingRef.current = true;
          try {
            const detectedCode = await decodeFrameClientSide(v);
            if (detectedCode && !hasDetectedRef.current) {
              handleImmediateDetection(detectedCode);
            }
          } catch {
            // Ignore frame scan miss
          } finally {
            isDecodingRef.current = false;
          }
        }, 60);
      } catch (err: any) {
        console.warn('Lỗi kết nối camera:', err);
        setIsStarting(false);

        let userMsg = 'Không thể mở máy ảnh trên thiết bị này.';
        const errStr = String(err?.message || err || '');

        if (
          err?.name === 'NotAllowedError' ||
          errStr.includes('Permission') ||
          errStr.includes('denied') ||
          errStr.includes('NotAllowedError')
        ) {
          userMsg = 'Trình duyệt chưa được cấp quyền camera. Vui lòng bấm "Kích hoạt Camera" hoặc Cho phép (Allow) máy ảnh.';
        } else if (
          err?.name === 'NotFoundError' ||
          err?.name === 'DevicesNotFoundError' ||
          errStr.includes('not found') ||
          errStr.includes('no camera')
        ) {
          userMsg = 'Không tìm thấy thiết bị máy ảnh. Bạn hãy nhập trực tiếp mã ISBN bên dưới hoặc bấm chọn sách mẫu.';
        } else if (
          err?.name === 'NotReadableError' ||
          err?.name === 'TrackStartError' ||
          errStr.includes('in use')
        ) {
          userMsg = 'Camera đang bị ứng dụng khác chiếm dụng. Vui lòng tắt ứng dụng kia rồi bấm Thử lại.';
        } else if (errStr) {
          userMsg = `Chưa mở được camera. Hãy bấm Thử lại hoặc chọn tải ảnh / nhập số ISBN.`;
        }

        setError(userMsg);
      }
    },
    [decodeFrameClientSide, handleImmediateDetection, stopAllScanning]
  );

  // Toggle flashlight
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // Instant Snapshot & Server AI OCR Fallback
  const handleCaptureAndAnalyze = async () => {
    const v = videoRef.current;
    if (!v || v.videoWidth === 0) return;

    setIsAnalyzing(true);
    setAnalysisStep('Đang chụp khung hình độ nét cao...');
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Không thể khởi tạo canvas.');

      ctx.drawImage(v, 0, 0);
      const snapshotBase64 = canvas.toDataURL('image/jpeg', 0.9);

      setAnalysisStep('Đang giải mã quang học đa hướng...');

      // 1. Client-side decode
      const clientDetected = await decodeFrameClientSide(canvas);
      if (clientDetected) {
        setIsAnalyzing(false);
        handleImmediateDetection(clientDetected);
        return;
      }

      // 2. High-precision Server AI OCR
      setAnalysisStep('Đang dùng AI OCR đọc dãy số ISBN...');
      const res = await fetch('/api/barcode/read-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: snapshotBase64 }),
      });
      const data = await res.json();

      if (data.success && data.isbn) {
        setIsAnalyzing(false);
        handleImmediateDetection(data.isbn);
      } else {
        throw new Error(data.message || 'Chưa đọc được mã vạch. Vui lòng căn chỉnh lại gần hơn.');
      }
    } catch (err: any) {
      setError(err?.message || 'Chưa nhận diện được mã từ khung hình này.');
      setIsAnalyzing(false);
    }
  };

  // Process photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep('Đang đọc hình ảnh tải lên...');

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const clientDetected = await decodeFrameClientSide(canvas);
        if (clientDetected) {
          URL.revokeObjectURL(objectUrl);
          setIsAnalyzing(false);
          handleImmediateDetection(clientDetected);
          return;
        }
      }

      // Fallback to server AI OCR
      setAnalysisStep('Đang trích xuất mã vạch bằng AI...');
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const b64 = await base64Promise;

      const res = await fetch('/api/barcode/read-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64 }),
      });
      const data = await res.json();
      if (data.success && data.isbn) {
        setIsAnalyzing(false);
        handleImmediateDetection(data.isbn);
      } else {
        throw new Error('Không tìm thấy dãy số mã vạch trên ảnh này.');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi nhận diện hình ảnh.');
      setIsAnalyzing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle manual form submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanBarcode(manualIsbn);
    if (clean && clean.length >= 4) {
      handleImmediateDetection(clean);
    } else {
      setError('Mã tra cứu cần có ít nhất 4 ký tự (ví dụ: LIB-18324 hoặc 9786042183246).');
    }
  };

  const sampleBarcodes = [
    { label: 'Hoàng Tử Bé', isbn: '9786042183246', libCode: 'LIB-18324' },
    { label: 'Dế Mèn', isbn: '9786042189910', libCode: 'LIB-18991' },
    { label: 'Sapiens', isbn: '9786045656105', libCode: 'LIB-65610' },
    { label: 'Cosmos', isbn: '9786047771233', libCode: 'LIB-77123' },
    { label: 'AI Superpowers', isbn: '9786045892341', libCode: 'LIB-89234' },
    { label: 'Truyện Kiều', isbn: '9786042171922', libCode: 'LIB-17192' },
  ];

  // Lifecycle control
  useEffect(() => {
    if (isOpen) {
      hasDetectedRef.current = false;
      setError(null);
      setZoomLevel(1.0);

      // Start camera promptly
      const timer = setTimeout(() => {
        startCamera(selectedCameraId);
      }, 50);

      return () => {
        clearTimeout(timer);
        stopAllScanning();
      };
    } else {
      stopAllScanning();
      setError(null);
      setIsStarting(true);
      setIsAnalyzing(false);
    }
  }, [isOpen, selectedCameraId, startCamera, stopAllScanning]);

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden overscroll-contain"
    >
      <div
        id="barcode-scanner-card"
        className="relative w-full max-w-xl bg-white dark:bg-[#151522] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-white/95 dark:bg-[#151522]/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                Quét mã vạch & Nhận diện ISBN
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Nhận diện trực tiếp & tự động tra cứu tức thì
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                soundEnabled
                  ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title={soundEnabled ? 'Tắt âm thanh bíp' : 'Bật âm thanh bíp'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Flashlight toggle */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300 ring-2 ring-amber-400'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
                title={isTorchOn ? 'Tắt đèn trợ sáng' : 'Bật đèn trợ sáng'}
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current text-amber-500" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                stopAllScanning();
                onClose();
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 flex flex-col items-center flex-1 overflow-y-auto overscroll-contain space-y-3.5">
          <div className="w-full space-y-3">
            {/* Native Video Viewfinder Container */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center shadow-2xl border border-gray-800">
              <video
                ref={videoRef}
                className="w-full h-full object-cover transition-transform duration-200 origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
                playsInline
                autoPlay
                muted
              />

              {/* Reticle HUD & Laser Scanline */}
              {!isStarting && !error && !isAnalyzing && (
                <div className="pointer-events-none absolute inset-x-4 sm:inset-x-8 top-1/2 -translate-y-1/2 h-36 sm:h-44 border-2 border-orange-400/90 rounded-2xl flex items-center justify-center overflow-hidden z-10 shadow-[0_0_25px_rgba(249,115,22,0.25)]">
                  {/* Sweeping Laser scanline */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_18px_#f59e0b] animate-pulse absolute top-1/2 -translate-y-1/2" />

                  {/* High-Tech Corner Guides */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-orange-400 rounded-tl-sm shadow-[0_0_8px_#f97316]" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-orange-400 rounded-tr-sm shadow-[0_0_8px_#f97316]" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-orange-400 rounded-bl-sm shadow-[0_0_8px_#f97316]" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-orange-400 rounded-br-sm shadow-[0_0_8px_#f97316]" />

                  {/* Live Prompt */}
                  <span className="absolute bottom-2.5 bg-black/80 text-orange-200 text-[10px] font-mono font-medium px-3 py-1 rounded-full backdrop-blur-md border border-orange-500/40 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Căn mã vạch vào khung • Quét là tra ra sách ngay!
                  </span>
                </div>
              )}

              {/* Viewfinder Top Controls Overlay */}
              {!isStarting && !error && (
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-15 pointer-events-auto">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>CAMERA ĐANG QUÉT TRỰC TIẾP</span>
                  </div>

                  {/* Zoom Presets */}
                  <div className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-1.5 py-1 rounded-full border border-white/15">
                    {[1.0, 1.4, 1.8].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZoomLevel(z)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          zoomLevel === z
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Starting State Overlay */}
              {isStarting && !error && (
                <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center text-white p-4 z-20 space-y-3">
                  <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-gray-100">Đang bật máy ảnh...</p>
                    <p className="text-[11px] text-gray-400">Đang kích hoạt cảm biến lấy nét tự động</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera(selectedCameraId)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Kích hoạt Camera Ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium text-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>Tải ảnh mã vạch</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Analyzing State Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-5 text-center space-y-2.5 z-20">
                  <Sparkles className="w-10 h-10 text-amber-400 animate-spin mb-1" />
                  <p className="text-sm font-bold text-white">{analysisStep}</p>
                  <p className="text-xs text-amber-200">Đang giải mã và tra cứu thông tin tác phẩm...</p>
                </div>
              )}

              {/* Error State Overlay */}
              {error && !isAnalyzing && (
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center space-y-3 z-20">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed max-w-xs font-medium">{error}</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera(selectedCameraId)}
                      className="px-4 py-2 bg-white text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Bật lại Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl hover:brightness-105 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải ảnh mã vạch</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10 w-full max-w-xs">
                    <p className="text-[11px] text-gray-400 mb-1.5 font-medium">Bấm chọn nhanh sách mẫu để thử ngay:</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {sampleBarcodes.slice(0, 4).map((item) => (
                        <button
                          key={item.isbn}
                          type="button"
                          onClick={() => handleImmediateDetection(item.isbn)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Viewfinder Controls Bar */}
            <div className="w-full flex items-center justify-between gap-2">
              {availableCameras.length > 1 && !error ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10">
                  <SwitchCamera className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-transparent font-medium text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
                  >
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.deviceId || idx} value={cam.deviceId} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        {cam.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                  <Camera className="w-3.5 h-3.5 text-orange-500" />
                  <span>Ống kính AI bắt mã siêu tốc</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Instant Snapshot Shutter Button */}
                {!isStarting && !error && (
                  <button
                    type="button"
                    onClick={handleCaptureAndAnalyze}
                    disabled={isAnalyzing}
                    className="py-1.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Chụp quét ngay</span>
                  </button>
                )}

                {/* Upload Photo Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="py-1.5 px-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 active:scale-95 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Book Barcodes */}
            <div className="w-full bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-500/20 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-orange-500" />
                  Thử nghiệm quét nhanh (Mã mới & Mã ISBN):
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Bấm 1 chạm là mở sách ngay</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sampleBarcodes.map((item) => (
                  <div key={item.isbn} className="flex items-center rounded-lg border border-orange-200/60 dark:border-white/10 bg-white dark:bg-[#1f1f2e] overflow-hidden shadow-2xs text-xs">
                    <button
                      type="button"
                      onClick={() => handleImmediateDetection(item.libCode)}
                      title={`Quét mã thư viện mới: ${item.libCode}`}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-orange-500 hover:text-white text-orange-800 dark:text-orange-300 font-mono font-bold text-[11px] transition-colors cursor-pointer border-r border-orange-200/50 dark:border-white/10"
                    >
                      {item.libCode}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImmediateDetection(item.isbn)}
                      title={`Quét mã ISBN: ${item.isbn}`}
                      className="px-2 py-1 hover:bg-orange-500 hover:text-white text-gray-700 dark:text-gray-200 font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{item.label}</span>
                      <span className="text-[9px] opacity-50 font-mono">({item.isbn.slice(-4)})</span>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                💡 Cả 2 mã (Mã mới LIB-... hoặc Mã vạch gốc) đều đã liên kết: quét bất kỳ mã nào đều mở ra đúng cuốn sách đó!
              </p>
            </div>

            {/* Manual ISBN Input Form */}
            <form onSubmit={handleManualSubmit} className="w-full pt-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualIsbn}
                    onChange={(e) => {
                      setManualIsbn(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Nhập mã mới (VD: LIB-18324) hoặc mã ISBN (VD: 9786042183246)..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono"
                  />
                  <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={!manualIsbn.trim()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <span>Tra cứu</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
