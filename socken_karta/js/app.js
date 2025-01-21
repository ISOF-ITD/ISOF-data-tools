///**
// Test epsg3857 wgs84
var map = L.map('map').setView([63.26, 16.48], 5);

L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
//*/

/**
// Test sweref99 3006
// Define the SRS 3006 projection using Proj4Leaflet
var crs3006 = new L.Proj.CRS(
    'EPSG:3006',
    '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    {
        resolutions: [
			// 39054.54665209509, 19527.273326047543, 9763.636663023772, 4881.818331511886, 2440.909165755943, 1220.4545828779715, 610.2272914389857, 305.11364571949287, 152.55682285974643, 76.27841142987322, 38.13920571493661, 19.069602857468304, 9.534801428734152, 4.767400714367076, 2.383700357183538, 1.191850178591769, 0.5959250892958845, 0.29796254464794225, 0.14898127232397113
			// Enligt Topografisk webbkarta Visning, cache "Teknisk beskrivning" för TILEMATRIX på https://geotorget.lantmateriet.se/dokumentation/GEODOK/70/latest/atkomst-och-leverans/teknisk-beskrivning.html:
			// 3006: 0,1,2, ..., 13 (4096; 2048; 1024;...;0,5 meter/pixel)
			// 3857: 0,1,2, ...,13 (156543,0339280410; 78271,51696402048; 39135,75848201023;...;1,194328566955879 meter/pixel)
            4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5 //, 0.25
        ],
        // origin: [0, 0],
        // bounds: L.bounds([0, 0], [1200000, 8500000])		
        origin: [-1200000.000000, 8500000.000000],
        bounds: L.bounds([-1200000.000000, 8500000.000000], [4305696.000000, 2994304.000000]),
    }
);

const SWEDEN = L.latLngBounds(
	[55.34267812700013, 11.108164910000113],
	[69.03635569300009, 24.163413534000114],
  );

// Initialize the map with the custom CRS
var map = L.map('map', {
    crs: crs3006,
	// SWEDEN.getCenter(),
	center: [63.5, 16.7211],
	// SWEREF99 TM coordinates
	// center: [7050000, 1600000], // SWEREF99 TM coordinates
	// center: [600000, 7000000], // SWEREF99 TM coordinates
    zoom: 1
});

L.tileLayer('https://garm.isof.se/folkeservice/api/lm_proxy/{z}/{y}/{x}.png', {
	attribution: '&copy; <a href="https://www.lantmateriet.se/en/">Lantmäteriet</a> Topografisk Webbkarta Visning',
}).addTo(map);
*/

var markerIcon = L.divIcon({
	className: 'map-marker',
	iconSize:     [8, 8],	// size of the icon
	iconAnchor:   [4, 4],	// point of the icon which will correspond to marker's location
});

var sockenData;
var markers = [];
var group;
var searchMarker;

map.on('zoomend', function(event) {
	if (map.getZoom() > 8) {
		if (!map.hasLayer(group)) {
			group.addTo(map);
		}
	}
	else {
		if (map.hasLayer(group)) {
			map.removeLayer(group);
		}
	}
})

// Isof egen geoserver vectortile-tjänst: 
var vectorLayer = L.vectorGrid.protobuf('https://oden.isof.se/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=Sockenstad:SockenStad_ExtGranskn_v1.0_clipped&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
// Test LM SockenStad VectorTileServer:
// https://webgisportal2.lantmateriet.se/arcgis/rest/services/Hosted/Sockenstad/VectorTileServer:
// Spatial Reference: 3006  (3006)
// Får bara dokumenationssida:
//var vectorLayer = L.vectorGrid.protobuf('https://webgisportal2.lantmateriet.se/arcgis/rest/services/Hosted/Sockenstad/VectorTileServer?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=Sockenstad:SockenStad_ExtGranskn_v1.0_clipped&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
// Anrop ok MEN response är tom med meddelande "No response data available for this request": TROLIGEN p.g.a Sockenstad/VectorTileServer bara för SWEREF 3006
//var vectorLayer = L.vectorGrid.protobuf('https://webgisportal2.lantmateriet.se/arcgis/rest/services/Hosted/Sockenstad/VectorTileServer/tile/{z}/{y}/{x}.pbf', {
	interactive: true,
	vectorTileLayerStyles: {
		'SockenStad_ExtGranskn_v1.0_clipped': function(properties, zoom) {
			return {
				weight: 0.5,
				color: '#000',
				strokeOpacity: 0.5,
				fill: true,
				fillOpacity: 0.4,
				fillColor: '#1f77b4'
			};
		}.bind(this)
	}
});

