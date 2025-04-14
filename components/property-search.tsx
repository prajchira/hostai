"use client"
import { useState } from "react";
import { getFilteredCompanies } from "@/lib/data";
import SearchFilters from "./search-filters";
import PropertyList from "./property-list";
import { PropertyCompany } from "@/lib/data";

export default function PropertySearch({ 
  initialCompanies, 
  country, 
  state, 
  city 
}: { 
  initialCompanies: PropertyCompany[];
  country?: string;
  state?: string;
  city?: string;
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    country: "",
    state: "",
    ranges: {
      stars: [0, 5] as [number, number],
      propertyCount: [0, 2000] as [number, number],
      totalReviews: [0, 10001] as [number, number]
    }
  });

  const handleApplyFilters = async () => {
    const filtered = await getFilteredCompanies({
      searchQuery,
      stars: filters.ranges.stars,
      propertyCount: filters.ranges.propertyCount,
      totalReviews: filters.ranges.totalReviews
    });
    setCompanies(filtered as PropertyCompany[]);
  };

  return (
    <div>
      <SearchFilters
        onFiltersChange={(newFilters) => {
          setSearchQuery(newFilters.searchQuery);
          setFilters({
            country: newFilters.country,
            state: newFilters.state,
            ranges: newFilters.ranges
          });
        }}
        onSortChange={setSortBy}
        onApplyFilters={handleApplyFilters}
        filteredCount={companies.length}
        totalResults={initialCompanies.length}
        country={country}
        state={state}
        city={city}
        companies={companies}
        isLoading={false}
      />
      <PropertyList 
        companies={companies}
        searchQuery={searchQuery}
        country={country}
        state={state}
        city={city}
        filters={filters}
        sortBy={sortBy}
      />
    </div>
  );
} 