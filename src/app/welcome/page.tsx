export default function WelcomePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to Prosperity Hub 🎉
      </h1>

      <p className="text-gray-600 mb-8">
        Your email has been confirmed and your account is ready.
      </p>

      <a
        href="/dashboard"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Go to Dashboard
      </a>
    </main>
  );
}
