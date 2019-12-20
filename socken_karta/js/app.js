var map = L.map('map').setView([63.26, 16.48], 5);

L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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

var vectorLayer = L.vectorGrid.protobuf('https://oden-test.isof.se/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=SockenStad_ExtGranskning-clipped:SockenStad_ExtGranskn_v1.0_clipped&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
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
	fetch('https://frigg.isof.se/sagendatabas/api/es/socken')
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
