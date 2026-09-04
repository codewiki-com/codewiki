---
title: JavaScript Geolocation API
description: A comprehensive guide to the Geolocation API for retrieving user location data, including permissions, accuracy considerations, and practical implementations for web applications.
track: javascript
section: browser
difficulty: intermediate
tags:
  - geolocation
  - web-api
  - location
  - gps
  - browser-api
  - privacy
status: imported
origin: old/src/content/docs/javascript/geolocation.en.md
divergence: 0.273
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---


## Concept Explanation

The Geolocation API is a browser-based Web API that allows web applications to request access to the user's geographical position. Instead of requiring users to manually input their location, this API provides a standardized way to retrieve latitude, longitude, and altitude data from a device's GPS, WiFi triangulation, or IP address-based methods.

### Historical Context

The Geolocation API was introduced as part of the W3C specification in 2010 and has since become widely supported across modern browsers. It emerged from the need for location-aware web applications such as mapping services (Google Maps), weather apps, and location-based social networks. The API was designed with privacy as a paramount concern, requiring explicit user permission before any location data can be accessed.

### Problems It Solves

1. **Seamless User Experience**: Users don't need to manually type their address or coordinates
2. **Location-Based Services**: Enables personalized content, local recommendations, and proximity-based features
3. **Real-time Tracking**: Supports continuous location monitoring for navigation and tracking applications
4. **Cross-Platform Consistency**: Provides a unified interface across different devices and browsers

## Core Principles

### How Geolocation Works

The Geolocation API operates on several key principles:

1. **Permission-Based Access**: The browser must request explicit user permission before accessing location data. Users can grant, deny, or ignore the request, and they can revoke permissions at any time.

2. **Multiple Data Sources**: The API can use various sources depending on device capabilities:
   - **GPS (Global Positioning System)**: Most accurate but slowest and most power-consuming
   - **WiFi Triangulation**: Moderate accuracy, faster than GPS
   - **Cell Tower Triangulation**: Less accurate but faster
   - **IP Address Geolocation**: Least accurate, fastest

3. **Asynchronous Operation**: Location requests are asynchronous since obtaining position data may take time. The API uses callbacks or Promises to return results.

4. **Accuracy and Confidence**: The API returns not just coordinates but also accuracy metrics (accuracy radius in meters), altitude, heading, and speed when available.

5. **One-Time vs. Continuous**: The API supports both one-time position requests and continuous monitoring through the `watchPosition` method.

### Architecture

```
User Browser
    ↓
Geolocation API (navigator.geolocation)
    ↓
Permission Check (user consent required)
    ↓
Data Source Selection (GPS/WiFi/IP)
    ↓
Position Calculation
    ↓
Success/Error Callback
    ↓
Application Logic
```

## Key Points

### Permission Model
- **Secure context required**: API only works on HTTPS (except localhost)
- **User consent mandatory**: Browser displays permission prompt
- **Granular control**: Users can allow once, always, or deny

### Position Object Structure
```javascript
{
  coords: {
    latitude: Number,           // -90 to 90 degrees
    longitude: Number,          // -180 to 180 degrees
    accuracy: Number,           // in meters
    altitude: Number,           // in meters (may be null)
    altitudeAccuracy: Number,   // in meters (may be null)
    heading: Number,            // 0-360 degrees, direction of travel
    speed: Number               // in meters per second
  },
  timestamp: Number             // milliseconds since epoch
}
```

### Options Configuration
- `enableHighAccuracy`: Prioritizes accuracy over speed/power (default: false)
- `timeout`: Maximum time in milliseconds to wait (default: infinity)
- `maximumAge`: Maximum acceptable age of cached position (default: 0)

### Error Handling
- `PERMISSION_DENIED`: User rejected permission
- `POSITION_UNAVAILABLE`: Position data unavailable
- `TIMEOUT`: Position request timed out

### Browser Compatibility
- Supported in all modern browsers
- IE11 and below have limited or no support
- Some browsers may have additional permission requirements

## Code Examples

### Basic Position Request

