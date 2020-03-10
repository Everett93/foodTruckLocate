// This example uses the autocomplete feature of the Google Places API.
// It allows the user to find all food trucks in a given place, within a given
// country. It then displays markers for all the food trucks returned,
// with on-click details for each hotel.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map, places, infoWindow;
var markers = [];
var autocomplete;
var MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
var hostnameRegexp = new RegExp('^https?://.+?/');

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.1, lng: -95.7},
    zoom: 5,
    mapTypeControl: false,
    panControl: true,
    zoomControl: true,
    streetViewControl: true
  });
//InfoWindow displaying "you are here"
  myLocationBubble = new google.maps.InfoWindow;

//Polulates info box for each marker
  infoWindow = new google.maps.InfoWindow({
    content: document.getElementById('info-content')
  });

//Calls myLocation function if nearMe button is clicked  
document.getElementById('nearMe').addEventListener('click', myLocation);

  // Create the autocomplete object and associate it with the UI input control.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {!HTMLInputElement} */ (
          document.getElementById('autocomplete')));
  places = new google.maps.places.PlacesService(map);
  autocomplete.addListener('place_changed', onPlaceChanged);
}

//finds the users current location
function myLocation(){
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function(position) {
    var pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

//Ceters on current location and shows pop up bubble over current location
    myLocationBubble.setPosition(pos);
    myLocationBubble.setContent('You are here');
    myLocationBubble.open(map);
    map.setCenter(pos);
    map.setZoom(12);
    search();
  }, 
//Handles errors if user's location is unavailable
  function() {
    handleLocationError(true, myLocationBubble, map.getCenter());
  });
} 
else {
  // Browser doesn't support Geolocation
  handleLocationError(false, myLocationBubble, map.getCenter());
}
function handleLocationError(browserHasGeolocation, myLocationBubble, pos) {
myLocationBubble.setPosition(pos);
myLocationBubble.setContent(browserHasGeolocation ?
                      'Error: The Geolocation service failed.' :
                      'Error: Your browser doesn\'t support geolocation.');
myLocationBubble.open(map);
}
}

// When the user selects an area, address, or place, using Autocomplete, center on that area and
// zoom the map in
function onPlaceChanged() {
  var place = autocomplete.getPlace();
  if (place.geometry) {
    map.panTo(place.geometry.location);
    map.setZoom(12);
    search();
  } else {
    document.getElementById('autocomplete').placeholder = 'Enter a location';
  }
}

// Search for food trucks in the selected area, within the viewport of the map.
function search() {
  var search = {
    bounds: map.getBounds(),
    keyword: 'food truck'
  };

  places.nearbySearch(search, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      clearResults();
      clearMarkers();
      // Create a marker for each food truck found, and
      // assign a letter of the alphabetic to each marker icon.
      for (var i = 0; i < results.length; i++) {
        var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
        var markerIcon = MARKER_PATH + markerLetter + '.png';
        // Use marker animation to drop the icons incrementally on the map.
        markers[i] = new google.maps.Marker({
          position: results[i].geometry.location,
          animation: google.maps.Animation.BOUNCE,
          icon: markerIcon
        });
// If the user clicks a food truck marker, show the details of that truck in an info window.
        markers[i].placeResult = results[i];
        google.maps.event.addListener(markers[i], 'click', showInfoWindow);
//Sets interval in between each icon dropping on map
        setTimeout(dropMarker(i), i * 100);
        addResult(results[i], i);
      }
    }
  });
}

function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  }
  markers = [];
}

function dropMarker(i) {
  return function() {
    markers[i].setMap(map);
  };
}

