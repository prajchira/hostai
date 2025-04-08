import { getPropertyCompanies, getPropertyById, PropertyCompany } from "@/lib/data"
import PropertyDetail from "@/components/property-detail"
import { Metadata } from 'next'
import { PrefetchWrapper } from "@/components/prefetch-wrapper"
import { formatUrlPath } from "@/lib/utils"

// Add this helper function
function shouldSkipCityPage(state: string, city: string): boolean {
  return state.toLowerCase() === city.toLowerCase() && state.toLowerCase() !== 'new york';
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const companies = await getPropertyCompanies();
  const property = companies.find(p => p.actualID === params.id);

  if (!property) {
    return <div>Property not found</div>;
  }

  // Get breadcrumb paths for prefetching
  const prefetchPaths = [
    '/',  // Home
    `/${formatUrlPath(property.country)}`,  // Country page
    `/${formatUrlPath(property.country)}/${formatUrlPath(property.state)}`,  // State page
  ];

  // Only add city path if it's different from state
  if (!shouldSkipCityPage(property.state, property.location)) {
    prefetchPaths.push(
      `/${formatUrlPath(property.country)}/${formatUrlPath(property.state)}/${formatUrlPath(property.location)}`
    );
  }

  return (
    <PrefetchWrapper paths={prefetchPaths}>
      <PropertyDetail property={property} companies={companies} />
    </PrefetchWrapper>
  );
}

// Add static rendering with ISR
export const revalidate = 3600 // Revalidate every hour

// Generate static params for popular properties
export async function generateStaticParams() {
  const companies = await getPropertyCompanies();
  return companies
    .slice(0, 20) // Generate top 20 most viewed properties
    .map((company) => ({
      id: company.id,
    }));
}

export async function generateMetadata({ params }: { 
  params: { id: string } 
}): Promise<Metadata> {
  const properties = await getPropertyCompanies();
  const property = properties.find(p => p.actualID === params.id);

  if (!property) {
    return {
      title: 'Property Manager Not Found',
      description: 'The requested property management company could not be found.'
    }
  }

  return {
    title: `${property.name} - Property Management in ${property.location}`,
    description: property.oneLiner || `Learn about ${property.name}, a property management company in ${property.location}, ${property.state}. View services, properties, and contact information.`,
    alternates: {
      canonical: `https://yourdomain.com/property/${property.actualID}`
    },
    openGraph: {
      title: `${property.name} - Property Management`,
      description: property.oneLiner || `Property management services in ${property.location}`,
      type: 'website',
      images: property.images?.[0] ? [{ url: property.images[0] }] : undefined
    }
  }
} 