// Test LM SockenStad VectorTileServer
/* L.esri.Vector.vectorTileLayer(
    "https://webgisportal2.lantmateriet.se/arcgis/rest/services/Hosted/Sockenstad/VectorTileServer"
).addTo(map);
 */
/* L.esri.Vector.vectorTileLayer(
    {url: "https://webgisportal2.lantmateriet.se/arcgis/rest/services/Hosted/Sockenstad/VectorTileServer"}
).addTo(map);
 *///vectorLayer.on('mousemove', function(event) {
	// document.getElementById('sockenName').textContent = event.layer.properties.SnSt_Namn+' ('+event.layer.properties.SnSt_Id+')';
//});

vectorLayer.addTo(map);

function buildSockenList(sockenArray) {
	sockenArray = !sockenArray || sockenArray.length == 0 ? sockenData : sockenArray;

	var listHtml = _.map(sockenArray, function(socken) {
		return '<a data-socken="'+socken.id+'" class="item">'+
			'<strong>'+socken.id+': '+socken.name+'</strong><br/>'+
			'Härad: '+(socken.harad ? socken.harad : '')+'<br/>'+
			'Landskap: '+(socken.landskap ? socken.landskap : '')+'<br/>'+
		'</a>';
	}).join('');

	$('#sockenList .socken-list').html(listHtml);

	$('#sockenList .socken-list .item').on('click', function(event) {
		var sockenId = $(event.currentTarget)[0].dataset.socken;

		var sockenItem = _.findWhere(sockenData, {id: sockenId});

		map.setView([sockenItem.location[0], sockenItem.location[1]], 10);

		if (searchMarker) {
			map.removeLayer(searchMarker);
		}

		searchMarker = L.marker([sockenItem.location[0], sockenItem.location[1]], {
			title: sockenItem.name
		}).addTo(map)
			.bindPopup(sockenItem.name+' ('+sockenItem.id+')<br/>'+sockenItem.harad+', '+sockenItem.landskap)
			.openPopup();
/*
		setTimeout(function() {
			var currentMarker = _.find(markers, function(marker) {
				return marker.options.title == sockenId;
			})

			if (currentMarker) {
				currentMarker.openPopup();
			}
		}, 500);
*/
	});
}

$(document).ready(function() {
	fetch('https://garm.isof.se/folkeservice/api/es/socken')
		.then(function(response) {
			return response.json()
		}).then(function(json) {
			sockenData = _.sortBy(json.data, function(item) {
				return item.name;
			});

			_.each(sockenData, function(item) {
				var marker = L.marker(item.location, {
					icon: markerIcon,
					title: item.id
				}).bindPopup('<strong>'+item.name+' ('+item.id+')</strong><br/>'+item.harad+', '+item.landskap);

				markers.push(marker);
			});
			group = L.featureGroup(markers);

			buildSockenList();
		}.bind(this)).catch(function(ex) {
			console.log('parsing failed', ex)
		})
	;

	$('#sockenList .search-box').on('keyup', function(event) {
		var inputValue = $(event.target).val();

		if (inputValue.length > 0) {
			var foundSocken = _.filter(sockenData, function(socken) {
				return socken.name.toLowerCase().indexOf(inputValue.toLowerCase()) > -1 || 
					(socken.harad && socken.harad.toLowerCase().indexOf(inputValue.toLowerCase()) > -1) || 
					(socken.landskap && socken.landskap.toLowerCase().indexOf(inputValue.toLowerCase()) > -1) || 
					socken.id == inputValue;
			})

			buildSockenList(foundSocken);
		}
		else if (inputValue.length == 0) {
			buildSockenList();
		}
	})
});