```javascript
// Simple one-time position request
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Lat: ${latitude}, Lon: ${longitude}`);
        console.log(`Accuracy: ${accuracy} meters`);
      },
      function(error) {
        console.error(`Error: ${error.message}`);
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser");
  }
}
```

### Advanced Position Request with Options

```javascript
// Request high accuracy position with timeout and cache options
function getHighAccuracyLocation() {
  const options = {
    enableHighAccuracy: true,  // Use GPS if available
    timeout: 10000,            // Wait up to 10 seconds
    maximumAge: 0              // Don't use cached position
  };

  navigator.geolocation.getCurrentPosition(
    function(position) {
      displayMap(position.coords.latitude, position.coords.longitude);
    },
    function(error) {
      handleLocationError(error);
    },
    options
  );
}

function handleLocationError(error) {
  const errorMessages = {
    1: "Permission denied. Please enable location access in browser settings.",
    2: "Position unavailable. Please check your connection.",
    3: "Request timed out. Please try again."
  };

  console.error(errorMessages[error.code] || "Unknown error");
}
```

### Continuous Location Monitoring

```javascript
// Watch position for real-time location updates
function startLocationTracking() {
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  const watchId = navigator.geolocation.watchPosition(
    function(position) {
      updateUserMarker(position.coords);
      console.log(`Updated: ${new Date(position.timestamp)}`);
    },
    function(error) {
      console.error(`Watch position error: ${error.message}`);
    },
    options
  );

  // Stop watching after 5 minutes
  setTimeout(() => {
    navigator.geolocation.clearWatch(watchId);
    console.log("Location tracking stopped");
  }, 5 * 60 * 1000);

  return watchId;
}
```

### Promise-Based Approach (Modern)

```javascript
// Using Promises with modern async/await syntax
async function getUserLocation() {
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };
  } catch (error) {
    if (error.code === 1) {
      throw new Error("Location permission denied");
    } else if (error.code === 2) {
      throw new Error("Location unavailable");
    } else if (error.code === 3) {
      throw new Error("Location request timeout");
    }
    throw error;
  }
}

// Usage
async function initApp() {
  try {
    const location = await getUserLocation();
    console.log("User location:", location);
  } catch (error) {
    console.error("Failed to get location:", error.message);
  }
}
```

### Distance Calculation Between Two Points

```javascript
// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // in kilometers
}

// Example usage
const userLat = 40.7128, userLon = -74.0060;  // New York
const storeLat = 40.7489, storeLon = -73.9680; // Empire State Building

const distance = calculateDistance(userLat, userLon, storeLat, storeLon);
console.log(`Distance: ${distance.toFixed(2)} km`);
```

### Reverse Geocoding with Geolocation API

```javascript
// Convert coordinates to address (requires external API like Google Geocoding)
async function getAddressFromCoordinates(latitude, longitude) {
  const apiKey = "YOUR_GOOGLE_API_KEY";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return "Address not found";
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Usage with geolocation
navigator.geolocation.getCurrentPosition(async (position) => {
  const address = await getAddressFromCoordinates(
    position.coords.latitude,
    position.coords.longitude
  );
  console.log("Your address:", address);
});
```

### Proximity Detection

```javascript
// Monitor if user enters a specific area (geofence)
class GeofenceMonitor {
  constructor(targetLat, targetLon, radiusMeters) {
    this.targetLat = targetLat;
    this.targetLon = targetLon;
    this.radiusMeters = radiusMeters;
    this.insideGeofence = false;
    this.watchId = null;
  }

  start() {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.checkProximity(position),
      (error) => console.error("Geofence error:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  checkProximity(position) {
    const distance = this.calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      this.targetLat,
      this.targetLon
    );

    const wasInside = this.insideGeofence;
    this.insideGeofence = distance * 1000 <= this.radiusMeters; // Convert km to m

    if (this.insideGeofence && !wasInside) {
      this.onEnter();
    } else if (!this.insideGeofence && wasInside) {
      this.onExit();
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) ** 2 * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  onEnter() {
    console.log("User entered geofence");
  }

  onExit() {
    console.log("User left geofence");
  }
}

// Usage
const geofence = new GeofenceMonitor(40.7128, -74.0060, 500); // 500m radius
geofence.start();
```

## Best Practices

### Always Request Permission Explicitly

```javascript
// Good: Clear user intent
function requestLocationPermission() {
  const message = "This app needs your location to provide personalized recommendations.";

  showDialog(message, () => {
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError
    );
  });
}

// Bad: Hidden or misleading permission request
navigator.geolocation.getCurrentPosition(...); // Without user context
```

### Provide Fallback Mechanisms

```javascript
async function getLocationWithFallback() {
  try {
    return await getUserLocationViaGeolocation();
  } catch (geoError) {
    console.warn("Geolocation failed, trying IP-based location");
    try {
      return await getUserLocationViaIP();
    } catch (ipError) {
      console.error("All location methods failed");
      return null;
    }
  }
}

async function getUserLocationViaIP() {
  const response = await fetch('https://ipapi.co/json/');
  const data = await response.json();
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: null // IP-based is less accurate
  };
}
```

### Cache Position Data Appropriately

```javascript
class LocationCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes
    this.cachedPosition = null;
    this.cachedTime = null;
    this.maxAge = maxAge;
  }

  async getPosition(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid()) {
      return this.cachedPosition;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.cachedPosition = position;
          this.cachedTime = Date.now();
          resolve(position);
        },
        reject
      );
    });
  }

  isCacheValid() {
    return this.cachedPosition &&
           (Date.now() - this.cachedTime) < this.maxAge;
  }

  clear() {
    this.cachedPosition = null;
    this.cachedTime = null;
  }
}
```

### Optimize for Battery and Network

```javascript
function requestLocationOptimized() {
  const options = {
    enableHighAccuracy: false,  // Use lower accuracy to save battery
    timeout: 15000,             // Allow reasonable wait time
    maximumAge: 10 * 60 * 1000  // Use cached position up to 10 minutes old
  };

  navigator.geolocation.getCurrentPosition(
    handleSuccess,
    handleError,
    options
  );
}
```

### Handle Permissions Gracefully

```javascript
async function requestLocationWithGracefulDegradation() {
  if (!navigator.geolocation) {
    return useIPBasedLocation();
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
    return position;
  } catch (error) {
    if (error.code === 1) { // Permission denied
      // Guide user to enable permission
      showPermissionGuide();
      return useIPBasedLocation();
    }
    throw error;
  }
}

