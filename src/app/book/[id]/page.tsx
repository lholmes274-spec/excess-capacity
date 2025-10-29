'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';

export default function BookPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    const fetchListing = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', id).single();
      setListing(data);
    };
    fetchListing();
  }, [id]);

  if (!listing)
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <img
          src={listing.image_url}
          alt={listing.title}
          className="rounded w-full h-60 object-cover mb-4"
        />
        <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
        <p className="text-gray-700 mb-4">{listing.description}</p>
        <p className="text-green-600 text-lg font-semibold mb-4">
          ${listing.price} / {listing.unit}
        </p>
        <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
