'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [category, setCategory] = useState('');

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

  const states = [
    '', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Fetch all listings
  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('availability', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setListings(data);
        setFiltered(data);
      }
    };
    fetchListings();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = listings;

    if (search.trim()) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (stateFilter) {
      result = result.filter(
        (item) => item.state?.toLowerCase() === stateFilter.toLowerCase()
      );
    }

    if (category) {
      result = result.filter((item) => item.type === category);
    }

    setFiltered(result);
  }, [search, stateFilter, category, listings]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-6">
        Prosperity Hub Marketplace
      </h1>
      <p className="text-center text-gray-600 mb-10">
        Discover and rent workspaces, parking, storage, and more across the U.S.
      </p>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 justify-center mb-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="border rounded px-3 py-2 w-64"
        />

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All States</option>
          {states.map(
            (s) => s && (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Listings Display */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">No listings found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
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
                <a
                  href={`/book/${item.id}`}
                  className="mt-3 inline-block bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Book Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
