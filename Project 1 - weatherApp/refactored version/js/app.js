$(document).ready(function() {
 
  function API() {
	  this.cache = {};
	  
	  this.addToCache = function(location, data){
		  this.cache[location] = data; 
	  }
	  this.searchLocation = function(searchLocation, callback){
		  if(this.cache[searchLocation])
		  {
		    alert("showing cached result");
		    callback(this.cache[searchLocation])
		  }
		  else
		  {
		    var url = "http://api.wunderground.com/api/e0bb37aff4e256e4/conditions/q/"+searchLocation+".json";
			$.getJSON(url, callback);
		  }
	  }
	  
	  this.getWeatherByID = function(searchID, callback){
		  var url = "http://api.wunderground.com/api/e0bb37aff4e256e4/conditions"+searchID+".json";
		  $.getJSON(url, callback);
	  }
	  
	  this.getAutoWeather = function(callback){
		  var url = "http://api.wunderground.com/api/e0bb37aff4e256e4/conditions/q/autoip.json";
		  $.getJSON(url, callback);
	  }
  }
 
  
  function BasicResponse(data) {
	  this.data = data;
	  this.decorator;
	  this.render = function(){
		  var resultHTML;
		  if(this.decorator)
			  resultHTML = decorators[this.decorator].render(this.data);
		  else {
			  resultHTML = '<h3>Currently at '+this.data.current_observation.display_location.full+':</h3>';
			  resultHTML += '<p>'+this.data.current_observation.weather+' &mdash; '+this.data.current_observation.temp_c+'&deg;C</p>';
			  resultHTML += '<img src="'+this.data.current_observation.icon_url+'">';
		  }
		  $('#weather_results').html(resultHTML);
	      $('#weather_results').show();
	  }
	  this.decorate = function(decorator){
		  this.decorator = decorator;
	  }
  }
  
  var callback = function(data) { // Callback for AJAX
	    if (data.current_observation != undefined) { // If location found and weather retrived
	      var weatherResponse = new BasicResponse(data);
	      weatherResponse.render();
	    }
	    else if (data.response.results != undefined) { // If multiple locations found, display list
	      var weatherResponse = new BasicResponse(data);
	      API.addToCache($('#search').val(), data);
	      weatherResponse.decorate('locationsResponse');
	      weatherResponse.render();
	    } 
	    
	    else if (data.response.error != undefined) { // If an error is returned
	      showError(data.response.error.description);
	    } 
	    else { // If all else fails
	      showError('Unknown error. Please try again');
	    }
  };
  
  var decorators = {};
  decorators.locationsResponse = {
	  render: function(data){
		  var resultsHTML = '<h3>Multiple Results Found:</h3>';
		  $.each(data.response.results, function (i, results) {
		        resultsHTML += '<p id="'+results.l+'"><a href="#">'+results.city+', '+(results.country_name != "USA" ? results.country_name : results.state)+'</a></p>';
		      });
		   $('#weather_results').html(resultsHTML);
		   $('#weather_results').show();
		   $('#weather_results').on('click','a', $.proxy(function (evt) { // Query weather for location results when one is selected	
			   evt.preventDefault();
			   var searchID = $(this).parent().attr("id");
		       API.getWeatherByID(searchID, callback);
		  }));
		  return resultsHTML;
	  }
  };  
  
  var API = new API();
  $('form').submit(function (evt) { // AJAX request for location search
    evt.preventDefault();
    var searchLocation = $('#search').val();
    if (searchLocation === "") { // Don't actually request if no location is entered
      return;
    } else { // Otherwise you're good to go
      API.searchLocation(searchLocation, callback);
    }
  });

  $('#current_location').click(function (evt) { // AJAX request for current location
    evt.preventDefault();
    API.getAutoWeather(callback);
  });
  
  $(document).ajaxError(function() { // Display error if weather JSON could not be retrieved
    showError('Weather data could not be found. Check your connection and try again.');
  });
  
  function showError(msg){
	  $('#weather_results').html('<p>Error: '+msg+'</p>');
      $('#weather_results').show();
  }
});