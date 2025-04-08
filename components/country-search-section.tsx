"use client"

import { useState } from "react"
import SearchFilters from "@/components/search-filters"
import PropertyList from "@/components/property-list"
import { PropertyCompany } from "@/lib/data"

interface FilterRanges {
  stars: [number, number];
  propertyCount: [number, number];
  totalReviews: [number, number];
}

interface Filters {
  country: string;
  state: string;
  ranges: FilterRanges;
}

interface CountrySearchSectionProps {
  countryName: string;
  totalResults: number;
  companies: PropertyCompany[];
}

export default function CountrySearchSection({ countryName, totalResults, companies }: CountrySearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [filters, setFilters] = useState<Filters | null>(null)

  const handleFiltersChange = (newFilters: Filters | null) => {
    setFilters(newFilters);
  };

  return (
    <>
      <SearchFilters 
        onSearchChange={setSearchQuery}
        onFiltersChange={handleFiltersChange}
        onSortChange={setSortBy}
        country={countryName}
        totalResults={totalResults}
      />
      <PropertyList 
        searchQuery={searchQuery} 
        country={countryName}
        filters={filters}
        sortBy={sortBy}
        companies={companies}
      />
    </>
  )
} 