export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Explore Local Services</h1>
      <p className="text-gray-700 max-w-xl mb-6">
        Browse and book trusted local services on Prosperity Hub — from home
        maintenance to event rentals and more. Connect, share, and grow your
        local network.
      </p>
      <a
        href="/listings"
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
      >
        View Listings
      </a>
    </main>
  );
}
