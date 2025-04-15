"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { PropertyCompany } from "@/lib/data"

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    searchQuery: string;
    country: string;
    state: string;
    ranges: FilterRanges;
  }) => Promise<void>;
  onSortChange: (sort: string) => void;
  onApplyFilters: () => Promise<void>;
  filteredCount: number;
  totalResults: number;
  country?: string;
  state?: string;
  city?: string;
  companies: PropertyCompany[];
  isLoading?: boolean;
}

interface FilterRanges {
  stars: [number, number];
  propertyCount: [number, number];
  totalReviews: [number, number];
}

const initialRanges = {
  stars: [0, 5] as [number, number],
  propertyCount: [0, 2000] as [number, number],
  totalReviews: [0, 10001] as [number, number]
};

export default function SearchFilters({ 
  onFiltersChange,
  onSortChange,
  onApplyFilters,
  filteredCount,
  totalResults,
  country, 
  state, 
  city,
  companies,
  isLoading
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [selectedState, setSelectedState] = useState<string>("")
  const [ranges, setRanges] = useState<FilterRanges>(initialRanges)
  const [isOpen, setIsOpen] = useState(false)

  // Example state mappings - you would replace these with your actual data
  const statesByCountry: Record<string, string[]> = {
    "United States": ["California", "Texas", "Florida", "New York", "Illinois"],
    "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"]
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        searchQuery,
        country: selectedCountry,
        state: selectedState,
        ranges
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCountry, selectedState, onFiltersChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  const handleRangeChange = (key: keyof FilterRanges, value: number[]) => {
    setRanges(prev => ({
      ...prev,
      [key]: value as [number, number]
    }));
  }

  // Build location text
  const locationText = city 
    ? `${city}, ${country}`
    : state
    ? `${state}, ${country}`
    : country
    ? country
    : 'all locations';

  const handleApplyFilters = async () => {
    await onFiltersChange({
      searchQuery,
      country: selectedCountry,
      state: selectedState,
      ranges
    });
    await onApplyFilters();
    setIsOpen(false);
  }

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCountry("");
    setSelectedState("");
    setRanges(initialRanges);
    onFiltersChange({
      searchQuery: "",
      country: "",
      state: "",
      ranges: initialRanges
    });
  }

  return (
    <div className="mb-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <p className="mini-text text-mid-gray">
          Showing {filteredCount.toLocaleString()} {filteredCount === 1 ? 'company' : 'companies'} in {locationText}
        </p>
        <Select defaultValue="relevance" onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="rating">Rating (High to Low)</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="properties">Property Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Input
          type="search"
          placeholder="Search"
          className="w-full pl-10 py-6 text-[19px] font-[300] bg-white focus-visible:ring-[#C65F39] focus-visible:ring-1 focus-visible:ring-offset-0"
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={isLoading}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 hover:text-gray-400 h-9 body-text"
              style={{
                boxShadow: 'rgba(0, 0, 0, 0) 1px 1px 3px',
                transition: 'background-color 0.3s, box-shadow 0.2s, color 0.3s'
              }}
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Filters
            </Button>
          </SheetTrigger>

          <SheetContent className="overflow-y-auto rounded-l-2xl">
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 py-4">
              <div>
                <Label>Stars ({ranges.stars[0]} - {ranges.stars[1]})</Label>
                <Slider
                  defaultValue={initialRanges.stars}
                  value={ranges.stars}
                  max={5}
                  step={0.1}
                  onValueChange={(value) => handleRangeChange('stars', value)}
                />
              </div>

              <div>
                <Label>Property Count ({ranges.propertyCount[0]} - {ranges.propertyCount[1]})</Label>
                <Slider
                  defaultValue={initialRanges.propertyCount}
                  value={ranges.propertyCount}
                  max={2000}
                  step={10}
                  onValueChange={(value) => handleRangeChange('propertyCount', value)}
                />
              </div>

              <div>
                <Label>Total Reviews ({ranges.totalReviews[0]} - {ranges.totalReviews[1]})</Label>
                <Slider
                  defaultValue={initialRanges.totalReviews}
                  value={ranges.totalReviews}
                  max={10001}
                  step={100}
                  onValueChange={(value) => handleRangeChange('totalReviews', value)}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="body-text"
                  style={{
                    transition: 'background-color 0.3s, box-shadow 0.2s, color 0.3s'
                  }}
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleApplyFilters}
                  className="body-text bg-[#C65F39] hover:bg-[#C65F39]/90"
                  style={{
                    transition: 'background-color 0.3s, box-shadow 0.2s, color 0.3s'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Applying...' : 'Apply Filters'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

