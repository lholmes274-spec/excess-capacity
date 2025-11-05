export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-800">
          Terms and Conditions
        </h1>

        <p className="text-gray-700 mb-4">
          Welcome to <strong>Prosperity Hub</strong>. By accessing or using our
          platform, you agree to comply with and be bound by these Terms and
          Conditions. Please read them carefully before using our services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          1. Purpose of the Platform
        </h2>
        <p className="text-gray-700 mb-4">
          Prosperity Hub connects individuals and businesses to share unused
          capacity, such as workspaces, storage units, and tools. Our goal is to
          help you earn income through shared access and create opportunities
          within the community.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          2. User Responsibilities
        </h2>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          <li>Provide accurate information in all listings and communications.</li>
          <li>Use the platform respectfully and lawfully.</li>
          <li>
            Ensure that your listings meet safety and local regulation standards.
          </li>
          <li>Respect other users and complete transactions in good faith.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          3. Payments and Transactions
        </h2>
        <p className="text-gray-700 mb-4">
          All payments are processed securely through our third-party partners.
          Prosperity Hub does not store payment information. Any disputes
          regarding payments should be reported immediately through the contact
          options provided on the platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          4. Limitation of Liability
        </h2>
        <p className="text-gray-700 mb-4">
          Prosperity Hub is not responsible for any direct, indirect, or
          incidental damages arising from user interactions, listing misuse, or
          third-party actions. Users participate at their own risk and discretion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          5. Termination
        </h2>
        <p className="text-gray-700 mb-4">
          Prosperity Hub reserves the right to suspend or terminate accounts that
          violate these terms or engage in fraudulent or harmful behavior.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          6. Updates to Terms
        </h2>
        <p className="text-gray-700 mb-4">
          These terms may be updated periodically to reflect new policies or
          regulations. Continued use of the platform after updates implies
          agreement to the revised terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          7. Contact Us
        </h2>
        <p className="text-gray-700">
          If you have any questions about these Terms and Conditions, please
          contact us at{" "}
          <a
            href="mailto:support@prosperityhub.app"
            className="text-green-700 underline hover:text-green-900"
          >
            support@prosperityhub.app
          </a>
          .
        </p>

        {/* ✅ Trust acknowledgment */}
        <p className="text-gray-600 text-sm mt-10">
          For legal and estate purposes, ProsperityHub.app is intended to be
          assigned to the <strong>Prosperity Voyage Living Trust</strong> upon
          its formal activation and registration.
        </p>

        {/* 🚫 Removed duplicate footer — global layout footer will now appear */}
      </div>
    </main>
  );
}
