import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck, Delete, CheckCircle2 } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus on the first empty digit or box 0 on open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setIsSuccess(false);
      setShowPassword(false);
      setShake(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const triggerVerification = (code: string) => {
    if (code === '101001') {
      setIsSuccess(true);
      setError(null);
      setTimeout(() => {
        onSuccess();
      }, 350);
    } else {
      setError('Mật khẩu không đúng. Vui lòng nhập lại!');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    if (cleaned.length === 1) {
      const updated = [...digits];
      updated[index] = cleaned;
      setDigits(updated);
      setError(null);

      // Auto advance to next box
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last digit entered: verify
        const fullCode = updated.join('');
        triggerVerification(fullCode);
      }
    } else if (cleaned.length > 1) {
      // Pasted multiple digits
      handlePasteValue(cleaned);
    }
  };

  const handlePasteValue = (pasted: string) => {
    const numericOnly = pasted.replace(/\D/g, '').slice(0, 6);
    if (!numericOnly) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < numericOnly.length; i++) {
      updated[i] = numericOnly[i];
    }
    setDigits(updated);
    setError(null);

    if (numericOnly.length === 6) {
      triggerVerification(numericOnly);
    } else {
      inputRefs.current[numericOnly.length]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      triggerVerification(digits.join(''));
    }
  };

  const handleKeypadPress = (num: string) => {
    const firstEmpty = digits.findIndex((d) => d === '');
    if (firstEmpty !== -1) {
      const updated = [...digits];
      updated[firstEmpty] = num;
      setDigits(updated);
      setError(null);

      if (firstEmpty === 5) {
        triggerVerification(updated.join(''));
      } else {
        inputRefs.current[firstEmpty + 1]?.focus();
      }
    }
  };

  const handleKeypadDelete = () => {
    const lastFilled = [...digits].reverse().findIndex((d) => d !== '');
    if (lastFilled !== -1) {
      const actualIndex = 5 - lastFilled;
      const updated = [...digits];
      updated[actualIndex] = '';
      setDigits(updated);
      inputRefs.current[actualIndex]?.focus();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-hidden overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-5 transition-transform duration-200 ${
          shake ? 'animate-bounce text-red-500' : ''
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-[#FF7A00] border border-amber-200/80 shadow-xs">
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 animate-pulse" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {isSuccess ? 'Xác thực thành công' : 'Xác thực Quản trị viên'}
          </h3>
          <p className="text-xs text-gray-500 max-w-[260px] mx-auto leading-relaxed">
            Nhập mã PIN 6 số để mở quyền quản lý sách và danh mục thể loại
          </p>
        </div>

        {/* 6 Digit PIN Boxes */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            {digits.map((digit, idx) => {
              const isFilled = digit !== '';
              const isCurrent = digits.findIndex((d) => d === '') === idx;

              return (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handlePasteValue(e.clipboardData.getData('text'));
                  }}
                  className={`w-11 h-12 text-center text-lg font-bold rounded-xl border transition-all cursor-text select-none focus:outline-none ${
                    error
                      ? 'border-red-400 bg-red-50/50 text-red-600'
                      : isSuccess
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : isFilled
                      ? 'border-gray-900 bg-gray-50/60 text-gray-900'
                      : isCurrent
                      ? 'border-amber-500 ring-2 ring-amber-500/20 bg-white text-gray-900'
                      : 'border-gray-200 bg-gray-50/30 text-gray-900 hover:border-gray-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Toggle show digits & Error message */}
          <div className="flex items-center justify-between px-1 text-[11px]">
            {error ? (
              <span className="text-red-500 font-medium">{error}</span>
            ) : (
              <span className="text-gray-400">Mã PIN gồm 6 số</span>
            )}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              {showPassword ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ẩn số</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hiện số</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Compact On-Screen Keypad for quick mobile & mouse input */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="py-2.5 text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="py-2.5 text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleKeypadDelete}
            className="py-2.5 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Xóa ký tự"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={() => triggerVerification(digits.join(''))}
          disabled={digits.some((d) => d === '') || isSuccess}
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gray-900 hover:bg-[#FF7A00] disabled:bg-gray-200 disabled:text-gray-400 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isSuccess ? 'Đang mở hệ thống...' : 'Mở bảng điều khiển'}</span>
        </button>
      </div>
    </div>
  );
};

