import Link from "next/link";
import { getPropertyCompanies, PropertyCompany, getStateData } from "@/lib/data";
import PropertyList from "@/components/property-list";
import SearchFilters from "@/components/search-filters";
import { ChevronRight } from "lucide-react";
import PropertySearch from "@/components/property-search";
import LocationList from '@/components/location-list';
import { Metadata } from "next";
import { PrefetchWrapper } from "@/components/prefetch-wrapper"
import { formatUrlPath, groupByNormalizedLocation } from '@/lib/utils'
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

export default async function StatePage({ params }: { params: { country: string; state: string } }) {
  const properties = await getPropertyCompanies();
  
  const uniqueStates = groupByNormalizedLocation(properties, 'state');
  const stateData = uniqueStates.find(
    state => state.normalizedName === formatUrlPath(params.state)
  );

  const stateName = stateData?.displayName || params.state;
  const stateProperties = stateData?.properties.filter(
    company => formatUrlPath(company.country) === formatUrlPath(params.country)
  ) || [];
  const countryName = stateProperties[0]?.country || params.country;

  const cities = Array.from(new Set(
    stateProperties
      .map((company) => company.location)
  )).sort();

  const stateBio = await getStateData(stateName);

  // Get first 5 properties in this state for prefetching
  const topStateProperties = stateProperties
    .slice(0, 5)
    .map(property => `/property/${property.actualID}`);

  // Create city paths for prefetching
  const cityPaths = cities.map(city => 
    `/${formatUrlPath(countryName)}/${formatUrlPath(stateName)}/${formatUrlPath(city)}`
  );

  return (
    <PrefetchWrapper 
      paths={{
        countryPaths: [`/${formatUrlPath(countryName)}`],
        topPropertyPaths: [
          '/',
          ...cityPaths.slice(0, 5),
          ...topStateProperties.slice(0, 5)
        ],
        remainingPropertyPaths: [
          ...cityPaths.slice(5),
          ...topStateProperties.slice(5)
        ]
      }}
    >
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <BreadcrumbNav 
                items={[
                  { label: "Property managers", href: "/" },
                  { label: countryName, href: `/${formatUrlPath(params.country)}` },
                  { label: stateName }
                ]}
              />
            </div>

            <h1 className="text-4xl font-sans font-[100] mb-4">
            Property Management Companies in{" "}
            <span style={{ color: "#C65F39", fontWeight: 300 }}>
              {stateName}, {countryName}
            </span>
            </h1>

            <p className="body-text mb-8">
              {stateBio || `Find and compare property management companies in ${stateName}, ${countryName}. Browse through our comprehensive directory 
                to discover property managers organized by location, size, and services offered.`}
            </p>

            <LocationList 
              locations={cities}
              basePath={`/${params.country}/${params.state}`}
              title="Select a city to view local property managers:"
            />

            <PropertySearch 
              initialCompanies={stateProperties}
              country={countryName}
              state={stateName}
            />
          </div>
        </div>
      </main>
    </PrefetchWrapper>
  );
}

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function generateStaticParams() {
  const companies = await getPropertyCompanies();
  const paths = new Set();
  
  companies.forEach(company => {
    paths.add({
      country: formatUrlPath(company.country),
      state: formatUrlPath(company.state)
    });
  });
  
  return Array.from(paths);
}

export async function generateMetadata({ params }: { 
  params: { country: string; state: string } 
}): Promise<Metadata> {
  const properties = await getPropertyCompanies();
  const companyCount = properties.filter(p => 
    formatUrlPath(p.country) === formatUrlPath(params.country) && 
    formatUrlPath(p.state) === formatUrlPath(params.state)
  ).length;

  return {
    title: `Property Managers in ${params.state}, ${params.country}`,
    description: `Find ${companyCount} property management companies in ${params.state}. Compare services, prices, and reviews.`,
    alternates: {
      canonical: `https://yourdomain.com/${formatUrlPath(params.country)}/${formatUrlPath(params.state)}`
    },
    openGraph: {
      title: `Property Managers in ${params.state}`,
      description: `Browse ${companyCount} property management companies in ${params.state}`,
      type: 'website',
    }
  }
} 