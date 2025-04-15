'use client'

import { useEffect, useState } from 'react'
import { PropertyCompany, getFilteredCompanies } from '@/lib/data'
import PropertyList from './property-list'

interface SuggestedCompaniesProps {
  property: PropertyCompany
}

export function SuggestedCompanies({ property }: SuggestedCompaniesProps) {
  const [cityProperties, setCityProperties] = useState<PropertyCompany[]>([]);
  const [stateProperties, setStateProperties] = useState<PropertyCompany[]>([]);
  const [countryProperties, setCountryProperties] = useState<PropertyCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSuggestions() {
      const [cityProps, stateProps, countryProps] = await Promise.all([
        getFilteredCompanies({
          city: property.location,
          state: property.state,
          country: property.country
        }),
        getFilteredCompanies({
          state: property.state,
          country: property.country
        }),
        getFilteredCompanies({
          country: property.country
        })
      ]);

      setCityProperties(cityProps.filter(p => p.actualID !== property.actualID).slice(0, 5) as PropertyCompany[]);
      setStateProperties(stateProps.filter(p => 
        p.actualID !== property.actualID && 
        p.location !== property.location
      ).slice(0, 5) as PropertyCompany[]);
      setCountryProperties(countryProps.filter(p => 
        p.actualID !== property.actualID && 
        p.state !== property.state
      ).slice(0, 5) as PropertyCompany[]);
      setIsLoading(false);
    }

    loadSuggestions();
  }, [property]);

  if (isLoading) {
    return <div>Loading suggestions...</div>;
  }

  return (
    <>
      {/* Similar Properties in City */}
      <div className="mb-12">
        <div className="border-t border-gray-200 pt-12 mb-12">
          <h2 className="mid-heading mb-6">More Property Managers in {property.location}</h2>
          {cityProperties.length > 0 ? (
            <PropertyList
              searchQuery=""
              country={property.country}
              state={property.state}
              city={property.location}
              companies={cityProperties}
            />
          ) : (
            <div className="bg-white rounded-[var(--radius)] border p-8 text-center">
              <p className="text-gray-500">No other property managers found in {property.location}</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Managers in State */}
      {stateProperties.length > 0 && (
        <div className="mb-12">
          <div className="border-t border-gray-200 pt-12">
            <h2 className="mid-heading mb-6">Property Managers in {property.state}</h2>
            <PropertyList
              searchQuery=""
              country={property.country}
              state={property.state}
              companies={stateProperties}
            />
          </div>
        </div>
      )}

      {/* Property Managers in Country */}
      {countryProperties.length > 0 && (
        <div className="mb-12">
          <div className="border-t border-gray-200 pt-12">
            <h2 className="mid-heading mb-6">Property Managers in {property.country}</h2>
            <PropertyList
              searchQuery=""
              country={property.country}
              companies={countryProperties}
            />
          </div>
        </div>
      )}
    </>
  );
} 