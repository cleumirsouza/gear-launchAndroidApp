if (localStorage.getItem("isUnload") == "ok") {
	console.log("isUnload = OK!");
	localStorage.setItem("isUnload", "no");
	window.location.replace('../../../../index.html');
}

var car = {};
var map;
var user = {};
var coords;
var distance_current, distance_init, distance_calc = 0, distanceMt, flag_car, enablePosition;
var marker_User, markers = [];
var path_img = "../../../../../assets/img/";
var flightPath;
var textButton = document.getElementById('distance');

(function() {

	$("#distance").hide();
	localStorage.setItem("findMyCar-back-reset", "back-reset");
	var findMyCar = document.getElementById("findMyCar");
	findMyCar.addEventListener("pagebeforeshow", function() {
		enablePosition = false;
		
		watchPosition();
		
		utils.loadingScreen("locationPage", false);
//		utils.loadingScreen("findMyCar", true);
		setTimeout(function() {
			utils.loadingScreen("findMyCar", true, TIZEN_L10N.label_loading_map);
		}, 500);

		car = {
			lat: car_location_info.gpsData.latitude,
			lng: car_location_info.gpsData.longitude
		};
		
		checkInternetGps();
		
	});
	
	findMyCar.addEventListener("pagehide", function() {
		navigator.geolocation.clearWatch(idPosition);
		console.log('mapPage: call pagehide');
	});
	
}());

function checkInternetGps() {
//	$("#map").css("background-color", "white");
	
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition( 
			function (position) {
				console.log("location: OK");
				if(position.coords ) {
					user.lat = position.coords.latitude;
					user.lng = position.coords.longitude;
					$.ajax({
					    url: "http://www.google.com",
					    context: document.body,
					    error: function(jqXHR, exception) {
					    	localStorage.setItem("findMyCar-back-reset", "back-reset");
					    	utils.loadingScreen("findMyCar", false);
				    		route.go("notification_no_gps");
					    },
					    success: function() {
					    	console.log("internet: OK");
					    	
				    		if (typeof google === 'object' && typeof google.maps === 'object') {
				    			console.log("has google maps");
				    			loadMap();
					    	 } else {
					    		 console.log("there is not google maps");
					    		 loadScript();
					    		 loadMap();
					    	 }
					    }
					});
					
				} else {
					utils.loadingScreen("findMyCar", false);
					alert("There is not location");
				}
			}, function (error) {
				localStorage.setItem("findMyCar-back-reset", "back-reset");
				console.log("error geolocation");
				
				setTimeout( function() {
					utils.loadingScreen("findMyCar", false);
					route.go("notification_no_gps");
				}, 1500
						
				);
				
			}, {
				enableHighAccuracy: true,
				timeout : 7000
				
			}
		);
	} else {
		utils.loadingScreen("findMyCar", false);		
		alert("Your browser does not support the Geolocation API");
	}
}

function locError(err) {
	console.log("Impossible get your position");
	localStorage.setItem("findMyCar-back-reset", "back-reset");
	route.go("notification_no_gps");
}

function loadMap() {
	flag_car = new google.maps.LatLng(car.lat, car.lng);
	console.log("flag_car");
	console.log(flag_car);
	
	initMap();
}

