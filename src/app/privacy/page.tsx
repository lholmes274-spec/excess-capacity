import React from "react";

export const metadata = {
  title: "Privacy Policy | Prosperity Hub",
  description:
    "Learn how Prosperity Hub, operated by Prosperity Voyage Living Trust, collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">
        Last updated: October 27, 2025
      </p>

      <p className="mb-4">
        At <strong>Prosperity Hub</strong>, your privacy is important to us.
        This Privacy Policy explains how we collect, use, and protect your
        personal information when you use our website and related services,
        which are operated by <strong>Prosperity Voyage Living Trust</strong>.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
      <p className="mb-4">
        We may collect personal information that you voluntarily provide, such
        as your name, email address, and payment details. We also collect
        anonymous data such as browser type, IP address, and usage statistics.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Information</h2>
      <p className="mb-4">
        We use your information to provide, improve, and secure our services,
        process transactions, and communicate updates. We do not sell or rent
        your personal data to third parties.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Protection</h2>
      <p className="mb-4">
        We take reasonable technical and organizational measures to protect your
        data against unauthorized access, alteration, disclosure, or
        destruction.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
      <p className="mb-4">
        We use trusted third-party providers such as Stripe for payment
        processing. These services may collect and process data according to
        their own privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">5. Cookies</h2>
      <p className="mb-4">
        Our site may use cookies to improve user experience. You can disable
        cookies through your browser settings.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Rights</h2>
      <p className="mb-4">
        You may request access, correction, or deletion of your personal
        information by contacting us at{" "}
        <a
          href="mailto:support@prosperityhub.app"
          className="text-blue-600 underline"
        >
          support@prosperityhub.app
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">7. Updates to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy occasionally. Updates will be posted
        on this page with a revised “Last updated” date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">8. Contact</h2>
      <p>
        For any privacy-related concerns, contact us at: <br />
        <strong>Email:</strong> support@prosperityhub.app
      </p>
    </div>
  );
}
