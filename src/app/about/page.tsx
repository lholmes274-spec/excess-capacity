// src/app/about/page.tsx
"use client";

import { useLanguage } from "../components/LanguageProvider";

export default function AboutPage() {
  const { language } = useLanguage();
  const isES = language === "es";

  return (
    <main className="min-h-screen bg-white flex flex-col items-center text-center p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isES ? "Acerca de Prosperity Hub™" : "About Prosperity Hub™"}
      </h1>

      <p className="text-gray-700 max-w-2xl leading-relaxed text-lg">
        {isES ? (
          <>
            Prosperity Hub™ es un mercado dinámico de intercambio de capacidad excedente
            diseñado para ayudar a las personas a{" "}
            <strong>alquilar, compartir, vender y ganar con lo que ya poseen</strong>.
            Ya sea un espacio, una herramienta, un vehículo o una habilidad, nuestra misión
            es <strong>desbloquear valor oculto</strong> y empoderar a las comunidades para
            prosperar juntas.
          </>
        ) : (
          <>
            Prosperity Hub™ is a dynamic excess-capacity sharing marketplace designed
            to help people{" "}
            <strong>rent, share, sell, and earn from what they already own</strong>.
            Whether it’s a space, a tool, a vehicle, or a skill, our mission is to
            <strong> unlock hidden value</strong> and empower communities to thrive together.
          </>
        )}
      </p>

      <p className="text-gray-700 max-w-2xl leading-relaxed text-lg mt-6">
        {isES ? (
          <>
            Diseñado con flexibilidad en mente, Prosperity Hub™ permite a los usuarios
            publicar una amplia variedad de artículos y servicios — desde alquileres hasta
            productos en venta — brindando a todos la libertad de ganar de la manera que
            mejor se adapte a sus necesidades. Nuestra plataforma ofrece un entorno simple
            y seguro donde las personas pueden crear nuevas oportunidades, apoyarse entre
            sí y hacer crecer la prosperidad local.
          </>
        ) : (
          <>
            Built with flexibility in mind, Prosperity Hub™ allows users to list a
            wide range of items and services — from rentals to for-sale items — giving
            everyone the freedom to earn in the way that works best for them. Our
            platform provides a simple, secure environment where people can create new
            opportunities, support each other, and grow local prosperity.
          </>
        )}
      </p>
    </main>
  );
}
