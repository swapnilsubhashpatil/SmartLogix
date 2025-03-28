import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  Polyline,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useParams, useNavigate } from "react-router-dom";

const GOOGLE_MAPS_API_KEY = "AIzaSyAmyeWi4SPcXM7dkR1hduoIqL5uyMXtqUk";

function decodePolyline(encoded) {
  if (!encoded) return [];
  const poly = [];
  let index = 0,
    lat = 0,
    lng = 0;
  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return poly;
}

function calculateMapCenter(routes) {
  let allCoords = [];

  Object.values(routes).forEach((route) => {
    if (route.encodedPolyline) {
      allCoords = [...allCoords, ...decodePolyline(route.encodedPolyline)];
    } else if (route.coordinates) {
      allCoords = [...allCoords, ...route.coordinates];
    }
  });

  if (allCoords.length === 0) return { lat: 0, lng: 0 };

  const sumLat = allCoords.reduce((sum, coord) => sum + coord.lat, 0);
  const sumLng = allCoords.reduce((sum, coord) => sum + coord.lng, 0);

  return {
    lat: sumLat / allCoords.length,
    lng: sumLng / allCoords.length,
  };
}

function getRouteTypeIcon(type) {
  switch (type) {
    case "land":
      return (
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          ></path>
        </svg>
      );
    case "sea":
      return (
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          ></path>
        </svg>
      );
    case "air":
      return (
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          ></path>
        </svg>
      );
    default:
      return null;
  }
}

function formatRouteName(id, routes) {
  const route = routes[id];
  if (route) {
    return `${route.origin} to ${route.destination}`;
  }
  return `Route ${id}`;
}

