"use client"
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  className?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center text-sm">
      {items.map((item, index) => (
        <div key={item.href || index} className="flex items-center">
          {item.href ? (
            <>
              <Link 
                href={item.href}
                className="text-black hover:text-accent-hover px-2"
              >
                {item.label}
              </Link>
              {index < items.length - 1 && (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </>
          ) : (
            <span className="text-gray-900 px-2">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
} 