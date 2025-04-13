"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Star, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getPropertyCompanies, PropertyCompany } from "@/lib/data"
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

interface PropertyListProps {
  searchQuery: string;
  country?: string;
  state?: string;
  city?: string;
  filters?: {
    country: string;
    state: string;
    ranges: {
      stars: [number, number];
      propertyCount: [number, number];
      totalReviews: [number, number];
    };
  } | null;
  sortBy?: string;
  companies: PropertyCompany[];
}

export default function PropertyList({ searchQuery, country, state, city, filters = null, sortBy, companies }: PropertyListProps) {
  const [displayedCount, setDisplayedCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const listRef = useRef<any>(null);

  const [properties, setProperties] = useState<PropertyCompany[]>([]);

  // Add window height state
  const [windowHeight, setWindowHeight] = useState(0);

  const ITEMS_PER_PAGE = 20

  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      const data = await getPropertyCompanies();
      setProperties(data);
    };
    fetchData();
  }, []);

  let filteredProperties = companies.filter(property => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      property.name.toLowerCase().includes(search) ||
      property.location.toLowerCase().includes(search) ||
      property.state.toLowerCase().includes(search) ||
      property.country.toLowerCase().includes(search) ||
      (property.description?.toLowerCase().includes(search) ?? false);

    // Skip range filtering if filters are null
    if (!filters) return matchesSearch;

    // Apply range filters only if they exist
    const matchesRanges = !filters.ranges || (
      (property.rating ?? 0) >= filters.ranges.stars[0] && 
      (property.rating ?? 0) <= filters.ranges.stars[1] &&
      (property.propertyCount ?? 0) >= filters.ranges.propertyCount[0] &&
      (property.propertyCount ?? 0) <= filters.ranges.propertyCount[1] &&
      (property.totalReviews ?? 0) >= filters.ranges.totalReviews[0] &&
      (property.totalReviews ?? 0) <= filters.ranges.totalReviews[1]
    );

    // Check location filters
    if (country && state && city) {
      return matchesSearch && matchesRanges &&
        property.country.toLowerCase() === country.toLowerCase() &&
        property.state.toLowerCase() === state.toLowerCase() &&
        property.location.toLowerCase() === city.toLowerCase();
    }
    else if (country && state) {
      return matchesSearch && matchesRanges &&
        property.country.toLowerCase() === country.toLowerCase() &&
        property.state.toLowerCase() === state.toLowerCase();
    }
    else if (country) {
      return matchesSearch && matchesRanges &&
        property.country.toLowerCase() === country.toLowerCase();
    }

    // Log why a property might be filtered out
    // if (!matchesSearch) console.log(`${property.name} filtered out by search`);
    // if (!matchesRanges) console.log(`${property.name} filtered out by ranges`);

    return matchesSearch && matchesRanges;
  });

  // Add sorting logic
  filteredProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'properties':
        return (b.propertyCount ?? 0) - (a.propertyCount ?? 0);
      default:
        return 0;
    }
  });

  // Only show the number of items specified by displayedCount
  const displayedProperties = filteredProperties.slice(0, displayedCount);

  // Calculate total height based on number of items
  const totalHeight = displayedProperties.length * 200;

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && displayedCount < filteredProperties.length) {
          setIsLoading(true);
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + 10, filteredProperties.length));
            setIsLoading(false);
          }, 300);
        }
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '200px'
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [displayedCount, filteredProperties.length, isLoading]);

  // Update window height on mount and resize
  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    console.log('resized')
    console.log(window.innerHeight)
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add helper function at the top of the component
  function shouldSkipCityDisplay(state: string, city: string): boolean {
    return state.toLowerCase() === city.toLowerCase() && state.toLowerCase() !== 'new york';
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const company = displayedProperties[index];
    return (
      <div style={style}>
        <Link 
          href={`/property/${company.actualID}`}
          prefetch={true}
          className="block hover:bg-gray-50 px-4"
        >
          <div className="bg-white rounded-[var(--radius)] border p-6">
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <div className="relative w-24 h-24 rounded-[var(--radius)] overflow-hidden bg-white border">
                  <Image
                    src={company.logo || "/placeholder.svg"}
                    alt={`${company.name} logo`}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 100px, 200px"
                    priority={index < 3}
                    loading={index < 3 ? "eager" : "lazy"}
                    unoptimized={company.logo?.startsWith('http')}
                  />
                </div>
              </div>

              <div className="flex-1">
                  <h3 className="description-text font-[500]">
                    {company.name}
                  </h3>     
                  <div className="mini-text text-[#BFBFBF] mb-2">
                    {shouldSkipCityDisplay(company.state, company.location) 
                      ? `${company.state}, ${company.country}`
                      : `${company.location}, ${company.state}, ${company.country}`
                    }
                  </div>

                  <p className="mini-text text-[#050505] mb-2">{company.oneLiner}</p>

                  <div className="flex flex-wrap gap-2">

                  {!shouldSkipCityDisplay(company.state, company.location) && (
                    <Badge variant="outline" className="flex items-center gap-1 bg-white border-gray-200 font-normal text-gray-700">
                      {company.location}
                    </Badge>
                  )}

                  <Badge variant="outline" className="flex items-center gap-1 bg-white border-gray-200 font-normal text-gray-700">
                    {company.state}
                  </Badge>

                  {company.country && (
                    <Badge variant="outline" className="font-normal text-gray-700">
                      {company.country}
                    </Badge>
                  )}

                  {/* {company.tags?.includes("Verified") && (
                    <Badge variant="outline" className="flex items-center gap-5 bg-white border-gray-200 font-normal text-gray-700">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Verified
                    </Badge>
                  )} */}

                  {company.isVerified && (
                    <Badge variant="outline" className="flex items-center gap-5 bg-white border-gray-200 font-normal text-gray-700">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      Verified
                    </Badge>
                  )}

                  <Badge variant="outline" className="flex items-center gap-0.5 bg-white border-gray-200 py-2 font-normal text-gray-700">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    {company.rating}
                  </Badge>

                  {company.tags && (
                    <Badge variant="outline" className="flex items-center gap-0.5 bg-white border-gray-200 py-2 font-normal text-gray-700">
                      {company.tags}
                    </Badge>
                  )}

                </div>

              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  

  return (
    <div className="relative" style={{ height: `${Math.max(totalHeight, 300)}px` }}>
      <AutoSizer>
        {({ width }) => (
          <List
            ref={listRef}
            height={Math.max(totalHeight, 300)}
            width={width}
            itemCount={displayedProperties.length}
            itemSize={200}
            className="!overflow-visible"
            style={{ overflow: 'visible' }}
            overscanCount={5}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
      
      {/* Position the observer at the bottom of the actual content */}
      {displayedCount < filteredProperties.length && (
        <div 
          ref={observerTarget}
          className="absolute w-full"
          style={{ 
            bottom: '200px'
          }}
        >
          {isLoading && (
            <div className="text-center py-4 text-gray-500">
              loading
              <span className="inline-block animate-[ellipsis_1s_steps(4,end)_infinite] w-[12px] text-left">
                ...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

