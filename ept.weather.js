
var WeatherTile = function( ops ) {
  	'use strict';

	if (!(this instanceof WeatherTile)) {
      throw new Error('WeatherTile needs to be called with the new keyword');
  	}

	this.tileset = (ops) ? ops.tileset : 1;
	this.tilelocation = (ops) ? ops.tilelocation :'A1';
	this.tilesize = (ops) ? ops.tilesize : '2x2';
	this.delay = (ops) ? ops.delay : 5000;
	this.poll = (ops) ? ops.poll : 1200000;
	this.color = (ops) ? ops.color : 'Gray';
	this.$el = null;
	this.current = 0;
	this.hover = false;
	this.numberOfCities = 0;
	this.timer = null;
	this.refreshtimer = null;
};

WeatherTile.prototype = {

	init : function () {
		this._select();
		this._build();
	},

	refresh : function () {
		var self = this;
		this.refreshtimer = window.setTimeout( function () {
			if ( self.$el ) {
				self.$el.trigger('refreshWeatherTile');
			}
		}, this.poll );
	},

	_select : function () {
		var count=1;
		var tmp = $('[data-tileset=' + this.tileset + ']' ).find( '[data-location=' + this.tilelocation + ']');
		var self = this;
		this.$el = ( tmp.length ) ? tmp : undefined;
		if (! this.$el ) {
			count++;
			if (count===10) {
				ept.log('Failed to initialize Weather Tile.');
		  } else {
				window.setTimeout(function() { self._select(); },10);
			}
		}
	},

	_build : function () {
	    var self = this;
	    $.when( self._query() ).done( function( data ) {
	    	self._html( self._map( data.d.results ) );
	    	self._events();
	    	self._loop();
	    	self.refresh();
	    });
	},

	_query : function () {
		return ept.getSPList( '/', 'WeatherInformation', '$filter=IsError%20eq%20false&$orderby=Order0%20asc');
	},

	_map : function ( data ) {
		var val = 0, self = this;
		return $.map( data, function( row ) {
			return {
				title : row.Title,
				size : self.tilesize,
				tileset : self.tileset,
				tilelocation : self.tilelocation,
				temperature : row.Temperature,
				hightemp : row.TodayHighTemp,
				lowtemp : row.TodayLowTemp,
				forecast : row.TodayForeCast,
				image : row.BackImageUrl
			};
		});
	},

	_html :  function ( data ) {
		var cities = [], self = this, html, json, row, i = 0, len = data.length, fc='';
		self.numberOfCities = len;
		for (; i < len; i++ ) {
			html = this._templates.tilehtml;
			json = this._templates.tile;
			row = data[ i ];
			//fc = row.forecast;
			//fc = fc.replace(/[\n\r]/g, ' ');
			html = html.replaceAll( '{{hightemp}}', row.hightemp );
			html = html.replaceAll( '{{lowtemp}}', row.lowtemp );
			html = html.replaceAll( '{{temperature}}', row.temperature );
			//html = html.replaceAll( '{{forecast}}', fc );
			html = html.replaceAll( '{{image}}', row.image );
			html = html.replaceAll( '{{title}}', row.title );
   		json = json.replaceAll( '{{html}}', html );
			json = json.replaceAll( '{{size}}', row.size );
			//json = json.replaceAll( '{{forecast}}', fc );
	    json = json.replaceAll( '{{title}}', row.title );
   		json = json.replaceAll( '{{tileset}}', row.tileset );
   		json = json.replaceAll( '{{location}}', row.tilelocation );
   		cities.push( json );
		}
		self.cities = cities;
	},

	_events : function () {
		var self = this;
		if ( this.$el ) {
		    this.$el.off('rotateWeatherTile').on( 'rotateWeatherTile', function () {
		    	window.clearTimeout( self.timer );
		      self._loop();
		    });

		    this.$el.off('refreshWeatherTile').on( 'refreshWeatherTile', function () {
		    	window.clearTimeout( self.timer );
		    	window.clearTimeout( self.refreshtimer );
		      self._build();
		      self.refresh();
		    });

		    this.$el.off('mouseover').on( 'mouseover', function () {
		    	window.clearTimeout( self.timer );
		    	self.hover = true;
		    });

		    this.$el.off('mouseout').on( 'mouseout', function () {
		    	self.hover = false;
		    	window.clearTimeout( self.timer );
		    	this.timer = window.setTimeout( function () {
		      		self.$el.trigger( 'rotateWeatherTile' );
		    	}, this.delay );
		    });
		}
	},

	_loop : function () {
		var self = this;
		if ( this.$el ) {
		    if ( !this.hover ) {
			    this._update( this._templates.tilejson.replaceAll( '{{tiles}}', this.cities[ this.current ] ) );
			    this._setCurrent();
		    	this.timer = window.setTimeout( function () {
		      		self.$el.trigger( 'rotateWeatherTile' );
		    	}, this.delay );
		    }
		}
	},

	_setCurrent : function() {
		var curr = this.current+1;
		this.current = ( curr < this.numberOfCities ) ? curr : 0;
	},

	_update : function ( ops ) {
		ept.updateTile ( ops );
	},

	_templates : {
      tile : '{  "tileset" : "{{tileset}}", "location" : "{{location}}", "title" : "{{title}}", "color" : "DarkGray", "html" : "{{html}}", "comments" : "", "url" : "#", "target":"_blank" }',
      tilehtml :
      	'<div class=|macys-weathertile|>' +
      		'<div class=|macys-weathertile-icon|><img src=|{{image}}|/></div>' +
      		'<div class=|macys-weathertile-temperature|>{{temperature}}°</div>' +
      		'<div class=|macys-weathertile-high|>{{lowtemp}}° &nbsp;-&nbsp; {{hightemp}}°</div>' +
  	   		'<div class=|macys-linktile-BottomCenter macys-linktile-title|>'+
	  	   		'<div class=|macys-linktile-header|>{{title}}</div>'+
    	  	   	'<div class=|macys-linktile-desc|></div>' +
      		'</div>' +
      	'</div>',
    tilejson : '{ "tiles" : [ {{tiles}} ] }'
  	}

};