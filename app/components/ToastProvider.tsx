"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "16px",
          background: "#181818",
          color: "#fff",
          fontWeight: 700,
        },
        success: {
          iconTheme: {
            primary: "#fde047",
            secondary: "#181818",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
