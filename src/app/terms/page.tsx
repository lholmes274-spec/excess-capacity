export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-green-800">
          Terms and Conditions
        </h1>

        {/* ⭐ Always-visible Last Updated date */}
        <p className="text-sm text-gray-500 text-center mb-6">
          Last updated: November 19, 2025
        </p>

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
          capacity, such as workspaces, storage units, and tools. Our mission is
          to help users earn income through shared access while fostering
          opportunities and community collaboration.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          2. User Responsibilities
        </h2>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          <li>Provide accurate information in all listings and communications.</li>
          <li>Use the platform respectfully and in compliance with all laws.</li>
          <li>
            Ensure that any listings or shared items meet safety and local
            regulatory standards.
          </li>
          <li>Respect other users and complete transactions in good faith.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          3. Payments and Transactions
        </h2>
        <p className="text-gray-700 mb-4">
          All payments are securely processed through trusted third-party
          partners. Prosperity Hub does not store or process payment card
          information. Any issues or disputes involving payments should be
          reported promptly through our support team.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          4. Limitation of Liability
        </h2>
        <p className="text-gray-700 mb-4">
          Prosperity Hub is not responsible for any direct, indirect,
          incidental, or consequential damages arising from user interactions,
          listing misuse, or actions taken by third parties. Users participate
          at their own risk and discretion.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          5. Termination
        </h2>
        <p className="text-gray-700 mb-4">
          Prosperity Hub reserves the right to suspend or terminate accounts
          that violate these terms or engage in fraudulent, harmful, or abusive
          behavior.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3 text-gray-900">
          6. Updates to Terms
        </h2>
        <p className="text-gray-700 mb-4">
          These Terms and Conditions may be updated from time to time to reflect
          changes in policies, laws, or service features. Your continued use of
          the platform after such updates constitutes acceptance of the revised
          terms.
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

        <p className="text-gray-600 text-sm mt-10">
          ProsperityHub.app is owned and operated by{" "}
          <strong>Prosperity Voyage LLC</strong>, the official business entity
          responsible for all services provided through the platform.
        </p>
      </div>
    </main>
  );
}
