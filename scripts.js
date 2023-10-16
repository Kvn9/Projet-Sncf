   
    function mettreAJourHeure() {
       
        var heureElement = document.getElementById("heure");

     
        var date = new Date();
        var heure = date.getHours();
        var minute = date.getMinutes();
        var seconde = date.getSeconds();

        
        var heureFormattee =
          heure.toString().padStart(2, "0") +
          ":" +
          minute.toString().padStart(2, "0") +
          ":" +
          seconde.toString().padStart(2, "0");

       
        heureElement.textContent = heureFormattee;
      }

    
      setInterval(mettreAJourHeure, 1000);

function calculateDelayMinutes(departureDateTime, baseDepartureDateTime) {
    const departureTime = moment(departureDateTime);
    const baseDepartureTime = moment(baseDepartureDateTime);

    return departureTime.diff(baseDepartureTime, 'minutes');
}

function fetchTrainDepartures() {
    const url = "https://api.sncf.com/v1/coverage/sncf/stop_areas/stop_area%3ASNCF%3A87113001/departures?datetime={datetime}";
    const headers = { "Authorization": process.env.AUTHORIZATION_KEY };

    const currentDateTime = new Date();
    const limitDateTime = new Date(currentDateTime.getTime() + 85 * 60000);
    const formattedLimitDateTime = limitDateTime.toISOString().slice(0, 19);

    const requestUrl = url.replace("{datetime}", formattedLimitDateTime);

    fetch(requestUrl, { headers })
        .then(response => {
            if (!response.ok) {
                throw new Error("Une erreur s'est produite lors de la récupération des données des départs de train.");
            }
            return response.json();
        })
        .then(data => {
            const trainsContainer = document.getElementById("trains-container").getElementsByTagName('tbody')[0];
            trainsContainer.innerHTML = "";

            data.departures.forEach(train => {
                const trainHTML = createTrainHTML(train, data.disruptions);
                const newRow = trainsContainer.insertRow();
                newRow.innerHTML = trainHTML;
            });
        })
        .catch(error => {
            console.log("Erreur :", error);
        });
}

function createTrainHTML(train, disruptions) {
    const trainType = getTrainType(train.display_informations.commercial_mode);
    const trainNumber = train.display_informations.headsign;
    const departureTime = train.stop_date_time.base_departure_date_time.slice(9, 11) + "h" + train.stop_date_time.base_departure_date_time.slice(11, 13);
    const destinationCity = train.display_informations.direction.split(' (')[0];

    let trainStatus = "À l'heure";
    let statusClass = "on-time";

    if (train.stop_date_time.base_departure_date_time !== train.stop_date_time.departure_date_time) {
        const delayMinutes = calculateDelayMinutes(train.stop_date_time.departure_date_time, train.stop_date_time.base_departure_date_time);
        trainStatus = `Retardé +${delayMinutes} min`;
        statusClass = "retard";
    }

    return `
        <td>${trainType}</td>
        <td>${trainNumber}</td>
        <td class="departure-time">${departureTime}</td>
        <td class="train-status"${statusClass}">${trainStatus}</td>
        <td>${destinationCity}</td>
    `;
}

function getTrainType(commercialMode) {
    switch (commercialMode) {
        case "Train":
            return "Transilien";
        case "TER":
            return "TER";
        case "TGV":
            return "TGV";
        default:
            return commercialMode;
    }
}

function updateTrainDepartures() {
    fetchTrainDepartures();
    setTimeout(updateTrainDepartures, 60000); // Update every minute
}

// Initial fetch of train departures and periodic update
fetchTrainDepartures();
setTimeout(updateTrainDepartures, 60000); // Update every minute
