// src/app/about/page.tsx

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center text-center p-6">
      <h1 className="text-3xl font-bold mb-6">About Prosperity Hub™</h1>

      <p className="text-gray-700 max-w-2xl leading-relaxed text-lg">
        Prosperity Hub™ is a dynamic excess-capacity sharing marketplace designed
        to help people <strong>rent, share, sell, and earn from what they already own</strong>.
        Whether it’s a space, a tool, a vehicle, or a skill, our mission is to
        <strong> unlock hidden value</strong> and empower communities to thrive together.
      </p>

      <p className="text-gray-700 max-w-2xl leading-relaxed text-lg mt-6">
        Built with flexibility in mind, Prosperity Hub™ allows users to list a
        wide range of items and services — from rentals to for-sale items — giving
        everyone the freedom to earn in the way that works best for them. Our
        platform provides a simple, secure environment where people can create new
        opportunities, support each other, and grow local prosperity.
      </p>
    </main>
  );
}
