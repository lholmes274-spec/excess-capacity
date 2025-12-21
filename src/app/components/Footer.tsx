"use client";

import React from "react";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const { language, setLanguage } = useLanguage();

  return (
    <footer className="bg-[#0f172a] text-gray-300 py-6 mt-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-3 items-center text-sm">
          {/* LEFT (empty spacer to keep center truly centered) */}
          <div />

          {/* CENTER */}
          <p className="text-center">
            © {new Date().getFullYear()} ProsperityHub.app. All rights reserved.
          </p>

          {/* RIGHT – Language Toggle */}
          <div className="text-xs text-right">
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
