// GQL Client Configuration
// ISO/IEC 39075:2024 compliant setup

import { createGQLClient, MerkleCacheManager } from 'iso-gql-client';

const endpoint = process.env.NEXT_PUBLIC_GQL_ENDPOINT || 'https://countries.trevorblades.com/graphql';

export const gqlClient = createGQLClient({
  endpoint,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  retries: 3,
});

export const cacheManager = new MerkleCacheManager({
  maxSize: 100,
  ttl: 300000, // 5 minutes
  enableMerkleValidation: true,
});

// Example queries
export const GET_COUNTRIES = `
  query GetCountries {
    countries {
      code
      name
      emoji
      capital
      currency
      languages {
        name
      }
    }
  }
`;

export const GET_COUNTRY = `
  query GetCountry($code: ID!) {
    country(code: $code) {
      code
      name
      emoji
      capital
      currency
      languages {
        name
      }
    }
  }
`;

export const SEARCH_COUNTRIES = `
  query SearchCountries($search: String!) {
    countries(filter: { name: { regex: $search } }) {
      code
      name
      emoji
      capital
    }
  }
`;

// Type definitions generated from queries
export interface Country {
  code: string;
  name: string;
  emoji: string;
  capital?: string;
  currency?: string;
  languages: Array<{
    name: string;
  }>;
}

export interface GetCountriesResponse {
  countries: Country[];
}

export interface GetCountryResponse {
  country: Country;
}

export interface SearchCountriesResponse {
  countries: Country[];
}

export interface CountryVariables {
  code: string;
}

export interface SearchVariables {
  search: string;
}
