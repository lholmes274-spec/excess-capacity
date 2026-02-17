// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "./components/LanguageProvider";

export default function HomePage() {
  const [realListings, setRealListings] = useState([]);
  const [user, setUser] = useState(undefined);
  const { language } = useLanguage();
  const isES = language === "es";

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);

      const { data: realData } = await supabase
        .from("listings")
        .select("*")
        .eq("demo_mode", false)
        .eq("listing_status", "active")
        .limit(6);

      setRealListings(realData || []);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ⭐ PREMIUM GRADIENT BANNER WITH BLUE TITLE BOX */}
      <div className="w-full flex justify-center px-4 mt-6">
        <div
          className="
            w-full 
            max-w-[1300px]
            rounded-2xl 
            shadow-xl 
            py-10 
            px-6 
            text-center 
            text-white
            bg-gradient-to-r 
            from-[#0f172a] 
            via-[#142c45] 
            to-[#d4a934]
          "
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
              ? "Plataforma dinámica para compartir capacidad excedente"
              : "Dynamic Excess Capacity Sharing Platform"}
          </p>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {isES ? "Desbloquea tu prosperidad local" : "Unlock Your Local Prosperity"}
        </h1>

        <p className="text-gray-600 mt-3 max-w-xl mx-auto">
          {isES
            ? "Publica artículos sin usar, alquila a vecinos y descubre oportunidades dentro de tu comunidad local."
            : "List unused items, rent from neighbors, and discover opportunities within your local community."}
        </p>

        {user === null && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/signup">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold transition">
                {isES ? "Comenzar" : "Get Started"}
              </button>
            </Link>

            <Link href="/demo">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-full text-lg font-semibold transition">
                {isES ? "Ver anuncios de demostración" : "View Demo Listings"}
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* 🚀 EARLY PROVIDER POSITIONING SECTION */}
      <div className="mt-16 px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-10 text-center border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isES
              ? "Sé uno de los primeros proveedores en tu área"
              : "Be One of the First Providers in Your Area"}
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            {isES
              ? "Prosperity Hub™ está expandiéndose a nuevas comunidades. Los primeros proveedores reciben máxima visibilidad a medida que la plataforma crece."
              : "Prosperity Hub™ is expanding into new communities. Early providers receive maximum visibility as the platform grows."}
          </p>

          <Link href="/add-listing">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
              {isES ? "Crear tu primer anuncio" : "Create Your First Listing"}
            </button>
          </Link>
        </div>
      </div>

      {/* AVAILABLE LISTINGS */}
      <div className="mt-14 px-4 max-w-5xl mx-auto mb-20">
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
                <img
                  src={listing.image_url}
                  className="w-full h-40 object-cover rounded-lg"
                />

                {listing.transaction_type && (
                  <div
                    className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full text-white shadow ${
                      listing.transaction_type === "booking"
                        ? "bg-blue-600"
                        : "bg-green-600"
                    }`}
                  >
                    {listing.transaction_type === "booking"
                      ? "Rent"
                      : "Sale"}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mt-3">
                {listing.title}
              </h3>
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
