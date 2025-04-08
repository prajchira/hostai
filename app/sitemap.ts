import { getPropertyCompanies } from "@/lib/data"

export default async function sitemap() {
  const properties = await getPropertyCompanies();
  
  return properties.map(property => ({
    url: `https://yourdomain.com/property/${property.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
} 