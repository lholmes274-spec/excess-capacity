"use client";

import SubscribeButton from "@/components/SubscribeButton";

export default function SubscribePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-4">Activate Your Prosperity Hub Account</h1>
      <p className="text-gray-600 mb-6">
        Subscribe for <strong>$9.99/month</strong> to unlock full seller access and premium features.
      </p>
      <SubscribeButton />
    </div>
  );
}
