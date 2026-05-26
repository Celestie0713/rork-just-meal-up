import { z } from "zod";
import { publicProcedure } from "../../create-context";

export const resolveAddressProcedure = publicProcedure
  .input(
    z.object({
      latitude: z.number(),
      longitude: z.number(),
    })
  )
  .query(async ({ input }) => {
    console.log("[Places ResolveAddress] Resolving:", input.latitude, input.longitude);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${input.latitude}&lon=${input.longitude}&format=json&accept-language=en&zoom=18`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "JustMealUp/1.0",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        console.error("[Places ResolveAddress] Nominatim error:", response.status);
        throw new Error("Failed to resolve address");
      }

      const data = await response.json();
      const addr = data?.address;

      if (!addr) {
        throw new Error("No address data returned");
      }

      // Build the formatted address from components
      const street = addr.road || addr.pedestrian || addr.footway || addr.path || "";
      const houseNumber = addr.house_number || "";
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || "";
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
      const state = addr.state || "";
      const country = addr.country || "";
      const postcode = addr.postcode || "";

      // Build a clean address string
      const addressParts: string[] = [];
      if (houseNumber && street) {
        addressParts.push(`${houseNumber} ${street}`);
      } else if (street) {
        addressParts.push(street);
      }
      if (neighbourhood && !addressParts.length) {
        addressParts.push(neighbourhood);
      }

      const address = addressParts.join(", ") || data.display_name?.split(",")[0]?.trim() || "";

      console.log("[Places ResolveAddress] Resolved:", address, city, country);

      return {
        address,
        city,
        country,
        state,
        postcode,
        displayName: data.display_name || "",
      };
    } catch (error) {
      console.error("[Places ResolveAddress] Error:", error);
      throw new Error("Failed to resolve address. Please try again.");
    }
  });
