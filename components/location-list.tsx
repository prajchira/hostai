'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { formatUrlPath } from '@/lib/utils'

interface LocationListProps {
  locations: string[];
  basePath: string;
  title?: string;
  shouldSkipCityPage?: boolean;
}

export default function LocationList({ 
  locations, 
  basePath, 
  title = "Select a location:", 
  shouldSkipCityPage = false
}: LocationListProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW_COUNT = 9;

  // Deduplicate locations based on normalized names
  const uniqueLocations = Array.from(
    locations.reduce((map, location) => {
      const normalized = formatUrlPath(location);
      if (!map.has(normalized)) {
        map.set(normalized, location);
      }
      return map;
    }, new Map<string, string>())
  ).map(([_, location]) => location);

  // Sort the deduplicated locations
  const sortedLocations = uniqueLocations.sort();

  const visibleLocations = showAll ? sortedLocations : sortedLocations.slice(0, INITIAL_SHOW_COUNT);

  if (sortedLocations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="description-text mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {visibleLocations.map(location => {
          if (shouldSkipCityPage && 
              location === basePath.split('/').pop() && 
              location.toLowerCase() !== 'new york') {
            return null;
          }
          
          return (
            <Link
              key={location}
              href={`${basePath}/${formatUrlPath(location)}`}
              className="group flex items-center hover:text-gray-400 relative"
            >
              <span>{location}</span>
              <span className="ml-1 inline-block transition-none group-hover:opacity-0 group-hover:animate-fadeSlideIn">
                ↗
              </span>
            </Link>
          );
        })}
      </div>

      {locations.length > INITIAL_SHOW_COUNT && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="body-text text-[#C65F39] hover:text-[#C65F39]/80 flex items-center gap-2"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>See More ({locations.length - INITIAL_SHOW_COUNT} more) <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
} 