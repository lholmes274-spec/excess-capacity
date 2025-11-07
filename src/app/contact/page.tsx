export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-gray-600 max-w-md mb-6">
        Have a question or feedback? We’d love to hear from you. Send us an
        email at <a href="mailto:support@prosperityhub.app" className="text-blue-600 underline">support@prosperityhub.app</a>
      </p>
      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        Return to Home
      </a>
    </main>
  );
}
