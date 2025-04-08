import { getPropertyCompanies } from "@/lib/data";
import PropertyList from "./property-list";

export default async function SuggestedProperties() {
  const companies = await getPropertyCompanies();
  const suggestedCompanies = companies.slice(0, 5); // Get first 5 companies

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Suggested Properties</h2>
      <PropertyList 
        searchQuery=""
        companies={suggestedCompanies}
      />
    </div>
  );
} 