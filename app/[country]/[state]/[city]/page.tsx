import Link from "next/link";
import { getPropertyCompanies, getCityData } from "@/lib/data";
import { ChevronRight } from "lucide-react";
import PropertySearch from "@/components/property-search";
import { Metadata } from 'next'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PrefetchWrapper } from "@/components/prefetch-wrapper"
import { formatUrlPath } from '@/lib/utils'
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Suspense } from 'react'
import { LoadingSkeleton } from "@/components/loading-skeleton"

export default async function CityPage({ params }: { params: { country: string; state: string; city: string } }) {
  try {
    const properties = await getPropertyCompanies();
    
    const decodedCity = decodeURIComponent(params.city);
    const decodedState = decodeURIComponent(params.state);
    const decodedCountry = decodeURIComponent(params.country);

    const cityData = properties.find(
      (company) => 
        formatUrlPath(company.location) === formatUrlPath(decodedCity) &&
        formatUrlPath(company.state) === formatUrlPath(decodedState) &&
        formatUrlPath(company.country) === formatUrlPath(decodedCountry)
    );

    if (!cityData) {
      return <div>City not found</div>;
    }

    const cityName = cityData?.location || decodedCity;
    const stateName = cityData?.state || decodedState;
    const countryName = cityData?.country || decodedCountry;

    const filteredCompanies = properties.filter(company => 
      company.country === countryName &&
      company.state === stateName &&
      company.location === cityName
    );

    const cityBio = await getCityData(cityName);

    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <PrefetchWrapper 
          paths={[
            '/',  // Home page
            `/${formatUrlPath(countryName)}`,  // Country page
            `/${formatUrlPath(countryName)}/${formatUrlPath(stateName)}`,  // State page
            ...filteredCompanies.slice(0, 5).map(p => `/property/${p.actualID}`)  // Top 5 properties
          ]}
        >
          <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-5xl mx-auto">
                {/* Breadcrumb Navigation */}
                <div className="mb-6">
                  <BreadcrumbNav 
                    items={[
                      { label: "Property managers", href: "/" },
                      { label: countryName, href: `/${formatUrlPath(params.country)}` },
                      { label: stateName, href: `/${formatUrlPath(params.country)}/${formatUrlPath(params.state)}` },
                      { label: cityName }
                    ]}
                  />
                </div>

                <h1 className="text-4xl font-sans font-[100] mb-4">
                  Property Management Companies in {" "}
                    <span style={{ color: "#C65F39", fontWeight: 300 }}>
                      {cityName}, {stateName}
                    </span>
                </h1>

                {/* Show custom bio if it exists, otherwise show default text */}
                <p className="body-text mb-8">
                  {cityBio || `Find and compare property management companies in ${cityName}, ${stateName}. Browse through our comprehensive directory 
                    to discover property managers organized by location, size, and services offered.`}
                </p>

                <p className="text-gray-700 mb-8">
                  Use the filters below to search by property count and more to find the perfect property 
                  management partner for your needs in {cityName}.
                </p>

                <PropertySearch 
                  initialCompanies={properties}
                  country={countryName}
                  state={stateName}
                  city={cityName}
                />
              </div>
            </div>
          </main>
        </PrefetchWrapper>
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading city page:', error);
    return <div>Error loading city data</div>;
  }
}

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const companies = await getPropertyCompanies();
  const paths = new Set();
  
  companies.slice(0, 20).forEach(company => {
    paths.add({
      country: company.country.toLowerCase().replace(/\s+/g, '-'),
      state: company.state.toLowerCase().replace(/\s+/g, '-'),
      city: company.location.toLowerCase().replace(/\s+/g, '-')
    });
  });
  
  return Array.from(paths);
}

export async function generateMetadata({ params }: { 
  params: { country: string; state: string; city: string } 
}): Promise<Metadata> {
  const { country, state, city } = params;
  const properties = await getPropertyCompanies();
  const companyCount = properties.filter(p => 
    p.country === country && 
    p.state === state && 
    p.location === city
  ).length;

  return {
    title: `Property Managers in ${city}, ${state}`,
    description: `Find ${companyCount} property management companies in ${city}, ${state}. Compare services, prices, and reviews.`,
    alternates: {
      canonical: `https://yourdomain.com/${country}/${state}/${city}`
    },
    openGraph: {
      title: `Property Managers in ${city}, ${state}`,
      description: `Browse ${companyCount} property management companies in ${city}`,
      type: 'website',
    }
  }
}

function CityBreadcrumb({ country, state, city }: { country: string, state: string, city: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-deep-blue mb-6">
      <Link href="/">Property managers</Link>
      <ChevronRight className="h-4 w-4" />
      <Link href={`/${country}`}>{country}</Link>
      <ChevronRight className="h-4 w-4" />
      <Link href={`/${country}/${state}`}>{state}</Link>
      <ChevronRight className="h-4 w-4" />
      <span>{city}</span>
    </div>
  )
} 