
var StockTile = function( ops ) {
    'use strict';

  if (!(this instanceof StockTile)) {
      throw new Error('StockTile needs to be called with the new keyword');
    }

  this.tileset = (ops) ? ops.tileset : 1;
  this.tilelocation = (ops) ? ops.tilelocation :'A1';
  this.tilesize = (ops) ? ops.tilesize : '2x2';
  this.delay = (ops) ? ops.delay : 5000;
  this.poll = (ops) ? ops.poll : 1200000; //1200000 = 20 min
  this.color = (ops) ? ops.color : 'Gray';
  this.$el = null;
  this.current = 0;
  this.hover = false;
  this.numberOfStocks = 0;
  this.timer = null;
  this.refreshtimer = null;
  this.stocks = [];
};

StockTile.prototype = {

  init : function () {
    this._select();
    this._build();
    this._disclaimer();
  },

  refresh : function () {
    var self = this;
    this.refreshtimer = window.setTimeout( function () {
      if ( self.$el ) {
        self.$el.trigger('refreshStockTile');
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
        ept.log('Failed to initialize Stocks Tile.');
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
    return ept.getSPList( '/', 'StockQuotes', '$filter=IsError%20eq%20false&$orderby=Order0%20asc' );
  },

  _map : function ( data ) {
    var self = this;
    return $.map( data, function( row ) {
      return {
        value : self._currency( row.LastTradePrice ),
        change : self._amount ( row.Change ),
        percent : self._percent ( row.ChangeInPercent ),
        title : row.PreferredName,
        size : self.tilesize,
        symbol : row.Symbol,
        trend : self._trend( row.Change ),
        tileset : self.tileset,
        location : self.tilelocation,
        date : self._formatDate( row.UpdatedDateTime )
      };
    });
  },

  _html :  function ( data ) {
    var stocks = [], self = this, html, json, row, i = 0, len = data.length;
    self.numberOfStocks = len;
    for (; i < len; i++ ) {
      html = this._templates.tilehtml;
      json = this._templates.tile;
      row = data[ i ];
      html = html.replaceAll( '{{value}}', row.value );
      html = html.replaceAll( '{{change}}', row.change );
      html = html.replaceAll( '{{title}}', row.title );
      html = html.replaceAll( '{{symbol}}', row.symbol );
      html = html.replaceAll( '{{date}}', row.date );
      html = html.replaceAll( '{{percent}}', (row.change === 'Unchanged') ? '' : '('+row.percent+'%)' );
      html = html.replaceAll( '{{trend}}',  row.trend );
      json = json.replaceAll( '{{html}}', html );
      json = json.replaceAll( '{{size}}', row.size );
      json = json.replaceAll( '{{title}}', row.title );
      json = json.replaceAll( '{{symbol}}', row.symbol );
      json = json.replaceAll( '{{tileset}}', row.tileset );
      json = json.replaceAll( '{{location}}', row.location );
      stocks.push( json );
    }
    self.stocks = stocks;
  },

  _events : function () {
    var self = this;
    if ( this.$el ) {
        this.$el.off('rotateStockTile').on( 'rotateStockTile', function () {
          window.clearTimeout( self.timer );
          self._loop();
        });

        this.$el.off('refreshStockTile').on( 'refreshStockTile', function () {
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
              self.$el.trigger( 'rotateStockTile' );
          }, this.delay );
        });
    }
  },

  _loop : function () {
    var self = this;
    if ( this.$el ) {
        if ( !this.hover ) {
          this._update( this._templates.tilejson.replaceAll( '{{tiles}}', this.stocks[ this.current ] ) );
          this._setCurrent();
          this.timer = window.setTimeout( function () {
              self.$el.trigger( 'rotateStockTile' );
          }, this.delay );
        }
    }
  },

  _setCurrent : function() {
    var curr = this.current+1;
    this.current = ( curr < this.numberOfStocks ) ? curr : 0;
  },

  _currency : function ( num ) {
    num = num - 0;
    return num.toFixed( 2 ).toLocaleString();
  },

  _percent : function ( num ) {
    return parseInt(Math.round(num * 100),10)/100;
  },

  _amount : function ( num ) {
    num = this._currency( num );
    num = ( num >= 0 ) ? ( ( num + '' === '0.00' )? 'Unchanged' : '+' + num ) : num;
    return num;
  },

  _trend : function ( amount ) {
    return ( amount <= 0 ) ? ( ( amount === 0 ) ? 'leftright' : 'down' ) : 'up';
  },

  _disclaimer : function () {
    $(function() {
      var $f = $('#MacysFooter'), dis=$f.find('.macys-linktile-disclaimer');
      if (!dis.length) {
        $f.append('<div><span class="macys-linktile-super">*</span><span class="macys-linktile-disclaimer"> - Stock data is not necessarily current.  Accuracy is not guaranteed.</span>');
      }
    });
  },

  _formatDate : function ( d ) {
    var str = 'As of {{month}}/{{day}} at {{hour}}:{{min}}{{apm}}', hr,apm='am';
    d = new Date(d);
    hr = d.getHours();
    if ( hr >= 12) {
      if (hr>12) { hr = hr-12; }
      apm = 'pm';
    }
    str = str.replace( '{{month}}', (d.getMonth()+ 1).toString().pad(2));
    str = str.replace( '{{day}}', d.getDate().toString().pad(2));
    str = str.replace( '{{hour}}', hr.toString().pad(2));
    str = str.replace( '{{min}}', d.getMinutes().toString().pad(2));
    str = str.replace( '{{apm}}', apm);
    return str;
  },

  _update : function ( ops ) {
    ept.updateTile ( ops );
  },

  _templates : {
      tile : '{  "tileset" : "{{tileset}}", "location" : "{{location}}", "title" : "{{title}}", "color" : "DarkGray", "html" : "{{html}}", "comments" : "<div>&nbsp;</div>", "url" : "http://www.google.com/finance?q={{symbol}}", "target":"_blank" }',
      tilehtml :
        '<div class=|macys-stocktile|>' +
          '<div class=|macys-stocktile-date|>{{date}}</div>' +
          '<div class=|macys-stocktile-trend macys-stocktile-trend-{{trend}} macys-icon-{{trend}}|></div>' +
          '<div class=|macys-stocktile-value|>{{value}}</div>' +
          '<div class=|macys-stocktile-change|>{{change}}&nbsp;<span class=|macys-stocktile-percentage|>{{percent}}</span><span class=|macys-linktile-super|><super>*</super></span></div>' +
        '</div>' +
      '<div class=|macys-linktile-BottomCenter macys-linktile-title|>'+
          '<div class=|macys-linktile-header|>{{title}}</div>'+
            '<div class=|macys-linktile-desc|></div>' +
        '</div>',
    tilejson : '{ "tiles" : [ {{tiles}} ] }'
    }

};
