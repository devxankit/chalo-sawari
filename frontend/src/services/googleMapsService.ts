// Google Maps Places API service for location autocomplete
export interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

class GoogleMapsService {
  private apiKey: string;
  private autocompleteService: any = null;
  private placesService: any = null;
  private map: any = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private scriptLoaded: boolean = false;

  constructor() {
    // You'll need to add your Google Maps API key to your environment variables
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.');
      console.warn('Make sure your .env file is in the frontend directory and contains: VITE_GOOGLE_MAPS_API_KEY=your_key_here');
    }
  }

  // Initialize Google Maps services
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      return;
    }
    
    if (this.isInitialized) {
      return;
    }
    
    this.isInitializing = true;
    
    try {
      if (typeof (window as any).google === 'undefined') {
        await this.loadGoogleMapsScript();
      }
      
      // Wait a bit for the script to fully load
      await this.waitForGoogleMaps();
      
      if (typeof (window as any).google !== 'undefined' && (window as any).google.maps && (window as any).google.maps.places) {
        this.autocompleteService = new (window as any).google.maps.places.AutocompleteService();
        this.placesService = new (window as any).google.maps.places.PlacesService(this.createDummyMap());
        this.isInitialized = true;
      } else {
        console.error('Google Maps failed to load properly');
      }
    } catch (error) {
      console.error('Error initializing Google Maps service:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  // Wait for Google Maps to be fully loaded
  private waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve) => {
      const checkGoogleMaps = () => {
        if (typeof (window as any).google !== 'undefined' && 
            (window as any).google.maps && 
            (window as any).google.maps.places &&
            (window as any).google.maps.places.AutocompleteService) {
          resolve();
        } else {
          setTimeout(checkGoogleMaps, 100);
        }
      };
      checkGoogleMaps();
    });
  }

  // Load Google Maps script dynamically
  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).google !== 'undefined') {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      // Check if script is already being loaded or loaded
      if (this.scriptLoaded) {
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        reject(new Error('Failed to load Google Maps script'));
      };
      
      document.head.appendChild(script);
    });
  }

  // Create a dummy map element for Places service
  private createDummyMap(): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    return div;
  }

  // Get location suggestions based on input
  async getLocationSuggestions(input: string): Promise<LocationSuggestion[]> {
    if (!this.isInitialized || !this.autocompleteService || !input.trim()) {
      return [];
    }

    try {
      const request = {
        input: input,
        // Use only geocode type - it covers cities, addresses, landmarks, etc.
        // Alternative options (use only one):
        // types: ['(cities)'] - for cities only
        // types: ['(regions)'] - for states/provinces
        // types: ['geocode'] - for all types (recommended)
        types: ['geocode'],
        componentRestrictions: { country: 'IN' }, // Restrict to India
      };

      return new Promise((resolve) => {
        this.autocompleteService.getPlacePredictions(request, (predictions: any, status: string) => {
          // Check if status is OK (string comparison)
          if (status === 'OK' && predictions && predictions.length > 0) {
            const suggestions: LocationSuggestion[] = predictions.map((prediction: any) => ({
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting?.main_text || '',
                secondary_text: prediction.structured_formatting?.secondary_text || ''
              }
            }));
            resolve(suggestions);
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      return [];
    }
  }

  // Get place details by place_id
  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.placesService) {
      return null;
    }

    try {
      const request = {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry', 'place_id']
      };

      return new Promise((resolve) => {
        this.placesService.getDetails(request, (place: any, status: string) => {
          if (status === 'OK' && place) {
            resolve(place);
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  // Check if service is ready
  isReady(): boolean {
    const ready = this.isInitialized && this.autocompleteService !== null && this.placesService !== null;
    return ready;
  }

  // Force re-initialization
  async reinitialize(): Promise<void> {
    // Only reinitialize if not already initialized or if there's an issue
    if (!this.isInitialized && !this.isInitializing) {
      await this.initialize();
    }
  }
}

// Create and export a singleton instance
export const googleMapsService = new GoogleMapsService();

// Initialize the service when the module is imported
googleMapsService.initialize().catch(console.error);