//Loads names of trucks into table next to the map
function addResult(result, i) {
  var results = document.getElementById('results');
  var markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
  var markerIcon = MARKER_PATH + markerLetter + '.png';

  var tr = document.createElement('tr');
  tr.style.backgroundColor = (i % 2 === 0 ? '#F0F0F0' : '#FFFFFF');
  tr.onclick = function() {
    google.maps.event.trigger(markers[i], 'click');
  };

  var iconTd = document.createElement('td');
  var nameTd = document.createElement('td');
  var icon = document.createElement('img');
  icon.src = markerIcon;
  icon.setAttribute('class', 'placeIcon');
  icon.setAttribute('className', 'placeIcon');
  var name = document.createTextNode(result.name);
  iconTd.appendChild(icon);
  nameTd.appendChild(name);
  tr.appendChild(iconTd);
  tr.appendChild(nameTd);
  results.appendChild(tr);
}

function clearResults() {
  var results = document.getElementById('results');
  while (results.childNodes[0]) {
    results.removeChild(results.childNodes[0]);
  }
}

// Get the place details for a food truck. Show the information in an info window,
// anchored on the marker for the food truck that the user selected.
function showInfoWindow() {
  var marker = this;
  places.getDetails({placeId: marker.placeResult.place_id},
      function(place, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          return;
        }
        infoWindow.open(map, marker);
        buildtruckInfoContent(place);
      });
}

// Load the place information into the HTML elements used by the info window.
function buildtruckInfoContent(place) {
//Loads an image to the info box for the selected marker
  document.getElementById('truckInfo-icon').innerHTML = '<img class="foodTruckIcon" ' +
      'src="' + place.photos[0].getUrl() + '"/>';
//Displays name of truck      
  document.getElementById('truckInfo-url').innerHTML = '<b><a href="' + place.url +
      '">' + place.name + '</a></b>';
//Displays the trusck's address    
  document.getElementById('truckInfo-address').textContent = place.vicinity;
//Displays phone number if one is listed and nothing if none
  if (place.formatted_phone_number) {
    document.getElementById('truckInfo-phone-row').style.display = '';
    document.getElementById('truckInfo-phone').textContent =
        place.formatted_phone_number;
  } else {
    document.getElementById('truckInfo-phone-row').style.display = 'none';
  }

  // Assign a five-star rating to the food truck, using a black star ('&#10029;')
  // to indicate the rating the food truck has earned, and a white star ('&#10025;')
  // for the rating points not achieved.
  if (place.rating) {
    var ratingHtml = '';
    for (var i = 0; i < 5; i++) {
      if (place.rating < (i + 0.5)) {
        ratingHtml += '&#10025;';
      } else {
        ratingHtml += '&#10029;';
      }
    document.getElementById('truckInfo-rating-row').style.display = '';
    document.getElementById('truckInfo-rating').innerHTML = ratingHtml;
    }
  } else {
    document.getElementById('truckInfo-rating-row').style.display = 'none';
  }

  // The regexp isolates the first part of the URL (domain plus subdomain)
  // to give a short URL for displaying in the info window.
  if (place.website) {
    var fullUrl = place.website;
    var website = hostnameRegexp.exec(place.website);
    if (website === null) {
      website = 'http://' + place.website + '/';
      fullUrl = website;
    }
    document.getElementById('truckInfo-website-row').style.display = '';
    document.getElementById('truckInfo-website').textContent = website;
  } else {
    document.getElementById('truckInfo-website-row').style.display = 'none';
  }

  //Shows the times and days opened and closed
  console.log(place.opening_hours.weekday_text);
  if (place.opening_hours.weekday_text) {
    document.getElementById('truckInfo-hours-row').style.display = '';
    document.getElementById('truckInfo-hours').textContent =
        place.opening_hours.weekday_text;
  } else {
    document.getElementById('truckInfo-hours-row').style.display = 'none';
  }

    //Shows a review 
    if (place.reviews[0].text) {
      document.getElementById('truckInfo-reviews-row').style.display = '';
      document.getElementById('truckInfo-reviews').textContent = place.reviews[0].text;
    } else {
      document.getElementById('truckInfo-reviews-row').style.display = 'none';
    }
}
