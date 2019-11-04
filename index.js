const getLocationApi = "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyAbOJBsHu8NRJnwsjAK_UONAWnDd2eh6LA";
const geocodeApi = "https://maps.googleapis.com/maps/api/geocode/json?address=";
const geocodeKey = "&key=AIzaSyAbOJBsHu8NRJnwsjAK_UONAWnDd2eh6LA&considerIp=true";
const foursquareApi = "https://api.foursquare.com/v2/venues/explore?ll=";
const foursquareKey = "&limit=5&client_id=2PI2SJK2PFRDFWHY0LUGA4WPN513K2AJMXWYUYIEBMR1J1N2&client_secret=AYSYE5XZ11F0KRTCDFOCHUIUYWGEL5F5X0DJFF5LBWOKPYOQ&v=20191001";
const geocodioApi = "https://api.geocod.io/v1.4/reverse?q=";
const geocodioKey = "&fields=census2010&api_key=8cccc5825cc2d2dc042d3db2d00b2d5dcd85bcd";
const censusApi = "https://api.census.gov/data/2017/acs/acs5?get=B01003_001E,B02001_002E,B02001_003E,B02001_004E,B02001_005E,B02001_006E,B02001_007E,B02001_008E,B03001_003E,B06009_002E,B06009_003E,B06009_004E,B06009_005E,B06009_006E,B06011_001E,NAME,B25064_001E,B01001H_001E,B01001_003E,B01001_004E,B01001_005E,B01001_006E,B01001_027E,B01001_028E,B01001_029E,B01001_030E&";
const censusKey = "&key=dbaa8376c3814b67ddc36b61de2290ee531ffe43";

//FUNCTIONS THAT ACTIVATE ON BUTTON PRESS

//When geolocation button is pressed, run functions to get location.
function watchButton() {
    $("#submit-button").on("click", event => {
        event.preventDefault();
        hideOldData();
        getLocationFromAPI();
    });
}

//When backup "enter info" button is pressed, run functions to get location.
function watchForm() {
    $(".place-name").submit(event => {
        event.preventDefault();
        const locationName = $("#city-name").val() + "+" + $("#state-name").val();
        getLocationFromInput(locationName);
        hideOldData();
    })
};



//FUNCTIONS THAT GET LATITUDE AND LONGITUDE FROM INPUT

//Get location from Google geolocation API. If this fails, run getLocationFromBrowser function.
//If successful, run displayresults.
function getLocationFromAPI() {
    fetch(getLocationApi)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(responseJson => displayResults(responseJson))
        .catch(err => {
            getLocationFromBrowser();
        });
}

//Set latitude and longitude values for current location, and plug these into Census and Foursquare APIs.
function displayResults(responseJson) {
    let latitude = responseJson.results[0].geometry.location.lat;
    let longitude = responseJson.results[0].geometry.location.lng;
    getFourSquareData(latitude, longitude);
    getLocationName(latitude, longitude);
}

//If this didn't work, console log error and see if browser can get location. If so, attempt this.
//Otherwise, display error telling user to input location manually.
function getLocationFromBrowser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showCoordinates);
    } else {
        displayError()
    }
}

//Get location from browser and run getLocationName function. 
//If successful, plug longitude and latitude into FourSquare and Census functions.
//Otherwise, display error telling user to input location manually.
function showCoordinates(position) {
    if (typeof position.coords.latitude != "number") {
        displayError();
    }
    else {
        getLocationName(position.coords.latitude, position.coords.longitude)
        getFourSquareData(position.coords.latitude, position.coords.longitude);
    };
}

//Use Google geocoding to get location from text. If successful, plug this into displayresults function.
function getLocationFromInput(locationName) {
    fetch(geocodeApi + locationName + geocodeKey)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(responseJson => displayResults(responseJson))
        .catch(err => {
            displayTextError();
        })
}

function displayError() {
    swal("Error", "We couldn't find this location. What Is This Place only works in the United States. If you're in the U.S., make sure your browser is connected to the internet, or try entering your location's name.", "error");
    $(".loading-screen").hide();
}

function displayTextError() {
    swal("Error", "We couldn't find this location. What Is This Place only works in the United States. If you're in the U.S., make sure your browser is connected to the internet and try again.", "error");
    $(".loading-screen").hide();
}


//USING LATITUDE AND LONGITUDE, GET AND HANDLE CENSUS DATA

//Use geocodio API to turn latitude and longitude info into current census track.
function getLocationName(lat, long) {
    fetch(geocodioApi + lat + "," + long + geocodioKey)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(responseJson => grabCensusData(responseJson))
        .catch(err => {
            displayTextError();
        })
};

//Take lat and long from geocodio and use Census API to get vital statistics for area.
//If it's a city, town or village, get statistics for that place. For rural areas, use census tract.
function grabCensusData(responseJson) {
    if (responseJson.results.length === 0) {
        swal("Error", "We couldn't find your location. You could be outside the United States, or not connected to the internet.", "error");
    }
    if (responseJson.results[0].fields.census[2010].place !== null) {
        let stateId = (responseJson.results[0].fields.census[2010].place.fips).slice(0, 2);
        let placeId = (responseJson.results[0].fields.census[2010].place.fips).slice(2);
        fetch(censusApi + `for=place:${placeId}&in=state:${stateId}` + censusKey)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then(responseJson => censusDisplay(responseJson))
            .catch(err => {
                displayTextError();
            }
            )
    }
    else {
        let stateId = (responseJson.results[0].fields.census[2010].county_fips).slice(0, 2);
        let countyId = (responseJson.results[0].fields.census[2010].county_fips).slice(2);
        let tractId = responseJson.results[0].fields.census[2010].tract_code;
        fetch(censusApi + `for=tract:${tractId}&in=county:${countyId}&in=state:${stateId}` + censusKey)
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then(responseJson => censusDisplay(responseJson))
            .catch(err => {
                displayTextError();
            }
            )
    }
}