function RouteMap() {
  const { routeId, routeData } = useParams();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [mapZoom, setMapZoom] = useState(3);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!routeData) return;

    try {
      // Retrieve route data from sessionStorage using the key from URL
      const routeDataObj = JSON.parse(sessionStorage.getItem(routeData));
      if (!routeDataObj)
        throw new Error("No route data found in sessionStorage");

      const { originalRoute, processedRoutes } = routeDataObj;

      const formattedRoutes = {};
      Object.entries(processedRoutes).forEach(([id, route]) => {
        const routeDirection = originalRoute.routeDirections.find(
          (dir) => dir.id === id
        );
        formattedRoutes[id] = {
          ...route,
          origin: routeDirection.waypoints[0],
          destination: routeDirection.waypoints[1],
          name: `${routeDirection.waypoints[0]} to ${routeDirection.waypoints[1]}`,
          state: routeDirection.state,
        };
      });

      setRoutes(formattedRoutes);
      setSelectedRoute(Object.keys(formattedRoutes)[0]);
      const center = calculateMapCenter(formattedRoutes);
      setMapCenter(center);
      setLoading(false);

      // Optional: Clean up sessionStorage after use
      sessionStorage.removeItem(routeData);
    } catch (error) {
      console.error("Error processing route data:", error);
      setLoading(false);
    }
  }, [routeData]);

  const handleRouteClick = (routeId) => {
    setSelectedRoute(routeId);

    if (mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();

      if (routes[routeId].encodedPolyline) {
        decodePolyline(routes[routeId].encodedPolyline).forEach((point) => {
          bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
        });
      } else if (routes[routeId].coordinates) {
        routes[routeId].coordinates.forEach((point) => {
          bounds.extend(new window.google.maps.LatLng(point.lat, point.lng));
        });
      }

      mapRef.current.fitBounds(bounds);
    }
  };

  const getRouteIcon = (state) => {
    switch (state) {
      case "land":
        return "🚗";
      case "sea":
        return "🚢";
      case "air":
        return "✈️";
      default:
        return "📍";
    }
  };

  const getRouteTypeInfo = (routeId) => {
    if (!routes[routeId]) return {};

    const routeType = routes[routeId].state;

    const types = {
      land: {
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-100",
        name: "Land Route",
        icon: "🚗",
      },
      sea: {
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-100",
        name: "Sea Route",
        icon: "🚢",
      },
      air: {
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-100",
        name: "Air Route",
        icon: "✈️",
      },
    };

    return types[routeType] || {};
  };

  const getRouteColorOptions = (state) => {
    switch (state) {
      case "land":
        return {
          strokeColor: "#10B981",
          strokeWeight: 5,
          strokeOpacity: 0.8,
        };
      case "sea":
        return {
          strokeColor: "#3B82F6",
          strokeWeight: 5,
          strokeOpacity: 0.8,
          geodesic: true,
          icons: [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 1,
                scale: 3,
              },
              offset: "0",
              repeat: "20px",
            },
          ],
        };
      case "air":
        return {
          strokeColor: "#EF4444",
          strokeWeight: 4,
          strokeOpacity: 0.6,
          geodesic: true,
          icons: [
            {
              icon: {
                path: "M 0,-0.1 0,0.1",
                strokeOpacity: 1,
                scale: 3,
              },
              offset: "0",
              repeat: "15px",
            },
          ],
        };
      default:
        return { strokeColor: "#6B7280", strokeWeight: 3 };
    }
  };

  const handleBackClick = () => {
    window.close();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routes data...</p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      onLoad={() => setIsGoogleLoaded(true)}
    >
      <div className="flex h-screen bg-gray-50 overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`bg-white transition-all duration-300 shadow-lg ${
            showSidebar ? "w-3/10" : "w-0"
          }`}
        >
          {showSidebar && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">
                  Route Finder
                </h1>
                <p className="text-sm text-gray-500">
                  Explore travel routes around the world
                </p>
              </div>

              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-700">
                    Land Routes
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-gray-700">
                    Sea Routes
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm font-medium text-gray-700">
                    Air Routes
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">
                    Available Routes
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(routes).map(([id, route]) => {
                      const { bgColor, textColor, icon } = getRouteTypeInfo(id);
                      return (
                        <div
                          key={id}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedRoute === id
                              ? bgColor + " " + textColor
                              : "bg-white hover:bg-gray-50"
                          } border ${
                            selectedRoute === id
                              ? "border-gray-300"
                              : "border-gray-200"
                          }`}
                          onClick={() => handleRouteClick(id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{icon}</span>
                              <span className="font-medium">{route.name}</span>
                            </div>
                            <div
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                route.state === "land"
                                  ? "bg-green-100 text-green-800"
                                  : route.state === "sea"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {route.state.toUpperCase()}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <div>From: {route.origin}</div>
                            <div>To: {route.destination}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedRoute && routes[selectedRoute] && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-700">
                    Selected Route Details
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {routes[selectedRoute].state.charAt(0).toUpperCase() +
                        routes[selectedRoute].state.slice(1)}
                    </p>
                    <p>
                      <span className="font-medium">Origin:</span>{" "}
                      {routes[selectedRoute].origin}
                    </p>
                    <p>
                      <span className="font-medium">Destination:</span>{" "}
                      {routes[selectedRoute].destination}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map container */}
        <div
          className={`${
            showSidebar ? "w-7/10" : "w-full"
          } transition-all duration-300 relative`}
        >
          <button
            className="absolute top-4 left-3 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? (
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            )}
          </button>

          {/* Back button at center bottom */}
          <button
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-yellow-400 p-2 rounded-full shadow-md hover:bg-yellow-500 transition-colors duration-200 flex items-center gap-2"
            onClick={handleBackClick}
          >
            <span className="text-gray-800 font-medium">Close</span>
          </button>

          {isGoogleLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                styles: [
                  {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
                  },
                  {
                    featureType: "landscape",
                    elementType: "geometry",
                    stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
                  },
                  {
                    featureType: "road.highway",
                    elementType: "geometry.fill",
                    stylers: [{ color: "#ffffff" }, { lightness: 17 }],
                  },
                  {
                    featureType: "administrative",
                    elementType: "geometry.stroke",
                    stylers: [
                      { color: "#cacaca" },
                      { lightness: 17 },
                      { weight: 1.2 },
                    ],
                  },
                ],
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
              }}
              onLoad={(map) => {
                mapRef.current = map;
              }}
            >
              {Object.entries(routes).map(([id, route]) => {
                const isSelected = selectedRoute === id;
                const options = getRouteColorOptions(route.state);

                if (isSelected) {
                  options.strokeWeight += 2;
                  options.strokeOpacity = 1;
                  options.zIndex = 10;
                } else {
                  options.strokeOpacity = 0.5;
                  options.zIndex = 1;
                }

                if (route.state === "land" && route.encodedPolyline) {
                  return (
                    <Polyline
                      key={id}
                      path={decodePolyline(route.encodedPolyline)}
                      options={options}
                    />
                  );
                } else if (
                  (route.state === "sea" || route.state === "air") &&
                  route.coordinates
                ) {
                  return (
                    <Polyline
                      key={id}
                      path={route.coordinates}
                      options={options}
                    />
                  );
                }
                return null;
              })}

              {isGoogleLoaded &&
                Object.entries(routes).flatMap(([id, route]) => {
                  const isSelected = selectedRoute === id;
                  const markerColor =
                    route.state === "land"
                      ? "#10B981"
                      : route.state === "sea"
                      ? "#3B82F6"
                      : "#EF4444";

                  let path = [];
                  if (route.encodedPolyline) {
                    path = decodePolyline(route.encodedPolyline);
                  } else if (route.coordinates) {
                    path = route.coordinates;
                  }

                  if (path.length > 0) {
                    return [
                      <Marker
                        key={`${id}-start`}
                        position={path[0]}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: isSelected ? 10 : 7,
                          fillColor: markerColor,
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: "#FFFFFF",
                        }}
                        onClick={() => setActiveMarker(`${id}-start`)}
                      >
                        {activeMarker === `${id}-start` && (
                          <InfoWindow
                            onCloseClick={() => setActiveMarker(null)}
                          >
                            <div className="p-1">
                              <p className="font-semibold">{route.origin}</p>
                              <p className="text-xs">Starting point</p>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>,
                      <Marker
                        key={`${id}-end`}
                        position={path[path.length - 1]}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: isSelected ? 10 : 7,
                          fillColor: markerColor,
                          fillOpacity: 1,
                          strokeWeight: 2,
                          strokeColor: "#FFFFFF",
                        }}
                        onClick={() => setActiveMarker(`${id}-end`)}
                      >
                        {activeMarker === `${id}-end` && (
                          <InfoWindow
                            onCloseClick={() => setActiveMarker(null)}
                          >
                            <div className="p-1">
                              <p className="font-semibold">
                                {route.destination}
                              </p>
                              <p className="text-xs">Destination point</p>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>,
                    ];
                  }
                  return [];
                })}
            </GoogleMap>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading Google Maps...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </LoadScript>
  );
}

export default RouteMap;
