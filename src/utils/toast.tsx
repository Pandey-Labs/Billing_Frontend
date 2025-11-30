// Toast utility with fallback when react-toastify is not installed
// Install react-toastify with: npm install react-toastify
// After installation, uncomment the import below and remove the fallback code
import React from 'react';

// Fallback toast implementation (used when react-toastify is not installed)
const fallbackToast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
  },
  error: (message: string) => {
    console.error('❌ Error:', message);
  },
  info: (message: string) => {
    console.info('ℹ️ Info:', message);
  },
  warning: (message: string) => {
    console.warn('⚠️ Warning:', message);
  },
};

// Fallback ToastContainer component (accepts props but renders nothing)
const FallbackToastContainer: React.FC<any> = () => null;

// Uncomment these lines after installing react-toastify:
// import { toast as toastifyToast, ToastContainer as ToastifyContainer } from 'react-toastify';
// export const toast = toastifyToast;
// export const ToastContainer = ToastifyContainer;

// Temporary exports using fallback (remove after installing react-toastify)
export const toast = fallbackToast;
export const ToastContainer = FallbackToastContainer;

