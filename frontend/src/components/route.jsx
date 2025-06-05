import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
  Polyline,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useParams } from "react-router-dom";
import axios from "axios";

const MAPS = import.meta.env.VITE_GOOGLE_API_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

// Animation component for moving vehicles
function AnimatedVehicle({ path, routeType, shouldAnimate }) {
  const [position, setPosition] = useState(0);
  const animationRef = useRef();
  const animationStartTimeRef = useRef(null);
  const animationDuration = 5000; // 5 seconds for the animation

  useEffect(() => {
    if (!shouldAnimate || !path || path.length < 2) {
      setPosition(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationStartTimeRef.current = null;
      return;
    }

    const animate = (timestamp) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = timestamp;
      }

      const elapsed = timestamp - animationStartTimeRef.current;
      const progress = Math.min(elapsed / animationDuration, 1);

      setPosition(progress * 100);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setPosition(100);
        cancelAnimationFrame(animationRef.current);
      }
    };

    // Start animation only when shouldAnimate is true
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldAnimate, path, animationDuration]);

  if (!shouldAnimate || !path || path.length < 2) return null;

  const currentPathProgress = position / 100;
  const currentIndex = Math.floor(currentPathProgress * (path.length - 1));
  const nextIndex = Math.min(currentIndex + 1, path.length - 1);
  const t = currentPathProgress * (path.length - 1) - currentIndex;

  const currentPos = {
    lat:
      path[currentIndex].lat +
      (path[nextIndex].lat - path[currentIndex].lat) * t,
    lng:
      path[currentIndex].lng +
      (path[nextIndex].lng - path[currentIndex].lng) * t,
  };

  const getVehicleIcon = () => {
    const iconSize = 60;
    switch (routeType) {
      case "land":
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="800px" height="800px" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_901_3167)">
<path d="M27.9731 6L28.9731 17H18.9731V5H26.9731C27.5031 5 27.8831 5.27 27.9731 6Z" fill="#FFE6EA"/>
<path d="M24.9731 25C26.6331 25 27.9731 26.34 27.9731 28C27.9731 29.66 26.6331 31 24.9731 31C23.3131 31 21.9731 29.66 21.9731 28C21.9731 26.34 23.3131 25 24.9731 25ZM7.97308 25C9.63308 25 10.9731 26.34 10.9731 28C10.9731 29.66 9.63308 31 7.97308 31C6.31308 31 4.97308 29.66 4.97308 28C4.97308 27.69 5.02308 27.38 5.11308 27.1C5.49308 25.88 6.62308 25 7.97308 25Z" fill="#668077"/>
<path d="M1.05318 3L2.55318 12L3.87318 20L5.05318 27.08L5.11318 27.1C5.49318 25.88 6.62318 25 7.97318 25C9.63318 25 10.9732 26.34 10.9732 28H21.9731C21.9731 26.34 23.3131 25 24.9731 25C26.6331 25 27.9731 26.34 27.9731 28H30.9731V19C30.9731 18 29.9731 17 28.9731 17H18.9732V2C18.9732 1.48 18.4832 1 17.9732 1H2.97318C1.63318 1 0.773177 1.34 1.05318 3Z" fill="#FFC44D"/>
<path d="M28 28C28 26.344 26.656 25 25 25C23.344 25 22 26.344 22 28C22 29.656 23.344 31 25 31C26.656 31 28 29.656 28 28ZM28 28H31V19C31 18 30 17 29 17M11 28C11 26.344 9.656 25 8 25C6.344 25 5 26.344 5 28C5 29.656 6.344 31 8 31C9.656 31 11 29.656 11 28ZM11 28H19V2C19 1.484 18.515 1 18 1H3C1.656 1 0.797 1.344 1.078 3L2 9M29 17H22M29 17L28 6C27.906 5.266 27.531 5 27 5H22M8 16H2M9 20H3M7 12H1" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_901_3167">
<rect width="32" height="32" fill="white"/>
</clipPath>
</defs>
</svg>
        `)}`,
          scaledSize: new window.google.maps.Size(iconSize, iconSize),
          anchor: new window.google.maps.Point(iconSize / 2, iconSize / 2),
        };
      case "sea":
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg version="1.1" id="_x36_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512"  xml:space="preserve">
<g>
	<g>
		<g>
			<path style="fill:#5E4E44;" d="M483.547,55.859l-20.953-9.132c1.794-4.158,1.875-8.805,0.245-13.043
				c-1.631-4.24-4.892-7.583-9.05-9.377c-4.158-1.793-8.724-1.875-12.963-0.244c-4.24,1.63-7.582,4.892-9.458,9.05
				c-1.793,4.158-1.875,8.806-0.244,12.963c1.712,4.24,4.892,7.583,9.05,9.458l10.517,4.566l-15.653,35.627l-3.098,7.094
				l-20.953-9.132l3.914-8.967l6.277-14.349c-4.973-4.24-8.886-9.621-11.332-15.899c-3.914-9.946-3.669-20.789,0.57-30.573
				c4.321-9.702,12.148-17.284,22.013-21.116c9.62-3.832,20.138-3.668,29.677,0.245c0.326,0.082,0.571,0.163,0.897,0.325
				c9.62,4.158,16.958,11.741,20.871,21.442c0.082,0.163,0.163,0.408,0.245,0.571C488.031,35.314,487.867,46.157,483.547,55.859z"/>
		</g>
		<path style="fill:#B8CAD1;" d="M450.935,131.355v108.189c0,26.578-21.768,48.346-48.346,48.346c-1.06,0-2.12,0-3.098-0.163
			c-13.534-0.815-25.6-7.337-33.835-17.121c-7.093-8.479-11.332-19.241-11.332-31.062V131.355c0-26.497,21.686-48.265,48.265-48.265
			c4.24,0,8.397,0.57,12.311,1.631c7.582,1.957,14.512,5.87,20.137,11.005c0.571,0.49,1.141,0.979,1.712,1.55
			C445.473,106.08,450.935,118.146,450.935,131.355z"/>
		<rect x="80.224" y="12.077" style="fill:#D05C8F;" width="146.589" height="169.906"/>
		<rect x="42.966" y="62.137" style="fill:#FFFFFF;" width="265.294" height="169.906"/>
		<polygon style="fill:#5E4E44;" points="512,197.066 488.031,390.208 472.377,447.604 39.623,447.604 32.041,419.884 
			23.969,390.208 0,197.066 		"/>
		<polygon style="fill:#E5E5E4;" points="488.031,390.208 472.377,447.604 39.623,447.604 32.041,419.884 23.969,390.208 		"/>
		<rect x="89.657" y="104.029" style="fill:#B8CAD1;" width="77.422" height="58.174"/>
		<rect x="194.867" y="104.029" style="fill:#B8CAD1;" width="77.422" height="58.174"/>
		<path style="fill:#5E4E44;" d="M404.571,141.26L404.571,141.26c-7.679,0-13.962-6.283-13.962-13.962v0
			c0-7.679,6.283-13.962,13.962-13.962l0,0c7.679,0,13.962,6.283,13.962,13.962v0C418.532,134.977,412.25,141.26,404.571,141.26z"/>
		<g>
			<circle style="fill:#D7E6BC;" cx="141.98" cy="303.916" r="33.638"/>
			<circle style="fill:#D7E6BC;" cx="256" cy="303.916" r="33.638"/>
			<circle style="fill:#D7E6BC;" cx="370.021" cy="303.916" r="33.638"/>
		</g>
	</g>
	<path style="fill:none;" d="M354.297,197.099v-65.713c0-2.156,0.193-4.263,0.47-6.345l-46.513,46.513v25.545H354.297z"/>
	<path style="fill:none;" d="M414.906,84.746l6.287-14.381c-2.124-1.795-4.001-3.849-5.702-6.049l-19.24,19.24
		c2.083-0.277,4.191-0.47,6.346-0.47C406.855,83.087,410.967,83.7,414.906,84.746z"/>
	<path style="fill:none;" d="M440.793,24.062c-4.233,1.658-7.566,4.865-9.387,9.029c-1.821,4.164-1.911,8.788-0.252,13.021
		c0.233,0.595,0.564,1.127,0.857,1.684l22.88-22.88c-0.365-0.191-0.695-0.434-1.077-0.601
		C449.651,22.495,445.027,22.406,440.793,24.062z"/>
	<g>
		<path style="opacity:0.09;fill:#040000;" d="M462.842,33.701c1.658,4.233,1.568,8.856-0.253,13.021l20.968,9.167
			c4.27-9.765,4.482-20.608,0.594-30.532c-2.67-6.819-7.151-12.536-12.802-16.899l-16.457,16.457
			C458.51,26.819,461.339,29.858,462.842,33.701z"/>
		<path style="opacity:0.09;fill:#040000;" d="M450.899,131.387c0-14.08-6.143-26.763-15.838-35.613l15.604-35.691l-10.484-4.584
			c-3.578-1.566-6.381-4.293-8.17-7.703l-16.52,16.521c1.7,2.2,3.578,4.254,5.702,6.049l-6.287,14.381
			c-3.94-1.047-8.051-1.66-12.308-1.66c-2.156,0-4.263,0.193-6.346,0.47l-41.485,41.485c-0.277,2.082-0.47,4.19-0.47,6.345v65.713
			h-46.044v-25.545L38.007,441.801l1.584,5.83h432.818l15.591-57.385l23.969-193.147h-61.07V131.387z"/>
	</g>
