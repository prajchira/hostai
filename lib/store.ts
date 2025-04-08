import { configureStore } from '@reduxjs/toolkit'
import { prefetchApi } from './hooks/usePrefetch'

export const store = configureStore({
  reducer: {
    [prefetchApi.reducerPath]: prefetchApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(prefetchApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 