"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PrefetchWrapperProps {
  paths: string[]
  children: React.ReactNode
}

export function PrefetchWrapper({ paths, children }: PrefetchWrapperProps) {
  const router = useRouter()

  useEffect(() => {
    // Log which paths are being prefetched
 
    paths.forEach(path => {
     
      router.prefetch(path)
    })
  }, [paths, router])

  return (
    <>
      {/* Add static prefetch links that work on both client and server */}
      {paths.map(path => (
        <link 
          key={path} 
          rel="prefetch" 
          href={path} 
        />
      ))}
      {children}
    </>
  );
} 