//Format, calculate and display census data.
function censusDisplay(responseJson) {
    let cityName2 = (responseJson[1][15]).replace(/ city/g, "");
    let cityName = cityName2.replace(/ village/g, "");
    let population = responseJson[1][0];
    let underEighteen = parseInt(responseJson[1][20]) + parseInt(responseJson[1][21]) + parseInt(responseJson[1][22]) + parseInt(responseJson[1][23]) + parseInt(responseJson[1][24]) + parseInt(responseJson[1][25]) + parseInt(responseJson[1][18]) + parseInt(responseJson[1][19]);
    let overEighteen = population - underEighteen;
    let medianRent = responseJson[1][16];
    let percentWhite = Math.round(responseJson[1][1] / responseJson[1][0] * 100);
    let percentBlack = Math.round(responseJson[1][2] / responseJson[1][0] * 100);
    let percentAsian = Math.round(responseJson[1][4] / responseJson[1][0] * 100)
    let percentLatino = Math.round(responseJson[1][8] / responseJson[1][0] * 100)
    let percentindigenous = Math.round(((responseJson[1][5] / responseJson[1][0]) * 100) + ((responseJson[1][3] / responseJson[1][0]) * 100))
    let percentOther = Math.round(((responseJson[1][6] / responseJson[1][0]) * 100) + ((responseJson[1][7] / responseJson[1][0]) * 100))
    let percentSomeCollege = Math.round(((responseJson[1][11] / overEighteen) * 100) + ((responseJson[1][12] / overEighteen) * 100) + ((responseJson[1][13] / overEighteen) * 100))
    let percentCollege = Math.round(((responseJson[1][12] / overEighteen) * 100) + ((responseJson[1][13] / overEighteen) * 100))
    let averageIncome = responseJson[1][14]
    let percentNHWhite = Math.round((responseJson[1][17] / population) * 100)
    let diversity = "";
    let avgIncome = "";
    let avgEducation = "";

    if (percentNHWhite > 70) {
        diversity = "less diverse than";
    } else if (percentNHWhite > 50) {
        diversity = "about as diverse as";
    } else { diversity = "more diverse than" }

    if (averageIncome > 35000) {
        avgIncome = "higher than";
    } else if (averageIncome > 26000) {
        avgIncome = "similar to";
    } else { avgIncome = "lower than" }

    if (population > 500000) {
        citySize = "large city";
    } else if (population > 200000) {
        citySize = "medium-sized city";
    } else if (population > 50000) {
        citySize = "small city";
    } else if (population > 10000) {
        citySize = "small community";
    } else { citySize = "very small community" }

    if (percentCollege > 38) {
        avgEducation = "more educated than";
    } else if (percentCollege > 24) {
        avgEducation = "about as educated as";
    } else { avgEducation = "less educated than" }
    $(".census-info").append(`<h1>This place is ${cityName}!</h1><h2>Who lives here?</h2><p>${cityName} has a population of <span class="highlight-data">${population}</span>, which makes it a <span class="highlight-data">${citySize}</span>. ${percentSomeCollege} percent of residents have at least some college education, and ${percentCollege} percent have at least a bachelor's degree, which means that this place is <span class="highlight-data">${avgEducation}</span> the nation as a whole. The average income here is <span class="highlight-data">$${averageIncome} per year</span>, which is ${avgIncome} the national average. The median rent here is $${medianRent} per month. <br><br>${cityName} is <span class="highlight-data">${diversity}</span> the nation as a whole. ${percentWhite} percent of residents are white, ${percentBlack} percent are black, ${percentAsian} percent are Asian, ${percentindigenous} percent are American Indian or indigenous peoples, and ${percentOther} percent identify as something else or two or more races. ${percentLatino} percent identify as Hispanic or Latino, of any race.</p>`);
    showPlaceInfo();
}



//USING LATITUDE AND LONGITUDE, GET AND HANDLE FOURSQUARE DATA

//Get Foursquare data from Foursquare API.
function getFourSquareData(lat, long) {
    fetch(foursquareApi + lat + "," + long + foursquareKey)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(responseJson => displayFourSquare(responseJson))
        .catch(err => {
            displayTextError();
        })
};

//Format Foursquare data for display and put on page.
function displayFourSquare(responseJson) {
    for (i = 0; i < responseJson.response.groups[0].items.length; i++) {
        let venueAddress = responseJson.response.groups[0].items[i].venue.location.formattedAddress[0] + ", " + responseJson.response.groups[0].items[i].venue.location.formattedAddress[1]
        let venueType = responseJson.response.groups[0].items[i].venue.categories[0].name;
        let venueName = responseJson.response.groups[0].items[i].venue.name;
        $(".foursquare-venues").append(`<li><h3>${venueName}</h3>${venueType}<br>${venueAddress}</li>`)
    }
}


//DISPLAY/HIDE DATA

function showPlaceInfo() {
    $(".place-info").slideDown(2000);
    $(".loading-screen").hide();
    $(".instructions").empty();
    $(".instructions").append("Want to search for another place? Press the button below to get info about your location using GPS. Make sure your device or browser has permission to access your location.");
}


function hideOldData() {
    $(".loading-screen").show();
    $(".place-info").hide();
    $("html, body").animate({ scrollTop: 0 });
    $(".census-info").empty();
    $(".foursquare-venues").empty();
    $("#city-name").val("");
    $("#state-name").val("");
    $(".display-error").empty();
}



watchButton();
watchForm();