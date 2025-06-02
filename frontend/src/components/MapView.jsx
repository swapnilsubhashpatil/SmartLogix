import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader } from "@googlemaps/js-api-loader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_MAPS_API_KEY = "AIzaSyADQ_BDioK6c7t5VPAfkVPNvuAc7lzX9qw";

function MapView({ draftId }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState({});
  const mapInstance = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndRenderMap = async () => {
      if (!isMounted) return;

      if (!mapRef.current) {
        setError("Map container not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["geometry"],
        });

        const google = await loader.load();

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
        mapInstance.current = map;

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        let mapData;
        try {
          // First, try to fetch existing map data
          const response = await axios.get(
            `${BACKEND_URL}/api/routes/${draftId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          mapData = response.data;
        } catch (getError) {
          // if (getError.response?.status !== 404) {
          //   throw getError;
          // }
          // If map data doesn't exist (404), fetch draft and generate it
          const draftResponse = await axios.get(
            `${BACKEND_URL}/api/drafts/${draftId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const draft = draftResponse.data.draft;
          if (!draft || !draft.routeData?.routeDirections) {
            throw new Error("Draft or route data not found");
          }

          const routesData = draft.routeData.routeDirections.map(
            (direction) => ({
              id: direction.id,
              waypoints: direction.waypoints,
              state: direction.state,
            })
          );

          // Send routesData directly as the request body (an array)
          const postResponse = await axios.post(
            `${BACKEND_URL}/api/routes`,
            [...routesData, { draftId: draftId }], // Append draftId as an object in the array
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          mapData = {
            routes: postResponse.data,
            originalRoute: routesData,
          };

          // First, fetch the userId from the authenticated user's token
          const userResponse = await axios.get(
            `${BACKEND_URL}/protectedRoute`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const userId = userResponse.data.user.id; // Extract userId from the response

          // Use PUT /api/drafts/:id to update the draft with mapData and userId
          await axios.put(
            `${BACKEND_URL}/api/drafts/${draftId}`,
            { mapData, userId }, // Send both mapData and userId in the request body
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }

        const { routes: processedRoutes, originalRoute } = mapData;
        const formattedRoutes = {};
        const bounds = new google.maps.LatLngBounds();

        Object.entries(processedRoutes).forEach(([id, route]) => {
          if (id === "draftId") return;
          const routeDirection = originalRoute.find((dir) => dir.id === id);
          if (!routeDirection) return;

          formattedRoutes[id] = {
            ...route,
            origin: routeDirection.waypoints[0],
            destination: routeDirection.waypoints[1],
            state: routeDirection.state,
          };

          if (route.state === "land" && route.encodedPolyline) {
            const path = google.maps.geometry.encoding.decodePath(
              route.encodedPolyline
            );
            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: "#FF0000",
              strokeOpacity: 1.0,
              strokeWeight: 2,
            });
            polyline.setMap(map);

            // Add markers for start and end of the land route
            const startLatLng = path[0];
            const endLatLng = path[path.length - 1];

            const startMarker = new google.maps.Marker({
              position: startLatLng,
              map: map,
              title: routeDirection.waypoints[0],
            });

            const endMarker = new google.maps.Marker({
              position: endLatLng,
              map: map,
              title: routeDirection.waypoints[1],
            });

            // Add info windows for place names
            const startInfoWindow = new google.maps.InfoWindow({
              content: `<div>${routeDirection.waypoints[0]}</div>`,
            });
            const endInfoWindow = new google.maps.InfoWindow({
              content: `<div>${routeDirection.waypoints[1]}</div>`,
            });

            startMarker.addListener("click", () => {
              startInfoWindow.open(map, startMarker);
            });
            endMarker.addListener("click", () => {
              endInfoWindow.open(map, endMarker);
            });

            path.forEach((latLng) => bounds.extend(latLng));
          } else if (
            (route.state === "air" || route.state === "sea") &&
            route.coordinates
          ) {
            const path = route.coordinates.map((coord) => ({
              lat: coord.lat,
              lng: coord.lng,
            }));
            const color = route.state === "air" ? "#00FF00" : "#0000FF";
            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: color,
              strokeOpacity: 1.0,
              strokeWeight: 2,
            });
            polyline.setMap(map);

            // Add markers for start and end of the air/sea route
            const startLatLng = path[0];
            const endLatLng = path[path.length - 1];

            const startMarker = new google.maps.Marker({
              position: startLatLng,
              map: map,
              title: routeDirection.waypoints[0],
            });

            const endMarker = new google.maps.Marker({
              position: endLatLng,
              map: map,
              title: routeDirection.waypoints[1],
            });

            // Add info windows for place names
            const startInfoWindow = new google.maps.InfoWindow({
              content: `<div>${routeDirection.waypoints[0]}</div>`,
            });
            const endInfoWindow = new google.maps.InfoWindow({
              content: `<div>${routeDirection.waypoints[1]}</div>`,
            });

            startMarker.addListener("click", () => {
              startInfoWindow.open(map, startMarker);
            });
            endMarker.addListener("click", () => {
              endInfoWindow.open(map, endMarker);
            });

            path.forEach((latLng) => bounds.extend(latLng));
          }
        });

        if (isMounted) {
          setRoutes(formattedRoutes);
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load map data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (draftId && GOOGLE_MAPS_API_KEY) {
      fetchAndRenderMap();
    } else {
      setError("No draft ID or Google Maps API key provided");
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        google.maps.event.clearInstanceListeners(mapInstance.current);
        mapInstance.current = null;
      }
    };
  }, [draftId]);

  return (
    <div className="relative h-96 rounded-lg overflow-hidden shadow-md">
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        className="absolute top-0 left-0 w-full h-full"
      />

      {loading && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">
            {error || "No routes available to display"}
          </p>
        </div>
      )}
    </div>
  );
}

export default MapView;