</g>
</svg>
        `)}`,
          scaledSize: new window.google.maps.Size(iconSize, iconSize),
          anchor: new window.google.maps.Point(iconSize / 2, iconSize / 2),
        };
      case "air":
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 511.988 511.988" xml:space="preserve">
<g>
	<path style="fill:#CCD1D9;" d="M127.997,195.109c-5.891,0-10.672,4.773-10.672,10.672v12.039c0,5.89,4.781,10.664,10.672,10.664
		s10.672-4.773,10.672-10.664v-12.039C138.669,199.882,133.888,195.109,127.997,195.109z"/>
	<path style="fill:#CCD1D9;" d="M63.998,226.998c-5.89,0-10.671,4.773-10.671,10.664v12.617c0,5.891,4.781,10.664,10.671,10.664
		c5.891,0,10.672-4.773,10.672-10.664v-12.617C74.67,231.772,69.889,226.998,63.998,226.998z"/>
	<path style="fill:#CCD1D9;" d="M383.993,195.109c-5.891,0-10.672,4.773-10.672,10.672v12.039c0,5.89,4.781,10.664,10.672,10.664
		s10.671-4.773,10.671-10.664v-12.039C394.664,199.882,389.884,195.109,383.993,195.109z"/>
	<path style="fill:#CCD1D9;" d="M447.991,226.998c-5.891,0-10.672,4.773-10.672,10.664v12.617c0,5.891,4.781,10.664,10.672,10.664
		s10.672-4.773,10.672-10.664v-12.617C458.663,231.772,453.882,226.998,447.991,226.998z"/>