function showPermissionGuide() {
  console.log("To enable location:");
  console.log("1. Chrome: Click lock icon > Site settings");
  console.log("2. Firefox: Preferences > Privacy & Security");
}
```

## Common Pitfalls

### Not Checking for Geolocation Support

```javascript
// Bad: Assumes geolocation is available
navigator.geolocation.getCurrentPosition(handleSuccess);

// Good: Checks for support
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(handleSuccess);
} else {
  alert("Geolocation is not supported by your browser");
}
```

### Ignoring HTTPS Requirement

```javascript
// The API will fail silently on HTTP connections
// Always use HTTPS in production
// localhost is an exception for development
```

### Not Setting Appropriate Timeout

```javascript
// Bad: No timeout specified (waits indefinitely)
navigator.geolocation.getCurrentPosition(success, error);

// Good: Reasonable timeout based on use case
navigator.geolocation.getCurrentPosition(success, error, {
  timeout: 10000 // 10 seconds
});
```

### Ignoring Accuracy Considerations

```javascript
// Bad: Treating all positions as equally accurate
const lat = position.coords.latitude;

// Good: Considering accuracy in decisions
if (position.coords.accuracy < 1000) { // Less than 1km error
  // Safe to use high-precision features
  showDetailedMap();
} else {
  // Fall back to lower-precision features
  showApproximateArea();
}
```

### Memory Leaks from watchPosition

```javascript
// Bad: Never clearing watch
navigator.geolocation.watchPosition(handlePosition);

// Good: Clear watch when done
const watchId = navigator.geolocation.watchPosition(handlePosition);
// Later...
navigator.geolocation.clearWatch(watchId);

// Better: Use cleanup pattern
class LocationTracker {
  constructor() {
    this.watchId = null;
  }

  start() {
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePosition(pos)
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  destroy() {
    this.stop();
  }
}
```

### Privacy Violation

```javascript
// Bad: Tracking without consent
navigator.geolocation.watchPosition(
  (position) => {
    sendToAnalyticsServer(position); // Continuous tracking
  }
);

// Good: Explicit opt-in and minimal collection
if (userOptedInToTracking) {
  navigator.geolocation.watchPosition(
    (position) => {
      logUserLocationForNavigation(position);
    }
  );
}
```

## Performance Considerations

### Accuracy vs. Performance Trade-off

```javascript
// High accuracy (slower, more power consumption)
{ enableHighAccuracy: true, timeout: 30000 }

// Balanced approach
{ enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }

// Fast (less accurate)
{ enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
```

### CPU and Battery Impact

```javascript
// Battery-friendly implementation
class EfficientLocationTracker {
  constructor() {
    this.isActive = false;
    this.updateInterval = 30000; // Check every 30 seconds
    this.lastUpdate = null;
  }

  start() {
    this.isActive = true;
    this.scheduleCheck();
  }

  scheduleCheck() {
    if (!this.isActive) return;

    // Use slower geolocation with caching
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.lastUpdate = position;
        this.processPosition(position);

        // Schedule next check
        setTimeout(() => this.scheduleCheck(), this.updateInterval);
      },
      (error) => {
        console.error("Location error:", error);
        setTimeout(() => this.scheduleCheck(), this.updateInterval);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000
      }
    );
  }

