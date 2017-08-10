var map = L.map('map').setView([63.26, 16.48], 5);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var markerIcon = L.divIcon({
	className: 'map-marker',
	iconSize:     [8, 8],	// size of the icon
	iconAnchor:   [4, 4],	// point of the icon which will correspond to marker's location
});

var markers = [];
var group;

fetch('http://www4.sprakochfolkminnen.se/sagner/api/locations')
	.then(function(response) {
		return response.json()
	}).then(function(json) {
		_.each(json.data, function(item) {
			var marker = L.marker([item.lat, item.lng], {
				icon: markerIcon
			}).bindPopup(item.name+' ('+item.id+')<br/>'+item.county+', '+item.landskap);

			markers.push(marker);
		});
		group = L.featureGroup(markers);
	}.bind(this)).catch(function(ex) {
		console.log('parsing failed', ex)
	})
;

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

var vectorLayer = L.vectorGrid.protobuf('https://oden-test.sprakochfolkminnen.se/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=SockenStad_ExtGranskning-clipped:SockenStad_ExtGranskn_v1.0_clipped&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
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

vectorLayer.on('mousemove', function(event) {
	document.getElementById('sockenName').textContent = event.layer.properties.SnSt_Namn+' ('+event.layer.properties.SnSt_Id+')';
});

vectorLayer.addTo(map);