</g>
<g>
	<path style="fill:#E6E9ED;" d="M10.672,341.34c-2.438,0-4.812-0.844-6.734-2.406C1.454,336.903,0,333.872,0,330.653v-42.654
		c0-4.016,2.266-7.688,5.844-9.516l202.668-102.795c5.25-2.664,11.671-0.57,14.328,4.688c2.672,5.25,0.562,11.672-4.688,14.336
		l-4.437,82.85c5.765-1.203,11.406,2.5,12.609,8.266s-2.5,11.422-8.266,12.609l-205.215,42.67
		C12.125,341.246,11.391,341.34,10.672,341.34z"/>
	<path style="fill:#E6E9ED;" d="M501.318,341.34c-0.719,0-1.438-0.094-2.172-0.234l-205.215-42.67
		c-5.765-1.188-9.468-6.844-8.265-12.609s6.843-9.469,12.608-8.266l-4.438-82.85c-5.249-2.664-7.358-9.086-4.687-14.336
		c2.655-5.258,9.077-7.352,14.343-4.688l202.652,102.795c3.594,1.828,5.844,5.5,5.844,9.516v42.654c0,3.219-1.438,6.25-3.938,8.281
		C506.131,340.496,503.756,341.34,501.318,341.34z"/>
</g>
<g>
	<path style="fill:#4A89DC;" d="M225.808,374.465c-3.5-1.75-7.688-1.469-10.906,0.781l-61.015,42.67
		c-2.859,2-4.562,5.266-4.562,8.734v42.688c0,3.438,1.656,6.656,4.453,8.656c1.844,1.312,4.016,2,6.219,2
		c1.156,0,2.312-0.188,3.422-0.562l62.889-21.344c4.438-1.5,7.375-5.719,7.234-10.406l-1.859-63.998
		C231.574,379.777,229.308,376.215,225.808,374.465z"/>
	<path style="fill:#4A89DC;" d="M358.102,417.916l-61.015-42.67c-3.219-2.25-7.405-2.531-10.905-0.781s-5.766,5.312-5.875,9.219
		l-1.859,63.998c-0.141,4.688,2.797,8.906,7.234,10.406l62.889,21.344c1.109,0.375,2.266,0.562,3.422,0.562
		c2.203,0,4.375-0.688,6.219-2c2.797-2,4.453-5.219,4.453-8.656V426.65C362.665,423.182,360.962,419.916,358.102,417.916z"/>