  stop() {
    this.isActive = false;
  }

  processPosition(position) {
    console.log("Position updated:", position.coords);
  }
}
```

### Network Optimization

```javascript
// Batch location updates to reduce network calls
class LocationBatcher {
  constructor(batchSize = 5) {
    this.batchSize = batchSize;
    this.batch = [];
    this.watchId = null;
  }

  start() {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.batch.push(position);
        if (this.batch.length >= this.batchSize) {
          this.sendBatch();
        }
      }
    );
  }

  async sendBatch() {
    if (this.batch.length === 0) return;

    const data = this.batch.map(p => ({
      lat: p.coords.latitude,
      lon: p.coords.longitude,
      time: p.timestamp
    }));

    try {
      await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: data })
      });
      this.batch = [];
    } catch (error) {
      console.error("Failed to send location batch:", error);
    }
  }

  stop() {
    this.sendBatch(); // Send remaining
    navigator.geolocation.clearWatch(this.watchId);
  }
}
```

## Real-world Scenarios

### Delivery/Ride-Sharing App

```javascript
class DeliveryTracking {
  constructor(deliveryId) {
    this.deliveryId = deliveryId;
    this.locationUpdater = new LocationBatcher(10);
    this.geofence = null;
  }

  async startTracking() {
    // Get destination
    const delivery = await this.getDeliveryDetails();

    // Create geofence for destination
    this.geofence = new GeofenceMonitor(
      delivery.destinationLat,
      delivery.destinationLon,
      50 // 50 meters
    );

    // Override handlers
    this.geofence.onEnter = () => {
      this.notifyArrival();
      this.stopTracking();
    };

    this.geofence.start();
    this.locationUpdater.start();
  }

  notifyArrival() {
    fetch(`/api/deliveries/${this.deliveryId}/arrived`, {
      method: 'POST'
    });
  }

  stopTracking() {
    this.locationUpdater.stop();
    this.geofence.stop();
  }

  async getDeliveryDetails() {
    const response = await fetch(`/api/deliveries/${this.deliveryId}`);
    return response.json();
  }
}
```

### Location-Based Recommendations

```javascript
class LocationBasedRecommendations {
  async getNearbyPlaces() {
    const location = await this.getCurrentLocation();

    // Only fetch if accuracy is good enough
    if (location.accuracy > 100) {
      console.warn("Accuracy too low for precise recommendations");
      return this.getGeneralRecommendations();
    }

    return this.fetchNearbyPlaces(
      location.latitude,
      location.longitude,
      location.accuracy
    );
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        reject,
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  async fetchNearbyPlaces(lat, lon, accuracy) {
    const radius = Math.max(accuracy / 1000, 0.5); // Min 500m
    const response = await fetch(
      `/api/places?lat=${lat}&lon=${lon}&radius=${radius}`
    );
    return response.json();
  }

  getGeneralRecommendations() {
    return fetch('/api/places/popular').then(r => r.json());
  }
}
```

### Geofencing for Store Events

```javascript
class StoreGeofenceManager {
  constructor() {
    this.stores = [];
    this.geofences = new Map();
  }

  async initializeStoreGeofences() {
    // Get all stores with geofence data
    const storesData = await fetch('/api/stores').then(r => r.json());

    this.stores = storesData;

    // Create geofences for each store
    storesData.forEach(store => {
      const geofence = new GeofenceMonitor(
        store.latitude,
        store.longitude,
        store.geofenceRadius || 100
      );

      geofence.onEnter = () => this.handleStoreEntry(store);
      geofence.onExit = () => this.handleStoreExit(store);

      this.geofences.set(store.id, geofence);
      geofence.start();
    });
  }

