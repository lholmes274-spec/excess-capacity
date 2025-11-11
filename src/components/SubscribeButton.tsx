"use client";

export default function SubscribeButton() {
  const handleSubscribe = async () => {
    const res = await fetch("/api/create-subscription-session", {
      method: "POST",
    });
    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
    >
      Subscribe for $9.99/month
    </button>
  );
}
