"use client"
import { useState } from "react";
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

  // Filter companies based on location
  const filteredCompanies = initialCompanies.filter(company => {
    if (city) return company.location === city;
    if (state) return company.state === state;
    if (country) return company.country === country;
    return true;
  });

  return (
    <div>
      <SearchFilters 
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
        onSortChange={setSortBy}
        filteredCount={filteredCompanies.length}
        country={country}
        state={state}
        city={city}
        totalResults={initialCompanies.length}
        companies={filteredCompanies}
      />
      <PropertyList 
        searchQuery={searchQuery}
        country={country}
        state={state}
        city={city}
        filters={filters}
        sortBy={sortBy}
        companies={filteredCompanies}
      />
    </div>
  );
} 