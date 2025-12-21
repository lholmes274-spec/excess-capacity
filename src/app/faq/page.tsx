// File: src/app/faq/page.tsx
"use client";

import { useLanguage } from "../components/LanguageProvider";

export default function FAQPage() {
  const { language } = useLanguage();
  const isES = language === "es";

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">
        {isES ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
      </h1>

      <p className="text-gray-600 mb-10">
        {isES
          ? "Respuestas a preguntas comunes sobre el uso de Prosperity Hub."
          : "Answers to common questions about using Prosperity Hub."}
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="font-semibold text-lg">
            {isES ? "¿Qué es Prosperity Hub?" : "What is Prosperity Hub?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Prosperity Hub es una plataforma que permite a individuos y negocios publicar, reservar y ganar con activos y servicios subutilizados como espacios, herramientas, vehículos y más."
              : "Prosperity Hub is a platform that allows individuals and businesses to list, book, and earn from under-used assets and services such as spaces, tools, vehicles, and more."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES
              ? "¿Quiénes son los proveedores en Prosperity Hub?"
              : "Who are providers on Prosperity Hub?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Los proveedores son individuos o negocios que publican activos o servicios en Prosperity Hub, incluidos propietarios de activos y proveedores de servicios."
              : "Providers are individuals or businesses that list assets or services on Prosperity Hub, including asset owners and service providers."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES
              ? "¿Qué puedo publicar en Prosperity Hub?"
              : "What can I list on Prosperity Hub?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Puedes publicar una amplia variedad de artículos y servicios, incluidos espacios, herramientas, vehículos, equipos y servicios, siempre que cumplan con nuestros Términos y las leyes aplicables."
              : "You can list a wide range of items and services including spaces, tools, vehicles, equipment, and services, as long as they comply with our Terms and applicable laws."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES
              ? "¿Necesito una cuenta para reservar?"
              : "Do I need an account to book?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Algunos anuncios permiten reservas como invitado, mientras que otros requieren una cuenta. Crear una cuenta te permite administrar reservas y anuncios más fácilmente."
              : "Some listings allow guest bookings, while others require an account. Creating an account allows you to manage bookings and listings more easily."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES ? "¿Prosperity Hub es gratuito?" : "Is Prosperity Hub free to use?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Explorar la plataforma y crear una cuenta es gratuito. Las tarifas, si aplican, se muestran claramente antes de completar una reserva."
              : "Browsing and creating an account is free. Fees, if applicable, are clearly shown before completing a booking."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES
              ? "¿Prosperity Hub Pro es lo mismo que los pagos por almacenamiento o alquiler?"
              : "Is Prosperity Hub Pro the same as storage or rental payments?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "No. Prosperity Hub Pro es una membresía mensual que te da acceso a la plataforma. El almacenamiento, los alquileres y los servicios se cobran por separado según cada anuncio."
              : "No. Prosperity Hub Pro is a monthly membership that gives you access to the platform. Storage, rentals, and services are billed separately based on each listing."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES ? "¿Cómo funciona la reserva?" : "How does booking work?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Seleccionas el anuncio, la duración o cantidad disponible y completas el proceso de pago. Los pagos se procesan de forma segura y ambas partes reciben confirmaciones."
              : "You select the listing, duration, or quantity available and complete checkout. Payments are processed securely and confirmations are sent to both parties."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES ? "¿Cuándo se me cobra?" : "When am I charged?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Los cargos se realizan en el momento de la reserva, a menos que se indique lo contrario durante el pago."
              : "Charges occur at the time of booking unless stated otherwise during checkout."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES
              ? "¿Cómo reciben pagos los proveedores?"
              : "How do providers get paid?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Los proveedores reciben pagos después de una reserva exitosa según el calendario de pagos de Prosperity Hub. El tiempo puede variar según el método de pago y el estado de verificación."
              : "Providers receive payouts after a successful booking according to Prosperity Hub’s payment schedule. Timing may vary based on payment method and verification status."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES ? "¿Es seguro Prosperity Hub?" : "Is Prosperity Hub secure?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Sí. Utilizamos proveedores de pago seguros y estándares de la industria, y tomamos medidas razonables para proteger la información del usuario."
              : "Yes. We use secure, industry-standard payment providers and take reasonable measures to protect user information."}
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {isES
              ? "¿Qué pasa si algo sale mal?"
              : "What if something goes wrong?"}
          </h2>
          <p className="text-gray-700 mt-2">
            {isES
              ? "Se recomienda que los usuarios se comuniquen directamente a través de la plataforma. También puedes contactar al soporte de Prosperity Hub cuando sea necesario."
              : "Users are encouraged to communicate directly through the platform. You may also contact Prosperity Hub support for assistance when appropriate."}
          </p>
        </div>
      </section>
    </main>
  );
}
