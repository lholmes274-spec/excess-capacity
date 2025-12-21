"use client";
import React from "react";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const year = new Date().getFullYear();
  const { language, setLanguage } = useLanguage();

  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-6 mt-10 text-center text-sm border-t border-gray-700">
      <div className="container mx-auto px-4 space-y-2">
        <p>
          © {year}{" "}
          <span className="font-semibold text-white">Prosperity Hub</span>. All
          rights reserved.
        </p>

        <p className="text-xs text-gray-400">
          Operated by Prosperity Voyage Living Trust.
        </p>

        <p className="text-gray-400 hover:text-white transition">
          <a href="/terms">Terms of Service</a> •{" "}
          <a href="/privacy">Privacy Policy</a>
        </p>

        {/* Language Switch */}
        <div className="pt-2 text-xs">
          <button
            onClick={() => setLanguage("en")}
            className={`mr-2 ${
              language === "en" ? "text-white font-semibold" : "text-gray-400"
            }`}
          >
            English
          </button>
          |
          <button
            onClick={() => setLanguage("es")}
            className={`ml-2 ${
              language === "es" ? "text-white font-semibold" : "text-gray-400"
            }`}
          >
            Español
          </button>
        </div>
      </div>
    </footer>
  );
}
