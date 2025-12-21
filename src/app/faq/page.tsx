// File: src/app/faq/page.tsx

export default function FAQPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

      <p className="text-gray-600 mb-10">
        Answers to common questions about using Prosperity Hub.
      </p>

      <section className="space-y-8">
        <div>
          <h2 className="font-semibold text-lg">What is Prosperity Hub?</h2>
          <p className="text-gray-700 mt-2">
            Prosperity Hub is a platform that allows individuals and businesses
            to list, book, and earn from under-used assets and services such as
            spaces, tools, vehicles, and more.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">Who are providers on Prosperity Hub?</h2>
          <p className="text-gray-700 mt-2">
            Providers are individuals or businesses that list assets or services
            on Prosperity Hub, including asset owners and service providers.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">What can I list on Prosperity Hub?</h2>
          <p className="text-gray-700 mt-2">
            You can list a wide range of items and services including spaces,
            tools, vehicles, equipment, and services, as long as they comply
            with our Terms and applicable laws.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">Do I need an account to book?</h2>
          <p className="text-gray-700 mt-2">
            Some listings allow guest bookings, while others require an account.
            Creating an account allows you to manage bookings and listings more
            easily.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">Is Prosperity Hub free to use?</h2>
          <p className="text-gray-700 mt-2">
            Browsing and creating an account is free. Fees, if applicable, are
            clearly shown before completing a booking.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            Is Prosperity Hub Pro the same as storage or rental payments?
          </h2>
          <p className="text-gray-700 mt-2">
            No. Prosperity Hub Pro is a monthly membership that gives you access
            to the platform. Storage, rentals, and services are billed separately
            based on each listing.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">How does booking work?</h2>
          <p className="text-gray-700 mt-2">
            You select the listing, duration, or quantity available and complete
            checkout. Payments are processed securely and confirmations are sent
            to both parties.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">When am I charged?</h2>
          <p className="text-gray-700 mt-2">
            Charges occur at the time of booking unless stated otherwise during
            checkout.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">How do providers get paid?</h2>
          <p className="text-gray-700 mt-2">
            Providers receive payouts after a successful booking according to
            Prosperity Hub’s payment schedule. Timing may vary based on payment
            method and verification status.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">Is Prosperity Hub secure?</h2>
          <p className="text-gray-700 mt-2">
            Yes. We use secure, industry-standard payment providers and take
            reasonable measures to protect user information.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg">What if something goes wrong?</h2>
          <p className="text-gray-700 mt-2">
            Users are encouraged to communicate directly through the platform.
            You may also contact Prosperity Hub support for assistance when
            appropriate.
          </p>
        </div>
      </section>
    </main>
  );
}
