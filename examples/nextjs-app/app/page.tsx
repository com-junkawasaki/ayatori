'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'iso-gql-client'
import {
  GET_COUNTRIES,
  GET_COUNTRY,
  SEARCH_COUNTRIES,
  type Country,
  type GetCountriesResponse,
  type GetCountryResponse,
  type SearchCountriesResponse,
  type CountryVariables,
  type SearchVariables
} from '../lib/gql-client'

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Fetch all countries
  const {
    data: countriesData,
    loading: countriesLoading,
    error: countriesError,
    refetch: refetchCountries
  } = useQuery<GetCountriesResponse>(GET_COUNTRIES, {
    fetchPolicy: 'cache-first'
  })

  // Fetch single country
  const {
    data: countryData,
    loading: countryLoading,
    error: countryError,
    refetch: refetchCountry
  } = useQuery<GetCountryResponse, CountryVariables>(
    GET_COUNTRY,
    {
      variables: { code: selectedCountry },
      skip: !selectedCountry,
      fetchPolicy: 'network-only'
    }
  )

  // Search countries
  const {
    data: searchData,
    loading: searchLoading,
    error: searchError,
    refetch: refetchSearch
  } = useQuery<SearchCountriesResponse, SearchVariables>(
    SEARCH_COUNTRIES,
    {
      variables: { search: searchTerm },
      skip: !searchTerm,
      fetchPolicy: 'cache-and-network'
    }
  )

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Countries List */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Countries ({countriesData?.countries?.length || 0})
              </h3>
              <button
                onClick={() => refetchCountries()}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={countriesLoading}
              >
                {countriesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {countriesError && (
              <div className="mt-4 text-red-600 text-sm">
                Error: {countriesError.message}
              </div>
            )}

            <div className="mt-4 max-h-96 overflow-y-auto">
              {countriesLoading ? (
                <div className="text-center py-4">Loading countries...</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {countriesData?.countries?.slice(0, 20).map((country: Country) => (
                    <li
                      key={country.code}
                      className="py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleCountrySelect(country.code)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{country.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {country.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {country.capital}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Country Details */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Country Details
            </h3>

            {selectedCountry && (
              <div className="mt-4">
                <button
                  onClick={() => refetchCountry()}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={countryLoading}
                >
                  {countryLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            )}

            {countryError && (
              <div className="mt-4 text-red-600 text-sm">
                Error: {countryError.message}
              </div>
            )}

            {countryLoading ? (
              <div className="mt-4 text-center py-4">Loading country details...</div>
            ) : countryData?.country ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{countryData.country.emoji}</span>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {countryData.country.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Code: {countryData.country.code}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Capital:</span>
                    <p className="text-gray-900">{countryData.country.capital || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Currency:</span>
                    <p className="text-gray-900">{countryData.country.currency || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-500">Languages:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {countryData.country.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {lang.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedCountry ? (
              <div className="mt-4 text-center py-4 text-gray-500">
                No country data available
              </div>
            ) : (
              <div className="mt-4 text-center py-4 text-gray-500">
                Select a country to view details
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Search Countries
            </h3>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Search by name..."
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {searchError && (
              <div className="mt-4 text-red-600 text-sm">
                Error: {searchError.message}
              </div>
            )}

            <div className="mt-4 max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="text-center py-4">Searching...</div>
              ) : searchData?.countries ? (
                <ul className="divide-y divide-gray-200">
                  {searchData.countries.map((country: Country) => (
                    <li
                      key={country.code}
                      className="py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleCountrySelect(country.code)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{country.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {country.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {country.capital}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : searchTerm ? (
                <div className="text-center py-4 text-gray-500">
                  No results found
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Enter a search term
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Merkle DAG Info */}
      <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Merkle DAG Information
          </h3>
          <div className="mt-4 text-sm text-gray-600">
            <p>This demo showcases the ISO/IEC 39075:2024 GQL Client with:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Type-safe queries with TypeScript</li>
              <li>Merkle DAG based caching</li>
              <li>Content-addressable storage</li>
              <li>Deterministic query execution</li>
              <li>Process network topology management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
