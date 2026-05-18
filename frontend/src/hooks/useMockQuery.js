import { useQuery } from '@tanstack/react-query';

export const useMockQuery = (queryKey, queryFn) =>
  useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
  });
