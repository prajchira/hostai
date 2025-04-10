"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PrefetchWrapperProps {
  paths: {
    countryPaths: string[];
    topPropertyPaths: string[];
    remainingPropertyPaths: string[];
  };
  children: React.ReactNode
}

export function PrefetchWrapper({ paths, children }: PrefetchWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch each batch of paths
    if (paths.countryPaths) {
      paths.countryPaths.forEach(path => router.prefetch(path));
    }
    if (paths.topPropertyPaths) {
      paths.topPropertyPaths.forEach(path => router.prefetch(path));
    }
    if (paths.remainingPropertyPaths) {
      paths.remainingPropertyPaths.forEach(path => router.prefetch(path));
    }
  }, [paths, router]);

  return <>{children}</>;
}