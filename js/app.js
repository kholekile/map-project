var map;
var markers = [];
var marker;
var largeInfowindow;
var bounds;
var $nytHeaderElem = $('#nytimes-header');
var $nytElem = $('#nytimes-articles');
var $loadingImage = $('#loading-image');
var $resetButton = $('#reset-map-button');
var apiKey = '760c15eb398046998308040995d31403';


/**
* @description Represents a book
* @constructor
* @param {string} title - The title of the book
* @param {string} author - The author of the book
*/

function initMap(){

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    styles: styles,
    mapTypeControl: false
  });


  $loadingImage.hide();
  largeInfowindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();

  loadMarkers(locations);
}

function populateInfoWindow(marker, infowindow){
  
  var infoWindowContent;

  if (infowindow.marker != marker && marker != null && marker.getAnimation() !== null) {
    getNewYorkTimesData(marker.title);

    infowindow.marker = marker;
    infoWindowContent = '<div> ' + '<p><strong><u>' + marker.title + '</u></strong></p>' + 
                        '<p>'+ marker.description +'<a target="_blank" href=" '+ 
                          marker.read_more_link + '">' +' Read more' + '</a>'+ '</p>' + 
                        '</div>';
    infowindow.setContent(infoWindowContent);
    infowindow.open(map, marker);

    stopeBounceAnimation(marker);

    infowindow.addListener('closeclick',function(){
      stopeBounceAnimation(marker);
      infowindow.marker = false;
      emptyDomElement();
    });
  }
}

function emptyDomElement(){
  $nytHeaderElem.empty();
  $nytElem.empty();
}

function getNewYorkTimesData(location){

  var nytimesUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q=' + location + 
                  '&sort=newest&api-key='+ apiKey;

  $.ajax({
      type: 'GET',
      url: nytimesUrl,
      dataType: "json",
      beforeSend: function(){
        emptyDomElement();
        $loadingImage.show();
      },
      complete: function(){
        $loadingImage.hide();
      },
      success: function (dataResponse){
          $nytHeaderElem.text('New York Times Article About '+ location);
          articles = dataResponse.response.docs;

          for (var i = 0 ; i < articles.length; i++) {
            var article = articles[i];
            $nytElem.append('<li class="article">' +
                            '<a target="_blank" href="' + article.web_url+ '">' + 
                            article.headline.main+ '</a>' +
                            '<p>' + article.snippet + '</p>' + 
                            '</li>'
                          );
          };
      },
      error: function (result) {
        alert("Something went wrong when the application tried " +
              "to load the New York Times Articles for "+ location);
      }
  });
}

function loadMarkers(locations){

  if (locations) {
    
    for (var i = 0; i < locations.length; i++) {
          
      var position = locations[i].location;
      var title = locations[i].title;
      var description = locations[i].description;
      var read_more_link =  locations[i].read_more_link;
          
      marker = createMarker(locations[i]);
      markers.push(marker);
      
      marker.addListener('click', function() {
        seteBounceAnimation(this);
        populateInfoWindow(this, largeInfowindow);
      });

      bounds.extend(markers[i].position);
    }

    map.fitBounds(bounds);

    }else{

      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
  }
}

function seteBounceAnimation(marker){
  if (marker.getAnimation() === null) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }  
}

function stopeBounceAnimation(marker){
  if (marker !== null) {
    marker.setAnimation(null); 
  }
}

function clearMarkers(){
  locations = null;
  loadMarkers(locations);
}

function createMarker(location){

  marker = new google.maps.Marker({
    map: map,
    position: location.location,
    title: location.title,
    description: location.description,
    read_more_link : location.read_more_link,
    animation: google.maps.Animation.DROP,
  });

  return marker;
}

function getErrorMessage(){

   alert( "An Unknown error took place, " +
          "Please try and hard refrsh the application, " +
          "Press (ctrl and shift and R)"
        );
}

var Location = function(data) {

  this.title = ko.observable(data.title);
  this.location = { lat : ko.observable(data.location.lat),
                    lng : ko.observable(data.location.lng)
                  };
  this.description = ko.observable(data.description);
  this.read_more_link = ko.observable(data.read_more_link);
}

var ViewModel = function() {

  var self = this;

  self.locationList = ko.observableArray([]);
  self.query = ko.observable();
  self.filteredArray = ko.observableArray([]);
  self.popUpMarker = ko.observable();

  locations.forEach(function(placeLocation) {
    self.locationList.push(new Location(placeLocation));
  });

  self.filteredLocations = ko.computed(function() {
    if (!self.query()) {
      $resetButton.click();
      self.filteredArray = self.locationList();
      return self.filteredArray;
    } else { 
      self.filteredArray = self.locationList()
      .filter(Location => Location.title().toLowerCase().indexOf(self.query().toLowerCase()) > -1);
     clearMarkers();
     loadMarkers(ko.toJS(self.filteredArray));
     return self.filteredArray;
    }
  }); 

  self.currentSelected = ko.observable();

  self.selectItem = function (location) {
    emptyDomElement();
    self.currentSelected(location);  
    self.popUpMarker = createMarker(ko.toJS(self.currentSelected));
    populateInfoWindow(self.popUpMarker, largeInfowindow);
  }

  self.resetMap = function(){
    clearMarkers();
    loadMarkers(ko.toJS(self.locationList));
  }
};

ko.applyBindings(new ViewModel());