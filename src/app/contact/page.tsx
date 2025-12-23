// src/app/contact/page.tsx
"use client";

import { useLanguage } from "../components/LanguageProvider";

export default function ContactPage() {
  const { language } = useLanguage();
  const isES = language === "es";

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">
        {isES ? "Contáctanos" : "Contact Us"}
      </h1>

      <p className="text-gray-600 max-w-md mb-6">
        {isES ? (
          <>
            ¿Tienes alguna pregunta o comentario? Nos encantaría saber de ti.
            Envíanos un correo electrónico a{" "}
            <a
              href="mailto:support@prosperityhub.app"
              className="text-blue-600 underline"
            >
              support@prosperityhub.app
            </a>
          </>
        ) : (
          <>
            Have a question or feedback? We’d love to hear from you. Send us an
            email at{" "}
            <a
              href="mailto:support@prosperityhub.app"
              className="text-blue-600 underline"
            >
              support@prosperityhub.app
            </a>
          </>
        )}
      </p>

      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        {isES ? "Volver al Inicio" : "Return to Home"}
      </a>
    </main>
  );
}
