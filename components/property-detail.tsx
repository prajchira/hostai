"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Star, Globe, Facebook, Twitter, Linkedin, ChevronLeft, CheckCircle, House } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PropertyCompany } from "@/lib/data"
import React from "react"
import { Button } from "@/components/ui/button"
import dynamic from 'next/dynamic'
import { formatUrlPath } from '@/lib/utils'

import { BreadcrumbNav } from "@/components/breadcrumb-nav"



// Dynamically import heavy components
const ContactManagerDialog = dynamic(() => import('./contact-manager-dialog'), {
  loading: () => <p>Loading...</p>,
  ssr: false // If it's client-only
})


const PropertyList = dynamic(() => import('./property-list'))

interface PropertyDetailProps {
  property: PropertyCompany;
  companies: PropertyCompany[];
}

export default function PropertyDetail({ property, companies }: PropertyDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isContactOpen, setIsContactOpen] = React.useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => {
      const newIndex = prev === property.images.length - 1 ? 0 : prev + 1;
      
      // Scroll thumbnails when using chevron
      const container = document.getElementById('thumbnail-strip');
      const nextThumb = document.querySelector(`[data-index="${newIndex}"]`);
      
      if (container && nextThumb) {
        const newScrollPosition = (nextThumb as HTMLElement).offsetLeft - container.offsetLeft;
        container.scrollTo({
          left: newScrollPosition,
          behavior: 'smooth'
        });
      }
      
      return newIndex;
    });
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => {
      const newIndex = prev === 0 ? property.images.length - 1 : prev - 1;
      
      // Scroll thumbnails when using chevron
      const container = document.getElementById('thumbnail-strip');
      const prevThumb = document.querySelector(`[data-index="${newIndex}"]`);
      
      if (container && prevThumb) {
        const newScrollPosition = (prevThumb as HTMLElement).offsetLeft - container.offsetLeft;
        container.scrollTo({
          left: newScrollPosition,
          behavior: 'smooth'
        });
      }
      
      return newIndex;
    });
  };

  const similarProperties = companies.filter(c => 
    c.id !== property.id && 
    c.location.toLowerCase() === property.location.toLowerCase()
  );

  const stateProperties = companies.filter(c => 
    c.id !== property.id && 
    c.state.toLowerCase() === property.state.toLowerCase() &&
    c.location.toLowerCase() !== property.location.toLowerCase()
  ).slice(0, 5);

  const countryProperties = companies.filter(c => 
    c.id !== property.id && 
    c.country.toLowerCase() === property.country.toLowerCase() &&
    c.state.toLowerCase() !== property.state.toLowerCase()
  ).slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": property.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location,
      "addressRegion": property.state,
      "addressCountry": property.country
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": property.rating,
      "reviewCount": property.totalReviews
    }
  };

  function getBreadcrumbItems(property: PropertyCompany) {
    return [
      { label: "Property managers", href: "/" },
      { label: property.country, href: `/${formatUrlPath(property.country)}` },
      { label: property.state, href: `/${formatUrlPath(property.country)}/${formatUrlPath(property.state)}` },
      { label: property.location, href: `/${formatUrlPath(property.country)}/${formatUrlPath(property.state)}/${formatUrlPath(property.location)}` },
      { label: property.name }
    ].filter((item, index, array) => {
      // Skip city if it's same as state (except New York)
      if (index === 3) { // city item
        return !shouldSkipCityPage(property.state, property.location);
      }
      return true;
    });
  }

  function shouldSkipCityPage(state: string, city: string): boolean {
    // Skip if city name matches state name, except for New York
    return state.toLowerCase() === city.toLowerCase() && state.toLowerCase() !== 'new york';
  }


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Upper section with sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            {/* Main Content - Takes up 2/3 of the space */}
            <div className="lg:col-span-2">
              {/* Breadcrumb */}
              <div className="mb-6">
                <BreadcrumbNav 
                  items={getBreadcrumbItems(property)}
                />
              </div>

              {/* Company Header */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative w-32 h-32 rounded-[var(--radius)] overflow-hidden bg-white border">
                  <Image
                    src={property.logo || "/placeholder.svg"}
                    alt={`${property.name} logo`}
                    fill
                    className="object-contain p-2"
                    sizes="32px"
                    unoptimized={property.logo?.startsWith('http')}
                  />
                </div>
                <div>
                  <div className="space-y-2">
                    <h1 className="large-heading">
                      {property.name}
                    </h1>
                    <p className="description-text text-gray-600">
                      {property.oneLiner}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 my-5">

                    <Badge variant="outline" className="flex items-center gap-1 bg-white border-gray-200 font-normal text-gray-700">
                          {property.location}
                        </Badge>

                        <Badge variant="outline" className="flex items-center gap-1 bg-white border-gray-200 font-normal text-gray-700">
                          {property.state}
                        </Badge>

                        {property.country && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-white border-gray-200 font-normal text-gray-700">
                            {property.country}
                          </Badge>
                        )}

                        {/* {company.tags?.includes("Verified") && (
                          <Badge variant="outline" className="flex items-center gap-5 bg-white border-gray-200 font-normal text-gray-700">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            Verified
                          </Badge>
                        )} */}

                        {property.isVerified && (
                          <Badge variant="outline" className="flex items-center gap-5 bg-white border-gray-200 font-normal text-gray-700">
                            ✓ Verified
                          </Badge>
                        )}

                        <Badge variant="outline" className="flex items-center gap-0.5 bg-white border-gray-200 py-2 font-normal text-gray-700">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          {property.rating ? property.rating.toFixed(2) : 'N/A'}
                        </Badge>

                        {property.tags && (
                          <Badge variant="outline" className="flex items-center gap-0.5 bg-white border-gray-200 py-2 font-normal text-gray-700">
                            {property.tags}
                          </Badge>
                        )}

                      </div>
                  </div>
                </div>

              {/* Description */}
              <div className="prose max-w-none mb-12">
                {property.introBlog ? (
                  <p>{property.introBlog}</p>
                ) : (
                  <p>{property.description}</p>
                )}
              </div>

                {/* Property Images Slider */}
                {property.images.length > 0 && (
                  <div className="mb-12">
                    {/* Main Image Display */}
                    <div className="relative aspect-[16/9] rounded-[var(--radius)] overflow-hidden mb-4">
                      <Image
                        src={property.images[currentImageIndex]}
                        alt={`Property image ${currentImageIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 66vw"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                      />
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-[var(--radius)] text-white hover:bg-black/75"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-[var(--radius)] text-white hover:bg-black/75"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="relative">
                      <div 
                        id="thumbnail-strip"
                        className="flex gap-4 overflow-x-auto scrollbar-hid rounded-[var(--radius)]"
                      >
                        {[...property.images, ...property.images, ...property.images].map((image, index) => {
                          const thumbnailRef = React.useRef<HTMLButtonElement>(null);
                          const actualIndex = index % property.images.length;
                          
                          return (
                            <button
                              ref={thumbnailRef}
                              key={index}
                              data-index={actualIndex}
                              onClick={() => {
                                setCurrentImageIndex(actualIndex);
                                
                                // Get the clicked thumbnail element and container
                                const thumbnail = thumbnailRef.current;
                                const container = document.getElementById('thumbnail-strip');
                                
                                if (thumbnail && container) {
                                  // Calculate the scroll position that would put this thumbnail at the left
                                  const newScrollPosition = thumbnail.offsetLeft - container.offsetLeft;
                                  
                                  // Smooth scroll to position
                                  container.scrollTo({
                                    left: newScrollPosition,
                                    behavior: 'smooth'
                                  });
                                }
                              }}
                              className={`relative flex-shrink-0 w-48 h-32 rounded-[var(--radius)] overflow-hidden transition-all duration-200 ${
                                actualIndex === currentImageIndex 
                                  ? 'opacity-100 ring-2 ring-accent' 
                                  : 'opacity-50 hover:opacity-75'
                              }`}
                            >
                              <Image
                                src={image}
                                alt={`Thumbnail ${actualIndex + 1}`}
                                fill
                                className="object-cover"
                                sizes="192px"
                                loading="lazy"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* HTML Blog Content */}
                {property.blog && (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: property.blog 
                    }} 
                    className="
                      space-y-8 
                      [&_p]:mb-8 
                      [&_h2]:large-heading 
                      [&_h2]:font-weight-400
                      [&_h2]:mt-12 
                      [&_h2]:mb-6 
                      [&_h3]:large-heading 
                      [&_h3]:font-weight-100 
                      [&_h3]:mt-8 
                      [&_h3]:mb-4
                      [&_ul]:mb-8
                      [&_li]:mb-2
                    "
                  />
                )}

                {/* Key Features Summary */}
                {property.keyFeatures && property.keyFeatures.length > 0 && (
                  <div className="mt-8 mb-12 p-6 bg-gray-50 rounded-[var(--radius)] border border-gray-200">
                    <div 
                      className="space-y-4 [&_li]:before:content-['•'] [&_li]:before:mr-4 [&_li]:before:min-w-[1rem] [&_h3]:mid-heading" 
                      dangerouslySetInnerHTML={{ __html: property.keyFeatures }} 
                    />
                  </div>
                )}
              </div>

            

            {/* Sidebar - Takes up 1/3 of the space */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* About Section */}
                <div className="bg-white rounded-[var(--radius)] border p-4 mb-4">
                  <h2 className="mid-heading mb-4">About</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="body-text text-gray-600">Property Count</span>
                      <span className="body-text text-[#050505]">{property.propertyCount ?? 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="body-text text-gray-600">Year Founded</span>
                      <span className="body-text text-[#050505]">{property.yearFounded ?? 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="body-text text-gray-600">Total Reviews</span>
                      <span className="body-text text-[#050505]">{property.totalReviews ?? 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="body-text text-gray-600">Rating</span>
                      <span className="body-text text-[#050505] flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        {property.rating?.toFixed(2) ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                  {/* Contact Manager Button */}
                  <div className="mb-4">
                    <ContactManagerDialog 
                      isOpen={isContactOpen}
                      onClose={() => setIsContactOpen(false)}
                      propertyManagerName={property.name}
                    />
                    <Button 
                      className="w-full bg-accent hover:bg-accent-hover py-6 text-base"
                      onClick={() => setIsContactOpen(true)}
                    >
                      Contact manager
                    </Button>
                  </div>

                  {/* Claim Profile - Only show if not verified */}
                  {!property.isVerified && (
                    <div className="mb-4">
                      <Button 
                        className="w-full bg-white border border-gray-200 hover:bg-gray-50 py-6 text-base text-black"
                        onClick={() => setIsContactOpen(true)}
                      >
                        Claim Profile
                      </Button>
                    </div>
                  )}

                  {/* More Info Section */}
                  <div className="bg-white rounded-[var(--radius)] border p-4">
                    <h2 className="mid-heading mb-4">More Info</h2>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="body-text text-gray-600">Country</span>
                        <span className="body-text text-[#050505]">{property.country}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="body-text text-gray-600">State</span>
                        <span className="body-text text-[#050505]">{property.state}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="body-text text-gray-600">City</span>
                        <span className="body-text text-[#050505]">{property.location}</span>
                      </div>
                      {property.yearFounded && (
                        <div className="flex justify-between items-center">
                        <span className="body-text text-gray-600">Year Founded</span>
                        <span className="body-text text-[#050505]">{property.yearFounded}</span>
                      </div>
                      )}
                      {property.employees && (
                        <div>
                          <h3 className="body-text text-gray-600">Employees</h3>
                          <p className="body-text text-[#050505]">{property.employees}</p>
                        </div>
                      )}
                      <div>
                        <h3 className="body-text text-gray-600">Links</h3>
                        <div className="flex gap-4 mt-2">
                          {property.website && (
                            <a href={property.website} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-5 w-5 text-gray-600 hover:text-[#C65F39] transition-colors" />
                            </a>
                          )}
                          {property.airbnbUrl && (
                            <a href={property.airbnbUrl} target="_blank" rel="noopener noreferrer">
                              <House className="h-5 w-5 text-gray-600 hover:text-[#C65F39] transition-colors" />
                            </a>
                          )}
                          {property.socialMedia?.facebook && (
                            <a href={property.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                              <Facebook className="h-5 w-5 text-gray-600 hover:text-[#C65F39] transition-colors" />
                            </a>
                          )}
                          {property.socialMedia?.twitter && (
                            <a href={property.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                              <Twitter className="h-5 w-5 text-gray-600 hover:text-[#C65F39] transition-colors" />
                            </a>
                          )}
                          {property.socialMedia?.linkedin && (
                            <a href={property.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-5 w-5 text-gray-600 hover:text-[#C65F39] transition-colors" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full width suggested companies section */}
            <div>
              <h1 className="large-heading mb-6">Suggested Companies</h1>
              
              {/* Similar Properties in City */}
              <div className="mb-12">
                <div className="border-t border-gray-200 pt-12 mb-12">
                  <h2 className="mid-heading mb-6">More Property Managers in {property.location}</h2>
                  {similarProperties.length > 0 ? (
                    <PropertyList
                      searchQuery=""
                      country={property.country}
                      state={property.state}
                      city={property.location}
                      companies={similarProperties}
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
                <div className="border-gray-200 pt-12 mb-12">
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
                <div className="border-t border-gray-200 pt-12 mb-12">
                  <h2 className="mid-heading mb-6">Property Managers in {property.country}</h2>
                  <PropertyList
                    searchQuery=""
                    country={property.country}
                    companies={countryProperties}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
} 