  handleStoreEntry(store) {
    // Show welcome notification
    this.showNotification(
      `Welcome to ${store.name}!`,
      `Check out our current promotions`
    );

    // Log analytics
    this.trackEvent('store_entry', { storeId: store.id });
  }

  handleStoreExit(store) {
    this.trackEvent('store_exit', { storeId: store.id });
  }

  showNotification(title, message) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }

  trackEvent(eventName, data) {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName, data })
    });
  }

  stop() {
    this.geofences.forEach(geofence => geofence.stop());
    this.geofences.clear();
  }
}
```

## Interview Points

### Common Interview Questions

**Q1: What is the Geolocation API and why is HTTPS required?**
A: The Geolocation API retrieves user location via GPS, WiFi, or IP-based methods. HTTPS is required because location is sensitive personal data, and the secure connection protects it from man-in-the-middle attacks. Localhost is exempt for development purposes.

**Q2: Explain the difference between getCurrentPosition() and watchPosition().**
A: `getCurrentPosition()` retrieves location once, while `watchPosition()` monitors location continuously and returns a watch ID that can be used with `clearWatch()` to stop monitoring. `watchPosition()` is useful for navigation apps but consumes more battery.

**Q3: How do you handle permission denial gracefully?**
A: Check error.code === 1 for PERMISSION_DENIED. Provide an explanation to users and offer fallback options like IP-based geolocation or manual location input. Guide users to browser settings if they want to restore permissions.

**Q4: What's the Haversine formula and when would you use it?**
A: It calculates the great-circle distance between two points on Earth given their latitude/longitude. Used for proximity detection, finding nearby locations, and measuring travel distances. Formula accounts for Earth's spherical shape.

**Q5: Discuss accuracy vs. performance trade-offs in Geolocation API options.**
A: `enableHighAccuracy: true` uses GPS for better accuracy but takes longer and consumes more battery. `enableHighAccuracy: false` uses WiFi/IP for speed. Set appropriate `timeout` and `maximumAge` based on use case. For navigation, accuracy is crucial; for general location, performance may be prioritized.

**Q6: How would you implement geofencing?**
A: Use `watchPosition()` to continuously monitor user location. Compare calculated distance to a target point using the Haversine formula. Trigger callbacks when distance becomes less than radius (entry) or greater than radius (exit).

**Q7: What privacy concerns exist with the Geolocation API?**
A: Users need explicit permission, which can be revoked. Apps shouldn't request location without clear purpose. Avoid excessive tracking. Consider data minimization—only collect what's needed. Be transparent about how location is used and stored.

**Q8: Explain the error object in Geolocation API.**
A: Contains `code` (1: permission denied, 2: position unavailable, 3: timeout) and `message` with details. Always check error.code to distinguish between recoverable errors (timeout) and permanent ones (permission denied).

## Further Reading

### Official Documentation
- [MDN Web Docs - Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [W3C Geolocation API Specification](https://www.w3.org/TR/geolocation-API/)
- [WHATWG Living Standard - Geolocation](https://html.spec.whatwg.org/multipage/infrastructure.html#geolocation)

### Related Web APIs
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) - Offload heavy location calculations
- [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) - Check location permission status
- [Sensor APIs](https://www.w3.org/TR/generic-sensor/) - Accelerometer/Gyroscope for movement detection
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) - Alert users at geofence events

### Best Practices Articles
- [Google Maps Platform - Best Practices](https://developers.google.com/maps/documentation/javascript/bestpractices)
- [Smashing Magazine - Geolocation in Web Apps](https://www.smashingmagazine.com/)
- [CSS-Tricks - Geolocation Guide](https://css-tricks.com/)

### Tools and Libraries
- [Leaflet.js](https://leafletjs.com/) - Lightweight mapping library
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) - Interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) - Free mapping data
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Geolocation Accuracy](https://geolocation-db.com/) - IP-based geolocation service

### Performance Optimization
- [Progressive Web Apps - Location Services](https://web.dev/progressive-web-apps/)
- [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API) - Monitor device battery
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) - Pause tracking when app is hidden

### Security and Privacy
- [OWASP - Location Data Security](https://owasp.org/www-community/attacks/Insecure_Direct_Object_References)
- [Privacy Guidelines for Web Developers](https://www.mozilla.org/en-US/privacy/principles/)
- [Browser Location Tracking - Privacy Implications](https://www.eff.org/deeplinks/2023/11/google-chromes-privacy-sandbox)