/*
	Crating the map
*/
function initMap() {
	
	console.log('onLoad map');
	
	// Create a map object and specify the DOM element for display.
	var options = {
		disableDefaultUI: true,
		draggable: false,
		scrollwheel: false,
		disableDoubleClickZoom: true,
		zoom: 11,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	utils.loadingScreen("findMyCar", false);
	
	//create the map
	map = new google.maps.Map(document.getElementById('map'), options);
	console.log(map);
	
	//getting the distance between points.
	mapGetDistance();
}
var idPosition, target, options;
function watchPosition () {
	idPosition = navigator.geolocation.watchPosition(positionUpdate, positionError, { enableHighAccuracy: true });
}

/**
 * @private
 * @param {GeolocationPosition} position
 */
function positionUpdate (position) {
	
	if(enablePosition) {
		var crd = position.coords;
		  var fitBoundsCount = 0;

		  var lat = crd.latitude, lng = crd.longitude;
	      var coords = new google.maps.LatLng(lat, lng);
	      marker_User.setPosition(coords);
	      flightPath.setPath([{lat: lat, lng: lng}, car]);
	      markers[1] = marker_User;
	      
	      distance_current = google.maps.geometry.spherical.computeDistanceBetween(coords, flag_car);
	      
	      distanceMt = utils.parseKmMt(distance_current);
	  	  textButton.innerText = distanceMt;

	      distance_calc += Math.abs(distance_init - distance_current);
	      console.log("distance_calc: " + distance_calc);
	      distance_init = distance_current;
	      fitBoundsCount = fitBoundsCount + distance_calc;
	      
	      if(distance_current > 600) {
	    	  if(distance_calc > 400) {
	    		  console.log("IF 999: " + distance_calc);
	    		  distance_calc = 0;
	    	      autoCenterMap(map);
	    	  } else if (fitBoundsCount > 15) {
	        	  onlyFitBound();
	        	  fitBoundsCount = 0;
	          }
	      } else if (distance_current > 9) {
			  if (distance_current > 120) {
				  if (fitBoundsCount > 15) {
		        	  onlyFitBound();
		        	  fitBoundsCount = 0;
				  }
			  }
		  } else {
			  console.log('você alcançou o destino');
			  $("#distance").click(function() {
					window.history.go(-2);
				});
			  if ($("#distance").hasClass("content-footer")) {
			        $("#distance").removeClass("content-footer").addClass("found-footer-location");
			  }
			  localStorage.setItem("findMyCar-back-reset", "back-reset");
			  // drop line
			  flightPath.setMap(null);
			  // drop marker car
			  markers[0].setMap(null);
			  
			  var changeUserIcon = markers[1];
			  
			  // fit Bound
			  map.setCenter(changeUserIcon.getPosition());

			  // set new image to user marker
			  changeUserIcon.setIcon(path_img + "ic-flag.png");
			  
	          navigator.geolocation.clearWatch(idPosition);
	          textButton.innerText = TIZEN_L10N.map_found_car;
	          
	          var request = {
						"context" : Context.CONTEXT_PARKING,
						"action" : External_Action.ACTION_PARKING_RESET_LOCATION
					};
	          service.sendMessage(request);  
		  }
		
	} else {
		console.log("enable Position: false");
	}
}

function positionError (error) {
    switch(error.code) {
    case error.PERMISSION_DENIED:
        console.log("User denied the request for Geolocation.");
        break;
    case error.POSITION_UNAVAILABLE:
        console.log("Location information is unavailable.");
        break;
    case error.TIMEOUT:
        console.log("The request to get user location timed out.");
        break;
    case error.UNKNOWN_ERROR:
        console.log("An unknown error occurred.");
        break;
    }
}

function mapGetDistance () {
	var marker_user = new google.maps.LatLng(user.lat, user.lng);
	var marker_car = new google.maps.LatLng(car.lat, car.lng);
	distance_init = google.maps.geometry.spherical.computeDistanceBetween(marker_user, marker_car);
	distanceMt = utils.parseKmMt(distance_init);
	console.log("distancia: " + distanceMt);
	var intDist = distanceMt.split(" ")[0];
	if(intDist > 8) {
		console.log("distancia maior que 8: " + distanceMt);
		textButton.innerText = distanceMt;

		//draw the line
	   	mapDrawLine(map, user, car);
	    //add markers
		mapCreateMarker(map);
		
	} else {
		 console.log('você alcançou o destino');
		  $("#distance").click(function() {
				window.history.go(-2);
			});
		  if ($("#distance").hasClass("content-footer")) {
		        $("#distance").removeClass("content-footer").addClass("found-footer-location");
		  }
		  localStorage.setItem("findMyCar-back-reset", "back-reset");
		  
			var image2 = {
				url: path_img + "ic-flag.png",
				size: new google.maps.Size(51, 45)
			};

			// CAR
			var marker_car = new google.maps.Marker({
				map: map,
			    position: car,
			    icon: image2,
			});
				
		  // drop line
		  //flightPath.setMap(null);
		  // drop marker car
		  //markers[0].setMap(null);
		  
		  var changeUserIcon = marker_car;
		  
		  // fit Bound
		  map.setCenter(changeUserIcon.getPosition());
		  map.setZoom(15);
		  
//			var bounds = new google.maps.LatLngBounds();
//			
//			for (var int = 0; int < markers.length; int++) {
//				bounds.extend(changeUserIcon.getPosition());
//			}
//			map.fitBounds(bounds);

		  // set new image to user marker
//		  changeUserIcon.setIcon(path_img + "ic-flag.png");
		  
	     navigator.geolocation.clearWatch(idPosition);
	     textButton.innerText = TIZEN_L10N.map_found_car;
	     
	     var request = {
					"context" : Context.CONTEXT_PARKING,
					"action" : External_Action.ACTION_PARKING_RESET_LOCATION
				};
	     service.sendMessage(request);
	}
}

function mapCreateMarker (map) {
	var image1 = {
		url: path_img + 'ic-position.png',
		size: new google.maps.Size(28, 28)
	};
	var image2 = {
		url: path_img + 'ic-car.png',
		size: new google.maps.Size(51, 45)
	};

	// CAR
	var marker_car = new google.maps.Marker({
		map: map,
	    position: car,
	    icon: image2,
	});

	// USER
	marker_User = new google.maps.Marker({
	  map: map,
	  position: user,
	  icon: image1,
	});
	
	markers.push(marker_car);
	markers.push(marker_User);
//	watchPosition();
	onlyFitBound();
	setTimeout(function() {
//		utils.loadingScreen("locationPage", false);
		$("#distance").show();
		enablePosition = true;
	}, 5500);
	
//	google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
//		console.log("1 - tilesloaded");
//		utils.loadingScreen("locationPage", false);
//	});
}
var updateTime = 0;

function onlyFitBound() {
	console.log("fit  bounds");
	var bounds = new google.maps.LatLngBounds();
	
	for (var int = 0; int < markers.length; int++) {
		bounds.extend(markers[int].getPosition());
	}
	map.fitBounds(bounds);
}

function autoCenterMap (map, firstTime) {
	console.log('update ZOOM');
	
	var runAutoZoom = function() {
		// markers - array of Markers - recursive method
		var bounds = new google.maps.LatLngBounds();
		
		for (var int = 0; int < markers.length; int++) {
			bounds.extend(markers[int].getPosition());
		}

		map.setZoom(map.getZoom() - 1);
		console.log("ZOOM VALUE: " + map.getZoom());
		if (map.getZoom() > 11) {
		    map.setZoom(11);
		}
		map.fitBounds(bounds);
		updateTime = 0;
	};
	if(firstTime) {
		runAutoZoom();
	} else {
		if(updateTime == 0) {
			updateTime = setTimeout(runAutoZoom, 3000);
		}
	}
}

function mapDrawLine (map, userPosition, carPosition) {

	var flightPlanCoordinates = [userPosition, carPosition];
	var lineSymbol = {
		    path: 'M 0,-1 0,1',
		    strokeOpacity: 1,
		    scale: 4
		  };

	flightPath = new google.maps.Polyline({
	    path: flightPlanCoordinates,
	    icons: [{
	        icon: lineSymbol,
	        offset: '0',
	        repeat: '20px'
	      }],
	    geodesic: true,
	    strokeColor: '#7a869b',
	    strokeWeight: 7
	});

	flightPath.setMap(map);
}