import { z } from "zod";
import { publicProcedure } from "../../create-context";

export const resolveAddressProcedure = publicProcedure
  .input(
    z.object({
      name: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const { name, city, country, latitude, longitude } = input;
    console.log("[Places ResolveAddress] Input:", { name, city, country, latitude, longitude });

    const headers = {
      "User-Agent": "JustMealUp/1.0",
      "Accept": "application/json",
    };

    // Strategy 1: Forward search by restaurant name + city + country
    // This is the most reliable — same approach Google Maps uses
    if (name && (city || country)) {
      try {
        const searchQuery = [name, city, country].filter(Boolean).join(", ");
        const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=en&addressdetails=1`;
        
        console.log("[Places ResolveAddress] Forward search:", searchQuery);
        const response = await fetch(searchUrl, { headers });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const result = data[0];
            const addr = result.address;
            
            if (addr) {
              const street = addr.road || addr.pedestrian || addr.footway || addr.path || "";
              const houseNumber = addr.house_number || "";
              const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || "";
              const resolvedCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
              const state = addr.state || "";
              const resolvedCountry = addr.country || "";
              const postcode = addr.postcode || "";

              // Build a clean address string
              const addressParts: string[] = [];
              if (houseNumber && street) {
                addressParts.push(`${houseNumber} ${street}`);
              } else if (street) {
                addressParts.push(street);
              }
              if (neighbourhood && addressParts.length === 0) {
                addressParts.push(neighbourhood);
              }
              
              const address = addressParts.join(", ") || result.display_name?.split(",")[0]?.trim() || "";

              console.log("[Places ResolveAddress] Forward search resolved:", address, resolvedCity, resolvedCountry);

              return {
                address,
                city: resolvedCity || city || "",
                country: resolvedCountry || country || "",
                state,
                postcode,
                displayName: result.display_name || "",
                source: "forward-search" as const,
              };
            }
          }
        }
      } catch (error) {
        console.log("[Places ResolveAddress] Forward search failed, falling back:", error);
      }
    }

    // Strategy 2: Reverse geocode coordinates (fallback)
    if (latitude != null && longitude != null) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en&zoom=18&addressdetails=1`;
        
        console.log("[Places ResolveAddress] Reverse geocode fallback:", latitude, longitude);
        const response = await fetch(url, { headers });

        if (!response.ok) {
          console.error("[Places ResolveAddress] Nominatim reverse error:", response.status);
          throw new Error("Failed to resolve address");
        }

        const data = await response.json();
        const addr = data?.address;

        if (!addr) {
          throw new Error("No address data returned");
        }

        const street = addr.road || addr.pedestrian || addr.footway || addr.path || "";
        const houseNumber = addr.house_number || "";
        const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || "";
        const resolvedCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
        const state = addr.state || "";
        const resolvedCountry = addr.country || "";
        const postcode = addr.postcode || "";

        const addressParts: string[] = [];
        if (houseNumber && street) {
          addressParts.push(`${houseNumber} ${street}`);
        } else if (street) {
          addressParts.push(street);
        }
        if (neighbourhood && addressParts.length === 0) {
          addressParts.push(neighbourhood);
        }

        const address = addressParts.join(", ") || data.display_name?.split(",")[0]?.trim() || "";

        console.log("[Places ResolveAddress] Reverse geocode resolved:", address, resolvedCity, resolvedCountry);

        return {
          address,
          city: resolvedCity || city || "",
          country: resolvedCountry || country || "",
          state,
          postcode,
          displayName: data.display_name || "",
          source: "reverse-geocode" as const,
        };
      } catch (error) {
        console.error("[Places ResolveAddress] Reverse geocode error:", error);
        throw new Error("Failed to resolve address. Please try again.");
      }
    }

    throw new Error("Not enough information to resolve address. Please provide name/city/country or coordinates.");
  });
