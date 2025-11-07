export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Join Prosperity Hub</h1>
      <p className="text-gray-600 max-w-md mb-6">
        Create your free account to start sharing, booking, and earning in your
        community. Unlock the power of your unused space, tools, or services.
      </p>
      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        Get Started
      </a>
    </main>
  );
}