</g>
<path style="fill:#5D9CEC;" d="M287.511,479.994h-64c-5.766,0-10.484-4.578-10.656-10.344
	c-0.438-14.375-10.672-352.399-10.672-373.649c0-13.344,5.047-31.078,12.875-45.179c10.562-19.015,24.937-29.484,40.453-29.484
	s29.891,10.469,40.437,29.484c7.828,14.101,12.891,31.835,12.891,45.179c0,21.25-10.234,359.274-10.672,373.649
	C297.994,475.416,293.275,479.994,287.511,479.994z"/>
<path style="fill:#F5F7FA;" d="M286.823,92.228c-0.469-1.234-2.375-5.586-7.297-9.727c-4.25-3.57-11.859-7.836-24.016-7.836
	c-19.484,0-28.843,11.039-31.312,17.562c-2.078,5.516,0.703,11.672,6.203,13.75c1.25,0.469,2.516,0.695,3.766,0.695
	c4.156,0,8.078-2.445,9.812-6.453C244.354,99.563,246.791,96,255.51,96c8.719,0,11.156,3.562,11.531,4.219
	c2.25,5.211,8.219,7.781,13.578,5.757C286.12,103.892,288.901,97.736,286.823,92.228z"/>
<path style="fill:#4A89DC;" d="M255.511,490.65c-5.891,0-10.672-4.766-10.672-10.656V405.34c0-5.906,4.781-10.688,10.672-10.688
	c5.891,0,10.672,4.781,10.672,10.688v74.654C266.183,485.885,261.401,490.65,255.511,490.65z"/>
</svg>
    `)}`,
          scaledSize: new window.google.maps.Size(iconSize, iconSize),
          anchor: new window.google.maps.Point(iconSize / 2, iconSize / 2),
        };
      default:
        return null;
    }
  };

  return <Marker position={currentPos} icon={getVehicleIcon()} zIndex={1000} />;
}

