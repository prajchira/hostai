import Link from "next/link"
import { getPropertyCompanies, getCountryData } from "@/lib/data"
import { ChevronRight } from "lucide-react";
import PropertySearch from "@/components/property-search";
import LocationList from '@/components/location-list';
import { Metadata } from "next"
import { PrefetchWrapper } from "@/components/prefetch-wrapper"
import { formatUrlPath, groupByNormalizedLocation } from '@/lib/utils'
import { BreadcrumbNav } from "@/components/breadcrumb-nav"

export default async function CountryPage({ params }: { params: { country: string } }) {
  const properties = await getPropertyCompanies();
  
  // Get bio first using the raw param
  const countryBio = await getCountryData(params.country);
  
  const uniqueCountries = groupByNormalizedLocation(properties, 'country');
  const countryData = uniqueCountries.find(
    country => country.normalizedName === formatUrlPath(params.country)
  );

  const countryName = countryData?.displayName || params.country;
  const countryProperties = countryData?.properties || [];

  const states = Array.from(new Set(
    countryProperties.map(company => company.state)
  )).sort();

  // Get first 5 properties in this country for prefetching
  const topProperties = countryProperties
    .slice(0, 5)
    .map(property => `/property/${property.actualID}`);

  // Create state paths for prefetching
  const statePaths = states
  .slice(0, 10)
  .map(state => 
    `/${formatUrlPath(countryName)}/${formatUrlPath(state)}`
  );

  return (
    <PrefetchWrapper 
      paths={[
        '/',  // Home page 
        ...statePaths,  // All state pages
        ...topProperties  // First 5 property detail pages
      ]}
    >
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <BreadcrumbNav 
                items={[
                  { label: "Property managers", href: "/" },
                  { label: countryName }
                ]}
              />
            </div>

            <h1 className="text-4xl font-sans font-[100] mb-4">
              Property Management Companies in{" "}
              <span style={{ color: "#C65F39", fontWeight: 300 }}>
                {countryName}
              </span>
            </h1>

            {/* Show custom bio if it exists, otherwise show default text */}
            <p className="body-text mb-8">
              {countryBio || `Find and compare property management companies in ${countryName}. Browse through our comprehensive directory 
                to discover property managers organized by location, size, and services offered.`}
            </p>

            <LocationList 
              locations={states}
              basePath={`/${params.country}`}
              title="Select a region to view local property managers:"
            />

            <PropertySearch 
              initialCompanies={properties}
              country={countryName}
            />
          </div>
        </div>
      </main>
    </PrefetchWrapper>
  )
}

export const dynamic = 'force-static'
export const revalidate = 3600

export async function generateStaticParams() {
  const companies = await getPropertyCompanies();
  const paths = new Set();
  
  companies.forEach(company => {
    paths.add({
      country: formatUrlPath(company.country)
    });
  });
  
  return Array.from(paths);
}

export async function generateMetadata({ params }: { 
  params: { country: string } 
}): Promise<Metadata> {
  const properties = await getPropertyCompanies();
  const countryName = properties.find(
    (company) => formatUrlPath(company.country) === formatUrlPath(params.country)
  )?.country || params.country;
  
  const companyCount = properties.filter(p => formatUrlPath(p.country) === formatUrlPath(params.country)).length;

  return {
    title: `Property Management Companies in ${countryName}`,
    description: `Find ${companyCount} property management companies in ${countryName}. Compare services, prices, and reviews.`,
    alternates: {
      canonical: `https://yourdomain.com/${params.country}`
    },
    openGraph: {
      title: `Property Management Companies in ${countryName}`,
      description: `Browse ${companyCount} property management companies in ${countryName}`,
      type: 'website',
    }
  }
} 