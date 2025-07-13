const socket = io("https://tracking.revvy.one/");

socket.on("connect", () => {
  console.log("Connected to Socket.IO server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// Send signal check to server every 5 seconds
setInterval(() => {
  socket.emit('pong');
}, 5000);

let myCoordinate = [];
let destinationCoordinate = [0, 0];
let plateNubmer;

var map = L.map("map").setView(destinationCoordinate, 15);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// This will get and watch the user coordinate
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      myCoordinate = [latitude, longitude];
      map.panTo(myCoordinate);
    },
    (error) => {
      console.error("❌ Geolocation error:", error.message);
    }
  );

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      myCoordinate = [latitude, longitude];
      updateLocation();
    },
    (error) => {
      console.error("Location error:", error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

const setInfo = () => {
  if (!plateNubmer) {
    console.log("SET INFO" + plateNubmer);
    return;
  }

  socket.emit('info', {
    role: "user",
    plateNubmer: plateNubmer,
    driver: "Name",
    location: {
      current: myCoordinate,
      destination: destinationCoordinate
    }
  });
}

const updateLocation = () => {
  if (!plateNubmer) {
    console.log("UPDATE" + plateNubmer);
    return;
  }

  socket.emit('update_location', {
    location: {
      current: myCoordinate,
      destination: destinationCoordinate
    },
    plateNubmer
  });
};

 // On button click, get center coordinates
document.getElementById('destination').addEventListener('click', () => {
  const pNumber = document.getElementById("platenumber").value;
  if (!pNumber) {
    alert("NO PLATE NUMBER");
    return;
  }

  plateNubmer = pNumber;

  const center = map.getCenter();
  destinationCoordinate = [center.lat, center.lng];
  setInfo();
  updateLocation();
  setPath();
});

let activeRoute = null;
const setPath = () => {
  if (myCoordinate.length <= 0 || destinationCoordinate.length <= 0) return;

  const from = L.latLng(myCoordinate[0], myCoordinate[1]);
  const to = L.latLng(destinationCoordinate[0], destinationCoordinate[1]);

  if (activeRoute) {
      activeRoute.setWaypoints([from, to]);
    } else {
      // Otherwise, create the route and save it for reuse
      activeRoute = L.Routing.control({
        waypoints: [from, to],
        routeWhileDragging: false,
        addWaypoints: false,
        show: false,
        createMarker: (i, wp) => {
          return L.marker(wp.latLng, {
            icon: L.icon({
              iconUrl: i === 0 ? 'https://pngimg.com/d/google_maps_pin_PNG82.png' : 'https://cdn-icons-png.flaticon.com/512/9356/9356230.png', // optional
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          });
        }
      }).addTo(map);
    }
};