function RouteMap() {
  const { draftId } = useParams();
  const [routes, setRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter] = useState({ lat: 0, lng: 0 });
  const [mapZoom] = useState(2);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  const [mapStyle, setMapStyle] = useState("custom");
  const mapRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!draftId) {
          throw new Error("No draft ID provided in URL");
        }

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const response = await axios.get(
          `${BACKEND_URL}/api/routes/${draftId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { routes: processedRoutes, originalRoute } = response.data;
        const formattedRoutes = {};
        Object.entries(processedRoutes).forEach(([id, route]) => {
          const routeDirection = originalRoute.find((dir) => dir.id === id);
          formattedRoutes[id] = {
            ...route,
            origin: routeDirection.waypoints[0],
            destination: routeDirection.waypoints[1],
            name: `${routeDirection.waypoints[0]} to ${routeDirection.waypoints[1]}`,
            state: routeDirection.state,
          };
        });

        setRoutes(formattedRoutes);
      } catch (err) {
        console.error("Error fetching map data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [draftId]);

  const handleRouteClick = (routeId) => {
    setSelectedRoute(routeId);
    setAnimationTrigger(routeId); // Trigger animation for the selected route

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

    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const getRouteIcon = (state) => {
    switch (state) {
      case "land":
        return "🚛";
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
        color: "from-emerald-500 to-green-600",
        textColor: "text-emerald-800",
        bgColor: "bg-gradient-to-r from-emerald-50 to-green-50",
        borderColor: "border-emerald-200",
        name: "Land Route",
        icon: "🚛",
      },
      sea: {
        color: "from-blue-500 to-cyan-600",
        textColor: "text-blue-800",
        bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        name: "Sea Route",
        icon: "🚢",
      },
      air: {
        color: "from-red-500 to-rose-600",
        textColor: "text-red-800",
        bgColor: "bg-gradient-to-r from-red-50 to-rose-50",
        borderColor: "border-red-200",
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
          strokeColor: "#059669",
          strokeWeight: 6,
          strokeOpacity: 0.9,
        };
      case "sea":
        return {
          strokeColor: "#0ea5e9",
          strokeWeight: 6,
          strokeOpacity: 0.9,
          geodesic: true,
          icons: [
            {
              icon: {
                path: "M 0,-2 0,2",
                strokeOpacity: 1,
                scale: 4,
                strokeColor: "#0369a1",
              },
              offset: "0",
              repeat: "25px",
            },
          ],
        };
      case "air":
        return {
          strokeColor: "#ef4444",
          strokeWeight: 5,
          strokeOpacity: 0.8,
          geodesic: true,
          icons: [
            {
              icon: {
                path: "M 0,-1 0,1",
                strokeOpacity: 1,
                scale: 3,
                strokeColor: "#dc2626",
              },
              offset: "0",
              repeat: "20px",
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

  const handleMapStyleChange = (style) => {
    setMapStyle(style);
    if (mapRef.current) {
      mapRef.current.setMapTypeId(
        style === "custom" ? window.google.maps.MapTypeId.ROADMAP : style
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-slate-700 font-medium">
            Loading routes data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl">
          <p className="text-red-600 mb-6 font-medium">{error}</p>
          <button
            className="bg-gradient-to-r from-yellow-400 to-orange-400 py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium text-gray-800"
            onClick={handleBackClick}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const customMapStyles = [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ saturation: -100 }, { lightness: 40 }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#a2d2ff" }, { lightness: 20 }],
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f8fafc" }, { lightness: 20 }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }, { lightness: 30 }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#e2e8f0" }],
    },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#cbd5e1" }, { weight: 1 }],
    },
  ];

  return (
    <LoadScript googleMapsApiKey={MAPS} onLoad={() => setIsGoogleLoaded(true)}>
      <div className="flex h-screen bg-gradient-to-br from-slate-100 to-blue-100 overflow-hidden relative p-2 sm:p-4">
        {/* Sidebar */}
        <div
          className={`${
            showSidebar
              ? isMobile
                ? "fixed inset-2 z-30 overflow-y-auto"
                : "w-full sm:w-1/3 lg:w-[30%]"
              : isMobile
              ? "hidden"
              : "w-0"
          } bg-white/90 backdrop-blur-xl transition-all duration-500 shadow-2xl h-full rounded-3xl border border-white/50`}
        >
          {showSidebar && (
            <div className="h-full flex flex-col">
              <div className="p-4 sm:p-6 border-b border-slate-200/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                      Route Explorer
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Discover cargo routes worldwide
                    </p>
                  </div>
                  {isMobile && (
                    <button
                      className="p-2 rounded-full hover:bg-slate-100 transition-colors duration-200"
                      onClick={() => setShowSidebar(false)}
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Route Types
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-sm"></div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Land Routes
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 shadow-sm"></div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Sea Routes
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-rose-600 shadow-sm"></div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Air Routes
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-slate-700 mb-4">
                  Available Routes
                </h2>
                <div className="space-y-3">
                  {Object.entries(routes).map(([id, route]) => {
                    const { bgColor, textColor, icon, borderColor, color } =
                      getRouteTypeInfo(id);
                    const isSelected = selectedRoute === id;
                    return (
                      <div
                        key={id}
                        className={`p-3 sm:p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          isSelected
                            ? `${bgColor} ${borderColor} border-2 shadow-lg`
                            : "bg-white hover:bg-slate-50 border border-slate-200 hover:shadow-md"
                        }`}
                        onClick={() => handleRouteClick(id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg sm:text-xl mr-2 sm:mr-3">
                              {icon}
                            </span>
                            <span className="font-semibold text-slate-800 text-sm sm:text-base">
                              {route.name}
                            </span>
                          </div>
                          <div
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${color} text-white shadow-sm`}
                          >
                            {route.state.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                            <span className="font-medium">From:</span>{" "}
                            <span className="ml-1">{route.origin}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                            <span className="font-medium">To:</span>{" "}
                            <span className="ml-1">{route.destination}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRoute && routes[selectedRoute] && (
                <div className="p-4 sm:p-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50">
                  <h3 className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">
                    Route Details
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">
                        {routes[selectedRoute].state}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Origin:</span>
                      <span className="text-right max-w-32 truncate">
                        {routes[selectedRoute].origin}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Destination:</span>
                      <span className="text-right max-w-32 truncate">
                        {routes[selectedRoute].destination}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`${
            showSidebar && !isMobile
              ? "w-full sm:w-2/3 lg:w-[70%] ml-2 sm:ml-4"
              : "w-full"
          } transition-all duration-500 relative`}
        >
          {/* Map window */}
          <div className="h-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative">
            {/* Controls */}
            <button
              className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar && !isMobile ? (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

            {/* Mobile route info */}
            {isMobile &&
              selectedRoute &&
              routes[selectedRoute] &&
              !showSidebar && (
                <div className="absolute top-4 sm:top-6 left-16 sm:left-20 right-4 sm:right-6 z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-base sm:text-lg mr-1 sm:mr-2">
                      {getRouteIcon(routes[selectedRoute].state)}
                    </span>
                    <span className="font-semibold text-xs sm:text-sm truncate max-w-24 sm:max-w-32">
                      {routes[selectedRoute].name}
                    </span>
                  </div>
                  <div
                    className={`ml-2 px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${
                      getRouteTypeInfo(selectedRoute).color
                    } text-white`}
                  >
                    {routes[selectedRoute].state.toUpperCase()}
                  </div>
                </div>
              )}

            {/* Map style selector */}
            <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2 sm:space-x-3">
              {["custom", "roadmap", "satellite", "terrain"].map((style) => (
                <button
                  key={style}
                  className={`${
                    mapStyle === style
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : "bg-white/90 text-slate-700 hover:bg-slate-100"
                  } backdrop-blur-sm py-1 sm:py-2 px-3 sm:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm capitalize font-medium`}
                  onClick={() => handleMapStyleChange(style)}
                >
                  {style === "custom" ? "Modern" : style}
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 py-2 sm:py-3 px-4 sm:px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={handleBackClick}
            >
              <span className="text-gray-800 font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close
              </span>
            </button>

            {/* Google Map */}
            {isGoogleLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={mapZoom}
                options={{
                  styles: mapStyle === "custom" ? customMapStyles : [],
                  zoomControl: true,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: true,
                  minZoom: 1,
                  maxZoom: 18,
                  restriction: {
                    latLngBounds: {
                      north: 85,
                      south: -85,
                      west: -180,
                      east: 180,
                    },
                  },
                }}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
              >
                {/* Route polylines */}
                {Object.entries(routes).map(([id, route]) => {
                  const isSelected = selectedRoute === id;
                  const options = getRouteColorOptions(route.state);

                  if (isSelected) {
                    options.strokeWeight += 2;
                    options.strokeOpacity = 1;
                    options.zIndex = 10;
                  } else {
                    options.strokeOpacity = 0.6;
                    options.zIndex = 1;
                  }

                  let path = [];
                  if (route.state === "land" && route.encodedPolyline) {
                    path = decodePolyline(route.encodedPolyline);
                  } else if (
                    (route.state === "sea" || route.state === "air") &&
                    route.coordinates
                  ) {
                    path = route.coordinates;
                  }

                  if (path.length > 0) {
                    return (
                      <React.Fragment key={id}>
                        <Polyline path={path} options={options} />
                        <AnimatedVehicle
                          path={path}
                          routeType={route.state}
                          shouldAnimate={animationTrigger === id}
                        />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}

                {/* Start and end markers */}
                {isGoogleLoaded &&
                  Object.entries(routes).flatMap(([id, route]) => {
                    const isSelected = selectedRoute === id;
                    const markerColor =
                      route.state === "land"
                        ? "#059669"
                        : route.state === "sea"
                        ? "#0ea5e9"
                        : "#ef4444";

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
                            scale: isSelected ? 12 : 8,
                            fillColor: markerColor,
                            fillOpacity: 0.9,
                            strokeWeight: 3,
                            strokeColor: "#FFFFFF",
                          }}
                          onClick={() => setActiveMarker(`${id}-start`)}
                        >
                          {activeMarker === `${id}-start` && (
                            <InfoWindow
                              onCloseClick={() => setActiveMarker(null)}
                            >
                              <div className="p-2">
                                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                                  {route.origin}
                                </p>
                                <p className="text-xs text-slate-600">
                                  Starting point
                                </p>
                              </div>
                            </InfoWindow>
                          )}
                        </Marker>,
                        <Marker
                          key={`${id}-end`}
                          position={path[path.length - 1]}
                          icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: isSelected ? 12 : 8,
                            fillColor: markerColor,
                            fillOpacity: 0.9,
                            strokeWeight: 3,
                            strokeColor: "#FFFFFF",
                          }}
                          onClick={() => setActiveMarker(`${id}-end`)}
                        >
                          {activeMarker === `${id}-end` && (
                            <InfoWindow
                              onCloseClick={() => setActiveMarker(null)}
                            >
                              <div className="p-2">
                                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                                  {route.destination}
                                </p>
                                <p className="text-xs text-slate-600">
                                  Destination point
                                </p>
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
                <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                  <p className="mt-6 text-slate-700 font-medium">
                    Loading Google Maps...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LoadScript>
  );
}

export default RouteMap;
