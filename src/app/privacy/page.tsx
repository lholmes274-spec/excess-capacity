"use client";

import React from "react";
import { useLanguage } from "../components/LanguageProvider";

export default function PrivacyClient() {
  const { language } = useLanguage();
  const isES = language === "es";

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">
        {isES ? "Política de Privacidad" : "Privacy Policy"}
      </h1>

      <p className="mb-4 text-sm text-gray-500">
        {isES
          ? "Última actualización: 19 de noviembre de 2025"
          : "Last updated: November 19, 2025"}
      </p>

      <p className="mb-4">
        {isES ? (
          <>
            En <strong>Prosperity Hub</strong>, tu privacidad es importante para
            nosotros. Esta Política de Privacidad explica cómo recopilamos,
            usamos, almacenamos y protegemos tu información personal cuando
            utilizas nuestro sitio web y servicios relacionados, los cuales son
            propiedad y están operados por{" "}
            <strong>Prosperity Voyage LLC</strong>, una compañía de
            responsabilidad limitada registrada en Luisiana.
          </>
        ) : (
          <>
            At <strong>Prosperity Hub</strong>, your privacy is important to us.
            This Privacy Policy explains how we collect, use, store, and protect
            your personal information when you use our website and related
            services, which are owned and operated by{" "}
            <strong>Prosperity Voyage LLC</strong>, a Louisiana limited liability
            company.
          </>
        )}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES ? "1. Información que recopilamos" : "1. Information We Collect"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Podemos recopilar información personal que proporciones voluntariamente, como tu nombre, correo electrónico y detalles de pago. También recopilamos automáticamente datos técnicos como el tipo de navegador, la dirección IP, la información del dispositivo y estadísticas generales de uso."
          : "We may collect personal information you voluntarily provide, such as your name, email address, and payment details. We also automatically collect technical data such as browser type, IP address, device information, and general usage statistics."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES
          ? "2. Cómo usamos tu información"
          : "2. How We Use Your Information"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Utilizamos tu información para operar y mejorar nuestros servicios, verificar cuentas, procesar transacciones, comunicar actualizaciones, mejorar la seguridad y brindar soporte al cliente. No vendemos ni alquilamos tus datos personales a terceros."
          : "We use your information to operate and improve our services, verify accounts, process transactions, communicate updates, enhance security, and provide customer support. We do not sell or rent your personal data to third parties."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES ? "3. Protección de datos" : "3. Data Protection"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Implementamos medidas técnicas y organizativas razonables para ayudar a proteger tu información contra accesos no autorizados, alteraciones o divulgaciones. Sin embargo, ningún sistema en línea es completamente seguro y no podemos garantizar seguridad absoluta."
          : "We implement reasonable technical and organizational safeguards to help protect your data from unauthorized access, alteration, or disclosure. However, no online system is completely secure, and we cannot guarantee absolute security."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES
          ? "4. Servicios de terceros"
          : "4. Third-Party Services"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Trabajamos con proveedores externos confiables como Supabase para la autenticación y Stripe para el procesamiento seguro de pagos. Estos proveedores pueden procesar tu información de acuerdo con sus propias políticas de privacidad."
          : "We partner with trusted third-party providers such as Supabase for authentication and Stripe for secure payment processing. These providers may process your data in accordance with their own privacy policies."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES ? "5. Cookies" : "5. Cookies"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Nuestro sitio web puede utilizar cookies y tecnologías de seguimiento similares para mejorar la experiencia del usuario, analizar el uso y personalizar el contenido. Puedes desactivar las cookies en la configuración de tu navegador, aunque algunas funciones pueden no funcionar correctamente."
          : "Our website may use cookies and similar tracking technologies to improve user experience, analyze usage, and personalize content. You may disable cookies through your browser settings, though some features may not work properly."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES ? "6. Tus derechos" : "6. Your Rights"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Puedes solicitar acceso, corrección o eliminación de tu información personal contactándonos en "
          : "You may request access to, correction of, or deletion of your personal information by contacting us at "}
        <a
          href="mailto:support@prosperityhub.app"
          className="text-blue-600 underline"
        >
          support@prosperityhub.app
        </a>
        {isES
          ? ". También puedes solicitar una copia de tus datos o cerrar tu cuenta en cualquier momento."
          : ". You may also request a copy of your data or close your account at any time."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES
          ? "7. Actualizaciones de esta política"
          : "7. Updates to This Policy"}
      </h2>
      <p className="mb-4">
        {isES
          ? "Podemos actualizar esta Política de Privacidad periódicamente. Cualquier cambio se publicará en esta página con una fecha de actualización revisada."
          : "We may update this Privacy Policy periodically. Any changes will be posted on this page with a revised “Last updated” date."}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">
        {isES ? "8. Contacto" : "8. Contact"}
      </h2>
      <p>
        {isES
          ? "Para cualquier inquietud relacionada con la privacidad, contáctanos en:"
          : "For any privacy-related concerns, contact us at:"}
        <br />
        <strong>Email:</strong> support@prosperityhub.app <br />
        <strong>
          {isES ? "Entidad comercial:" : "Business Entity:"}
        </strong>{" "}
        Prosperity Voyage LLC
      </p>
    </div>
  );
}
