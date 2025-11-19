import React from "react";

export const metadata = {
  title: "Privacy Policy | Prosperity Hub",
  description:
    "Learn how Prosperity Hub, owned and operated by Prosperity Voyage LLC, collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: October 27, 2025</p>

      <p className="mb-4">
        At <strong>Prosperity Hub</strong>, your privacy is important to us. This
        Privacy Policy explains how we collect, use, store, and protect your
        personal information when you use our website and related services,
        which are owned and operated by{" "}
        <strong>Prosperity Voyage LLC</strong>, a Louisiana limited liability
        company.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
      <p className="mb-4">
        We may collect personal information you voluntarily provide, such as your
        name, email address, and payment details. We also automatically collect
        technical data such as browser type, IP address, device information, and
        general usage statistics.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
      <p className="mb-4">
        We use your information to operate and improve our services, verify
        accounts, process transactions, communicate updates, enhance security,
        and provide customer support. We do not sell or rent your personal data
        to third parties.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Protection</h2>
      <p className="mb-4">
        We implement reasonable technical and organizational safeguards to help
        protect your data from unauthorized access, alteration, or disclosure.
        However, no online system is completely secure, and we cannot guarantee
        absolute security.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
      <p className="mb-4">
        We partner with trusted third-party providers such as Supabase for
        authentication and Stripe for secure payment processing. These providers
        may process your data in accordance with their own privacy policies.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">5. Cookies</h2>
      <p className="mb-4">
        Our website may use cookies and similar tracking technologies to improve
        user experience, analyze usage, and personalize content. You may disable
        cookies through your browser settings, though some features may not work
        properly.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Rights</h2>
      <p className="mb-4">
        You may request access to, correction of, or deletion of your personal
        information by contacting us at{" "}
        <a
          href="mailto:support@prosperityhub.app"
          className="text-blue-600 underline"
        >
          support@prosperityhub.app
        </a>
        . You may also request a copy of your data or close your account at any
        time.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">7. Updates to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with a revised “Last updated” date.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-4">8. Contact</h2>
      <p>
        For any privacy-related concerns, contact us at: <br />
        <strong>Email:</strong> support@prosperityhub.app <br />
        <strong>Business Entity:</strong> Prosperity Voyage LLC
      </p>
    </div>
  );
}
