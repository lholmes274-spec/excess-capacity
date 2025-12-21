"use client";

import React from "react";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const year = new Date().getFullYear();
  const { language, setLanguage } = useLanguage();

  return (
    <footer className="bg-[#0f172a] text-gray-300 py-6 mt-10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between text-sm">
          {/* LEFT SIDE */}
          <p>
            © {year} ProsperityHub.app. All rights reserved.
          </p>

          {/* RIGHT SIDE – LANGUAGE TOGGLE */}
          <div className="text-xs">
            <button
              onClick={() => setLanguage("en")}
              className={`mr-2 ${
                language === "en"
                  ? "text-white font-semibold"
                  : "text-gray-400"
              }`}
            >
              English
            </button>
            |
            <button
              onClick={() => setLanguage("es")}
              className={`ml-2 ${
                language === "es"
                  ? "text-white font-semibold"
                  : "text-gray-400"
              }`}
            >
              Español
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
