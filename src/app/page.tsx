// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "./components/LanguageProvider";

export default function HomePage() {
  const [realListings, setRealListings] = useState([]);
  const [user, setUser] = useState(undefined);
  const [listingCount, setListingCount] = useState<number>(0);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const { language } = useLanguage();
  const isES = language === "es";

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", currentUser.id);

        setListingCount(count || 0);
      }

      const { data: realData } = await supabase
        .from("listings")
        .select("*")
        .eq("demo_mode", false)
        .eq("listing_status", "active")
        .order("created_at", { ascending: false })
        .limit(15);

      setRealListings(realData || []);

      setLoadingUserData(false);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* PREMIUM BANNER */}
      <div className="w-full flex justify-center px-4 mt-6">
        <div
          className="w-full max-w-[1300px] rounded-2xl shadow-xl py-10 px-6 text-center text-white bg-gradient-to-r from-[#0f172a] via-[#142c45] to-[#d4a934]"
          style={{
            borderRadius: "18px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
          }}
        >
          <div className="inline-block bg-[#0057ff] px-6 py-2 rounded-md">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Prosperity Hub™
            </h1>
          </div>

          <p className="text-xl mt-4 font-semibold opacity-95">
            {isES
              ? "Convierte lo que ya tienes en ingresos"
              : "Turn What You Already Own Into Income"}
          </p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {isES
            ? "Encuentra servicios o comienza a ganar"
            : "Find Services or Start Earning"}
        </h1>

        <p className="text-gray-600 mt-3 max-w-xl mx-auto">
          {isES
            ? "Publica tu carro, herramientas, espacio o servicios y comienza a recibir reservas de clientes reales."
            : "List your car, tools, space, or services and start getting booked by real customers."}
        </p>

        {user === null && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/listings">
              <button className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full text-lg font-semibold transition">
                {isES ? "Ver anuncios" : "Browse Listings"}
              </button>
            </Link>

            <Link href="/demo">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-full text-lg font-semibold transition">
                {isES
                  ? "Ver anuncios de ejemplo"
                  : "See Example Listings"}
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* 🔥 HOW IT WORKS (NEW SECTION) */}
      <div className="mt-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isES ? "Cómo funciona" : "How It Works"}
          </h2>

      {/* 🔥 TRUST PROOF */}
      <div className="mt-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-sm font-medium">
            {isES
              ? "Creciendo en todo EE.UU. • Nuevos anuncios añadidos regularmente • Proveedores tempranos ganando visibilidad"
              : "Growing across the U.S. • New listings added regularly • Early providers gaining visibility"}
          </p>
        </div>
      </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-700">
            <div>
              <p className="text-lg font-semibold">
                {isES ? "1. Publica tu anuncio" : "1. List your service, item, or space"}
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">
                {isES ? "2. Clientes te encuentran" : "2. Customers find and book you"}
              </p>
            </div>

            <div>
              <p className="text-lg font-semibold">
                {isES ? "3. Recibe pagos seguros" : "3. Get paid securely through Stripe"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROVIDER OPPORTUNITY SECTION */}
      {!loadingUserData && (
        <div className="mt-12 px-6">
          <div className="max-w-4xl mx-auto bg-white/95 rounded-2xl shadow-lg py-6 px-6 text-center border border-gray-200">

            {user === null && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isES
                    ? "¿Tienes algo para ofrecer?"
                    : "Have Something to Offer?"}
                </h2>

                <p className="text-gray-600 max-w-2xl mx-auto mb-4">
                  {isES
                    ? "Los primeros proveedores en tu área obtienen la mayor visibilidad y más oportunidades a medida que la plataforma crece."
                    : "Early providers in your area get the most visibility and the best opportunities as the platform grows."}
                </p>

                <Link href="/signup">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
                    {isES ? "Comenzar" : "Start Listing"}
                  </button>
                </Link>

                {/* 🔥 ADD THIS RIGHT HERE */}
                <p className="text-sm text-green-600 font-semibold mt-3">
                  {isES
                    ? "Sin costo inicial. Publica gratis."
                    : "No upfront cost • List for free"}
                </p>
              </>
            )}

            {user && listingCount === 0 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🚀 {isES ? "Crea tu primer anuncio" : "Create Your First Listing"}
                </h2>

                <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                  {isES
                    ? "Comienza a ganar compartiendo artículos, espacios o servicios sin usar."
                    : "Start earning by sharing unused items, spaces, or services."}
                </p>

                <Link href="/add-listing">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
                    {isES ? "Crear anuncio" : "Create Listing"}
                  </button>
                </Link>
              </>
            )}

            {user && listingCount > 0 && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isES
                    ? "Haz crecer tu presencia en Prosperity Hub™"
                    : "Grow Your Presence on Prosperity Hub™"}
                </h2>

                <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                  {isES
                    ? "Agrega más anuncios para aumentar tu visibilidad y atraer más reservas."
                    : "Add more listings to increase visibility and attract more bookings."}
                </p>

                <Link href="/add-listing">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
                    {isES
                      ? "Agregar otro anuncio"
                      : "Add Another Listing"}
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* AVAILABLE LISTINGS */}
      <div className="mt-10 px-4 max-w-5xl mx-auto mb-20">
        <h2 className="text-2xl font-semibold mb-4">
        <p className="text-sm text-gray-500 mb-2 text-center">
          {isES
            ? "Se agregan nuevos anuncios en múltiples ubicaciones"
            : "New listings are being added across multiple locations"}
        </p>
          {isES ? "Anuncios disponibles" : "Available Listings"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {realListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="bg-white rounded-xl shadow p-4 border border-gray-200 hover:shadow-lg transition"
            >
              <div className="relative">

                {/* ✅ NEW BADGE */}
                {new Date(listing.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full shadow">
                     New
                  </div>
                )}
                
                <img
                  src={listing.image_url}
                  className="w-full h-40 object-cover rounded-lg"
                />

                <div
                  className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full text-white shadow ${
                    listing.type === "service"
                      ? "bg-purple-600"
                      : listing.transaction_type === "sale"
                      ? "bg-green-600"
                      : "bg-blue-600"
                  }`}
                >
                  {listing.type === "service"
                    ? "Service"
                    : listing.transaction_type === "sale"
                    ? "Sale"
                    : "Rent"}
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-3">
                {listing.title}
              </h3>
              
              {listing.baseprice !== null && (
                <p className="text-green-700 font-semibold mt-1">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: listing.currency || "USD",
                    minimumFractionDigits: 0,
                  }).format(Number(listing.baseprice))}
                </p>
              )}
              <p className="text-gray-600 text-sm">
                {listing.city}, {listing.state}
              </p>

           {new Date(listing.created_at) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && (
              <p className="text-xs text-gray-400 mt-1">
                Recently added
              </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}