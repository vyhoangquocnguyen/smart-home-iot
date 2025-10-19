// src/App.jsx
import React from "react";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="app bg-gray-100 min-h-screen">
      <header className="bg-blue-600 text-white p-4 text-center text-2xl font-bold">
        🏠 Smart Home Dashboard
      </header>
      <main className="p-4">
        <Dashboard />
      </main>
    </div>
  );
}
