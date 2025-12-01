"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench,
  Briefcase,
  Package,
  Building2,
  Car,
  Camera,
  Home,
  Users,
  Monitor,   // ⭐ NEW ICON
} from "lucide-react";

export default function ServicesPage() {
  const categories = [
    {
      name: "Service",
      slug: "service",
      icon: <Wrench className="w-8 h-8 text-blue-600" />,
      description:
        "Hands-on or labor-based tasks such as cleaning, lawn care, or delivery services.",
    },
    {
      name: "Consultant",
      slug: "consultant",
      icon: <Briefcase className="w-8 h-8 text-blue-600" />,
      description:
        "Offer professional expertise in marketing, business, coaching, or technology.",
    },
    {
      name: "Tool",
      slug: "tool",
      icon: <Package className="w-8 h-8 text-blue-600" />,
      description: "Rent your power washer, ladder, drill, or other handy tools.",
    },
    {
      name: "Space",
      slug: "space",
      icon: <Building2 className="w-8 h-8 text-blue-600" />,
      description:
        "List extra storage, office, garage, or creative space for short-term use.",
    },
    {
      name: "Vehicle",
      slug: "vehicle",
      icon: <Car className="w-8 h-8 text-blue-600" />,
      description:
        "Share your car, truck, or trailer with others when not in use.",
    },
    {
      name: "Recreation",
      slug: "recreation",
      icon: <Camera className="w-8 h-8 text-blue-600" />,
      description:
        "Rent leisure gear like bikes, kayaks, drones, or cameras for fun experiences.",
    },
    {
      name: "Home",
      slug: "home",
      icon: <Home className="w-8 h-8 text-blue-600" />,
      description:
        "Offer home and garden resources such as sheds, decor, or lawn equipment.",
    },

    // ⭐ NEW ELECTRONICS CATEGORY
    {
      name: "Electronics",
      slug: "electronics",
      icon: <Monitor className="w-8 h-8 text-blue-600" />,
      description:
        "Sell or rent laptops, TVs, speakers, tablets, monitors, gaming systems, and more.",
    },

    {
      name: "Other",
      slug: "other",
      icon: <Users className="w-8 h-8 text-blue-600" />,
      description:
        "List anything unique or valuable that doesn’t fit other categories.",
    },
  ];

  return (
    <main className="container mx-auto px-6 py-12">
      {/* Page Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Explore Our Categories
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Prosperity Hub is an all-in-one sharing platform where you can rent,
          list, or book almost anything — from tools and vehicles to consulting
          services and workspace rentals.
        </p>
      </section>

      {/* Category Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/listings?type=${cat.slug}`}
              className="block bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition p-6 text-center hover:-translate-y-1"
            >
              <div className="flex justify-center mb-4">{cat.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {cat.name}
              </h3>
              <p className="text-gray-600 text-sm">{cat.description}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Ready to Explore or Start Earning?
        </h2>
        <p className="text-gray-600 mb-6">
          Browse active listings, book what you need, or create your own listing
          in minutes — all within Prosperity Hub.
        </p>

        <Link
          href="/listings"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          View Active Listings
        </Link>
      </section>
    </main>
  );
}
