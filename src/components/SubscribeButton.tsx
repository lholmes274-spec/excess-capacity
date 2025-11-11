"use client";

export default function SubscribeButton() {
  const handleSubscribe = async () => {
    try {
      const res = await fetch("/api/create-subscription-session", {
        method: "POST",
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start checkout. Please try again.");
        console.error("Missing session URL:", data);
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("There was an issue connecting to Stripe. Please try again.");
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
    >
      Subscribe for $9.99/month
    </button>
  );
}
