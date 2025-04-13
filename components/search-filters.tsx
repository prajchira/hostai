"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface SearchFiltersProps {
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: {
    country: string;
    state: string;
    ranges: FilterRanges;
  }) => void;
  onSortChange: (sort: string) => void;
  filteredCount: number;
  country?: string;
  state?: string;
  city?: string;
  totalResults: number;
  companies: any[]; // Assuming a simple structure for companies
}

interface FilterRanges {
  stars: [number, number];
  propertyCount: [number, number];
  totalReviews: [number, number];
}

export default function SearchFilters({ 
  onSearchChange, 
  onFiltersChange,
  onSortChange,
  filteredCount,
  country, 
  state, 
  city,
  totalResults,
  companies 
}: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [selectedState, setSelectedState] = useState<string>("")
  const [ranges, setRanges] = useState<FilterRanges>({
    stars: [0, 5],
    propertyCount: [0, 2000],
    totalReviews: [0, 10001]
  })

  // Example state mappings - you would replace these with your actual data
  const statesByCountry: Record<string, string[]> = {
    "United States": ["California", "Texas", "Florida", "New York", "Illinois"],
    "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"]
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setSearchQuery(newQuery)
    onSearchChange(newQuery)
  }

  const handleRangeChange = (key: keyof FilterRanges, value: number[]) => {
    setRanges(prev => ({
      ...prev,
      [key]: value as [number, number]
    }))
  }

  // Build location text
  const locationText = city 
    ? `${city}, ${country}`
    : state
    ? `${state}, ${country}`
    : country
    ? country
    : 'all locations';

  const handleApplyFilters = () => {
    onFiltersChange({
      country: selectedCountry,
      state: selectedState,
      ranges: ranges
    })
  }

  return (
    <div className="mb-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <p className="mini-text text-mid-gray">
          Showing {filteredCount.toLocaleString()} {filteredCount === 1 ? 'company' : 'companies'} in {locationText}
        </p>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="relative">
        <Input
          type="search"
          placeholder="Search"
          className="w-full pl-10 py-6 text-[19px] font-[300] bg-white focus-visible:ring-[#C65F39] focus-visible:ring-1 focus-visible:ring-offset-0"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

        <Sheet>
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
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="large-heading">Filter Properties</SheetTitle>
              <SheetDescription className="description-text text-gray-600">
                Narrow down your search with these filters
              </SheetDescription>
            </SheetHeader>
            
            <div className="grid gap-6 py-6">
              <div>
                <Label className="body-text text-gray-700 mb-2">
                  Stars ({ranges.stars[0]} - {ranges.stars[1]})
                </Label>
                <Slider
                  defaultValue={[0, 5]}
                  max={5}
                  step={0.1}
                  value={ranges.stars}
                  onValueChange={(value) => handleRangeChange('stars', value)}
                  className="mt-4"
                />
              </div>

              <div>
                <Label className="body-text text-gray-700 mb-2">
                  Property Count ({ranges.propertyCount[0]} - {ranges.propertyCount[1]})
                </Label>
                <Slider
                  defaultValue={[0, 2000]}
                  max={2000}
                  step={10}
                  value={ranges.propertyCount}
                  onValueChange={(value) => handleRangeChange('propertyCount', value)}
                  className="mt-4"
                />
              </div>

              <div>
                <Label className="body-text text-gray-700 mb-2">
                  Total Reviews ({ranges.totalReviews[0]} - {ranges.totalReviews[1]})
                </Label>
                <Slider
                  defaultValue={[0, 10001]}
                  max={10001}
                  step={100}
                  value={ranges.totalReviews}
                  onValueChange={(value) => handleRangeChange('totalReviews', value)}
                  className="mt-4"
                />
              </div>

              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCountry("")
                    setSelectedState("")
                    setRanges({
                      stars: [0, 5],
                      propertyCount: [0, 2000],
                      totalReviews: [0, 10001]
                    })
                    onFiltersChange({
                      country: "",
                      state: "",
                      ranges: {
                        stars: [0, 5],
                        propertyCount: [0, 2000],
                        totalReviews: [0, 10001]
                      }
                    })
                  }}
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
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

