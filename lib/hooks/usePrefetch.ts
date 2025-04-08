import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { useEffect } from 'react'

// Create an API slice for prefetching
export const prefetchApi = createApi({
  reducerPath: 'prefetchApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
    getPage: builder.query<any, string>({
      query: (path) => path,
    }),
  }),
})

// Export the hooks
export const { useGetPageQuery, usePrefetch: useRTKPrefetch } = prefetchApi

// Custom hook that combines RTK prefetch with options
export function usePrefetch(path: string, options: { force?: boolean; ifOlderThan?: number } = {}) {
  const prefetch = useRTKPrefetch('getPage')

  useEffect(() => {
    if (options.force) {
      prefetch(path, { force: true })
    } else if (options.ifOlderThan) {
      prefetch(path, { ifOlderThan: options.ifOlderThan })
    }
  }, [path, options, prefetch])

  return () => prefetch(path, options)
}