"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"
import PropertyList from "@/components/property-list"
import SearchFilters from "@/components/search-filters"
import { PropertyCompany, getFilteredCompanies } from "@/lib/data"
import { formatUrlPath } from "@/lib/utils"
import { PrefetchWrapper } from "@/components/prefetch-wrapper"

interface HomeContentProps {
  companies: PropertyCompany[];
}

export default function HomeContent({ companies }: HomeContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [filters, setFilters] = useState({
    country: "",
    state: "",
    ranges: {
      stars: [0, 5] as [number, number],
      propertyCount: [0, 2000] as [number, number],
      totalReviews: [0, 10001] as [number, number]
    }
  }) 
  const [showAll, setShowAll] = useState(false)
  const INITIAL_SHOW_COUNT = 9
  const [filteredCompanies, setFilteredCompanies] = useState(companies);

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const countries = Array.from(new Set(companies.map(company => company.country))).sort()
  const visibleCountries = showAll ? countries : countries.slice(0, INITIAL_SHOW_COUNT)


  const FEATURED_COUNTRIES = ['United States', 'United Kingdom', 'Italy'];
  
  // Filter countries to only show featured ones
  const fetchingCountries = countries
    .filter(country => FEATURED_COUNTRIES.includes(country))
    .sort();
    
    const priorityBatches = {
      // Batch 1: Featured country paths (highest priority)
      countryPaths: fetchingCountries.map(country => 
        `/${formatUrlPath(country)}`
      ),
      
      // Batch 2: First 10 property paths (medium priority)
      topPropertyPaths: companies
        .slice(0, 10)
        .map(company => `/property/${company.actualID}`),
      
      // Batch 3: Remaining property paths (lower priority)
      remainingPropertyPaths: companies
        .slice(10)
        .map(company => `/property/${company.actualID}`)
    };

  // Combine country and property paths
  const allPaths = priorityBatches;
  

  // Update filtered companies when filters change
  useEffect(() => {
    const filtered = companies.filter(company => {
      // Apply your filtering logic here
      return true; // Replace with actual filtering
    });

    setFilteredCompanies(filtered);
  }, [filters, searchQuery, companies]);

  return (
    <>
      <div className="mb-8">
        <h2 className="description-text mb-4 my-3">
          Select a country to view local property managers:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 font-sans font-light text-gray-700">
          {visibleCountries.map((country) => (
            <Link
              key={country}
              href={`/${formatUrlPath(country)}`}
              className="group flex items-center hover:text-gray-400 relative"
            >
              <span>{country}</span>
              <span className="ml-1 inline-block transition-none group-hover:opacity-0 group-hover:animate-fadeSlideIn">
                ↗
              </span>


            </Link>
          ))}
        </div>

        {countries.length > INITIAL_SHOW_COUNT && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="body-text text-[#C65F39] hover:text-[#C65F39]/80 flex items-center gap-2"
          >
            {showAll ? (
              <>Show Less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>See More ({countries.length - INITIAL_SHOW_COUNT} more) <ChevronDown className="h-4 w-4" /></>
            )}
          </button>
        )}
      </div>


      <PrefetchWrapper 
        paths={{
          countryPaths: allPaths.countryPaths,
          topPropertyPaths: allPaths.topPropertyPaths,
          remainingPropertyPaths: allPaths.remainingPropertyPaths
        }}
      >
        <SearchFilters 
          onFiltersChange={(newFilters) => {
            setSearchQuery(newFilters.searchQuery);
            handleFiltersChange(newFilters);
          }}
          onSortChange={setSortBy}
          onApplyFilters={async () => {
            const filtered = await getFilteredCompanies({
              searchQuery,
              stars: filters.ranges.stars,
              propertyCount: filters.ranges.propertyCount,
              totalReviews: filters.ranges.totalReviews
            });
            setFilteredCompanies(filtered as PropertyCompany[]);
          }}
          filteredCount={filteredCompanies.length}
          totalResults={companies.length}
          companies={companies}
          isLoading={false}
        />
        <PropertyList 
          searchQuery={searchQuery}
          filters={filters}
          sortBy={sortBy}
          companies={filteredCompanies}
        />
      </PrefetchWrapper>
    </>
  )
} 