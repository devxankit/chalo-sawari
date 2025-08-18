declare global {
  interface Window {
    google: typeof google;
  }
  
  const google: {
    maps: {
      places: {
        AutocompleteService: new () => {
          getPlacePredictions(
            request: {
              input: string;
              types?: string[];
              componentRestrictions?: { country: string };
            },
            callback: (
              predictions: Array<{
                place_id: string;
                description: string;
                structured_formatting?: {
                  main_text: string;
                  secondary_text: string;
                };
              }> | null,
              status: string
            ) => void
          ): void;
        };
        PlacesService: new (map: HTMLElement) => {
          getDetails(
            request: {
              placeId: string;
              fields: string[];
            },
            callback: (
              place: {
                name?: string;
                formatted_address?: string;
                geometry?: {
                  location?: {
                    lat(): number;
                    lng(): number;
                  };
                };
                place_id?: string;
              } | null,
              status: string
            ) => void
          ): void;
        };
        PlacesServiceStatus: {
          OK: string;
          ZERO_RESULTS: string;
          OVER_QUERY_LIMIT: string;
          REQUEST_DENIED: string;
          INVALID_REQUEST: string;
          UNKNOWN_ERROR: string;
        };
      };
      Map: new (element: HTMLElement, options?: any) => any;
      LatLng: new (lat: number, lng: number) => {
        lat(): number;
        lng(): number;
      };
    };
  };
}

export {};
