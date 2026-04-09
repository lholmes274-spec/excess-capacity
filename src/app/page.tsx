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

      // 🔥 End loading AFTER everything resolves
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
              ? "Encuentra servicios, alquila artículos y gana en tu área"
              : "Find Services, Rent Items, and Earn in Your Area"}
          </p>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {isES
            ? "Encuentra o gana en tu comunidad"
            : "Find Services or Earn in Your Community"}
        </h1>

        <p className="text-gray-600 mt-3 max-w-xl mx-auto">
          {isES
            ? "Explora servicios locales, alquila lo que necesitas o comienza a ganar ofreciendo lo que ya tienes."
            : "Browse local services, rent what you need, or start earning by offering what you already have."}
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

      {/* PROVIDER OPPORTUNITY SECTION */}
      {!loadingUserData && (
        <div className="mt-12 px-6">
          <div className="max-w-4xl mx-auto bg-white/95 rounded-2xl shadow-lg py-6 px-6 text-center border border-gray-200">

            {/* LOGGED OUT */}
            {user === null && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {isES
                    ? "¿Tienes algo para ofrecer?"
                    : "Have Something to Offer?"}
                </h2>

                <p className="text-gray-600 max-w-2xl mx-auto mb-4">
                  {isES
                    ? "Los proveedores que comienzan temprano obtienen más visibilidad y oportunidades a medida que la plataforma crece."
                    : "Providers who start early gain more visibility and opportunities as the platform grows."}
                </p>

                <Link href="/signup">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
                    {isES ? "Comenzar" : "Start Listing"}
                  </button>
                </Link>
              </>
            )}

            {/* LOGGED IN + NO LISTINGS */}
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

            {/* LOGGED IN + HAS LISTINGS */}
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
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    className="w-full h-48 object-cover object-top rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 rounded-lg flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                    <p className="text-sm font-semibold">
                      Image Coming Soon
                    </p>
                    <p className="text-xs opacity-70">
                      Submitted by Seller
                    </p>
                  </div>
                )}

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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}