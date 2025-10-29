'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('availability', true)
        .order('created_at', { ascending: false });

      if (!error && data) setListings(data);
    };
    fetchListings();
  }, []);

  const categories = [
    'workspace',
    'storage',
    'parking',
    'equipment',
    'vehicle',
    'service',
    'digital',
    'event',
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-8">
        Prosperity Hub Marketplace
      </h1>

      {categories.map((cat) => {
        const items = listings.filter((l) => l.type === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 capitalize">
              {cat} Listings
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-green-600 font-semibold mt-2">
                      ${item.price} / {item.unit}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.city}, {item.state}
                    </p>
                    <button className="mt-3 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
