"use client";

import { useLanguage } from "../components/LanguageProvider";

export default function TermsPage() {
  const { language } = useLanguage();
  const isES = language === "es";

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-green-800">
          {isES ? "Términos y Condiciones" : "Terms and Conditions"}
        </h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          {isES
            ? "Última actualización: 7 de febrero de 2026"
            : "Last updated: February 7, 2026"}
        </p>

        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Bienvenido a <strong>Prosperity Hub</strong>. Al acceder o utilizar
              nuestra plataforma, aceptas cumplir y estar sujeto a estos
              Términos y Condiciones. Por favor, léelos cuidadosamente antes de
              utilizar nuestros servicios.
            </>
          ) : (
            <>
              Welcome to <strong>Prosperity Hub</strong>. By accessing or using
              our platform, you agree to comply with and be bound by these Terms
              and Conditions. Please read them carefully before using our
              services.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "1. Propósito de la Plataforma" : "1. Purpose of the Platform"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Prosperity Hub conecta a individuos y empresas para compartir
              capacidad no utilizada, como espacios de trabajo, unidades de
              almacenamiento y herramientas. Nuestra misión es ayudar a los
              usuarios a generar ingresos mediante el acceso compartido,
              fomentando oportunidades y colaboración comunitaria.
            </>
          ) : (
            <>
              Prosperity Hub connects individuals and businesses to share unused
              capacity, such as workspaces, storage units, and tools. Our mission
              is to help users earn income through shared access while fostering
              opportunities and community collaboration.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "2. Responsabilidades del Usuario" : "2. User Responsibilities"}
        </h2>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          {isES ? (
            <>
              <li>Proporcionar información precisa en todos los anuncios y comunicaciones.</li>
              <li>Usar la plataforma de manera respetuosa y conforme a la ley.</li>
              <li>
                Asegurar que los anuncios o artículos compartidos cumplan con
                las normas de seguridad y regulaciones locales.
              </li>
              <li>Respetar a otros usuarios y completar transacciones de buena fe.</li>
            </>
          ) : (
            <>
              <li>Provide accurate information in all listings and communications.</li>
              <li>Use the platform respectfully and in compliance with all laws.</li>
              <li>
                Ensure that any listings or shared items meet safety and local
                regulatory standards.
              </li>
              <li>Respect other users and complete transactions in good faith.</li>
            </>
          )}
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES
            ? "3. Seguro y Responsabilidad de Riesgo"
            : "3. Insurance and Risk Responsibility"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Prosperity Hub no proporciona cobertura de seguro para anuncios,
              activos o servicios ofrecidos a través de la plataforma. Los
              proveedores son responsables de garantizar que cualquier activo
              o servicio listado esté debidamente asegurado cuando así lo
              requiera la ley o las políticas aplicables. Los clientes son
              responsables de confirmar su propia cobertura o aceptar la
              responsabilidad antes de reservar o utilizar cualquier activo o
              servicio listado. Prosperity Hub actúa únicamente como un
              conector de mercado y no garantiza cobertura de seguro para
              ninguna transacción.
            </>
          ) : (
            <>
              Prosperity Hub does not provide insurance coverage for listings,
              assets, or services offered through the platform. Providers are
              responsible for ensuring that any listed assets or services are
              properly insured where required by law or applicable policies.
              Customers are responsible for confirming their own coverage or
              accepting responsibility before booking or using any listed
              asset or service. Prosperity Hub acts solely as a marketplace
              connector and does not guarantee insurance coverage for any
              transaction.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "4. Pagos y Transacciones" : "4. Payments and Transactions"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Todos los pagos se procesan de forma segura a través de socios
              externos confiables. Prosperity Hub no almacena ni procesa
              información de tarjetas de pago. Cualquier problema o disputa
              relacionada con pagos debe reportarse oportunamente a nuestro
              equipo de soporte.
            </>
          ) : (
            <>
              All payments are securely processed through trusted third-party
              partners. Prosperity Hub does not store or process payment card
              information. Any issues or disputes involving payments should be
              reported promptly through our support team.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "5. Limitación de Responsabilidad" : "5. Limitation of Liability"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Prosperity Hub no es responsable de daños directos, indirectos,
              incidentales o consecuentes derivados de interacciones entre
              usuarios, uso indebido de anuncios o acciones de terceros. Los
              usuarios participan bajo su propio riesgo y discreción.
            </>
          ) : (
            <>
              Prosperity Hub is not responsible for any direct, indirect,
              incidental, or consequential damages arising from user
              interactions, listing misuse, or actions taken by third parties.
              Users participate at their own risk and discretion.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "6. Terminación" : "6. Termination"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Prosperity Hub se reserva el derecho de suspender o cancelar
              cuentas que violen estos términos o participen en comportamientos
              fraudulentos, dañinos o abusivos.
            </>
          ) : (
            <>
              Prosperity Hub reserves the right to suspend or terminate accounts
              that violate these terms or engage in fraudulent, harmful, or
              abusive behavior.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "7. Actualizaciones de los Términos" : "7. Updates to Terms"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isES ? (
            <>
              Estos Términos y Condiciones pueden actualizarse periódicamente
              para reflejar cambios en políticas, leyes o funciones del
              servicio. El uso continuo de la plataforma después de dichas
              actualizaciones constituye la aceptación de los términos
              revisados.
            </>
          ) : (
            <>
              These Terms and Conditions may be updated from time to time to
              reflect changes in policies, laws, or service features. Your
              continued use of the platform after such updates constitutes
              acceptance of the revised terms.
            </>
          )}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          {isES ? "8. Contáctanos" : "8. Contact Us"}
        </h2>
        <p className="text-gray-700">
          {isES ? (
            <>
              Si tienes alguna pregunta sobre estos Términos y Condiciones,
              contáctanos en{" "}
            </>
          ) : (
            <>
              If you have any questions about these Terms and Conditions,
              please contact us at{" "}
            </>
          )}
          <a
            href="mailto:support@prosperityhub.app"
            className="text-green-700 underline hover:text-green-900"
          >
            support@prosperityhub.app
          </a>
          .
        </p>

        <p className="text-gray-600 text-sm mt-10">
          {isES ? (
            <>
              ProsperityHub.app es propiedad y está operado por{" "}
              <strong>Prosperity Voyage LLC</strong>, la entidad comercial oficial
              responsable de todos los servicios proporcionados a través de la
              plataforma.
            </>
          ) : (
            <>
              ProsperityHub.app is owned and operated by{" "}
              <strong>Prosperity Voyage LLC</strong>, the official business entity
              responsible for all services provided through the platform.
            </>
          )}
        </p>
      </div>
    </main>
  );
}
