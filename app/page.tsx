import { getPropertyCompanies } from "@/lib/data"
import HomeContent from "@/components/home-content"
import { Metadata } from 'next'

export default async function Home() {
  const companies = await getPropertyCompanies();
  // console.log("Loaded companies:", companies.map(c => c.name));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-sans font-[300] mb-4">
            Property Management Directory
          </h1>

          <p className="body-text text-gray-700 italic mb-8">
            There are over <span className="text-[#C65F39]">5,000</span> property management companies in this directory with a combined listing count of over
            3M doors. You can search for property management companies by state, city, property count, and more.
          </p>



          <HomeContent companies={companies} />
        </div>
      </div>
    </main>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const properties = await getPropertyCompanies();
  const companyCount = properties.length;

  return {
    title: 'Property Management Directory | Find Local Property Managers',
    description: `Browse our directory of ${companyCount} property management companies. Find and compare local property managers by location, services, and reviews.`,
    alternates: {
      canonical: 'https://yourdomain.com'
    },
    openGraph: {
      title: 'Property Management Directory',
      description: `Find the perfect property manager from our directory of ${companyCount} companies`,
      type: 'website',
    }
  }
}

