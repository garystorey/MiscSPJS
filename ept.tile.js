
;(function($, ept, window, document, undefined ) {

  'use strict';

  var hasWeatherTile = false, hasStockTile = false, tileOptions = {};

  var tileError = '<p>Unable to display. Possible Reasons:<ul><li>Site Name not set or incorrect.</li>'+
                        '<li>List Name not set or incorrect.</li><li>Start Location is not valid.</li>'+
                        '<li>A JavaScript error prevented display.</li><li>No Tiles in list.</li></p>');

  var tileDefaults = {
    classes : {
      tile : 'macys-tile',
      icon : 'macys-tile-icon',
      title  : 'macys-tile-title'
    },
    sharepoint : {
      siteName : '',
      listName : '',
      listOptions : '$orderby=EnterpriseTileSet asc',
      tileSet : 'default',
      startLocation : 'A1'
    }
  };

  var weatherListInfo ={
    site: '/',
    list: 'WeatherInformation',
    options : '$filter=IsError%20eq%20false&$orderby=Order0%20asc'
  },
  stockListInfo ={
    site: '/',
    list: 'StockQuotes',
    options : 'filter=IsError%20eq%20false&$orderby=Order0%20asc'
  };

  function init( options ) {
    if ( ! ept.isEditMode() ) {
      tileOptions = $.extend( true, {}, tileDefaults, options );
      getData();
    }
  }

  function getData() {
    var tileListInfo ={
      site: tileOptions.sharepoint.siteName,
      list: tileOptions.sharepoint.listName,
      options : tileOptions.sharepoint.listOptions
    };
    $.when( ept.listItem.get( tileListInfo ) ).done( processData ).fail( failed );
  }

  function processData( data ) {
    if ( ! data.d.results ) { throw new Error( 'Tile Error: Unable to load Tile data.' ); }
    var tiledata = remapData( data.d.results );

    var ts = new TileSet();
    ts.parent = $('.macys-tile-container-' + tileOptions.sharepoint.tileSet );
    ts.id = tileOptions.sharepoint.tileSet;
    ts.init();
    ts.add( tiledata );
    ts = null;

    if ( hasWeatherTile ) { addWeatherInfo(); }
    if ( hasStockTile ) { addStockInfo(); }
  }

  function failed() {
    throw new Error( 'Tile Error: Unable to load Tile data.' );
  }

  function remapData( data ) {
      var results,c = 0, target = '', desc='', hasdesc, tiledesc='';
      results = $.map( data, function ( i ) {
        c++;
        target = ( i.Enterprise_x0020_Tile_x0020_Targ === 'Same Window' ) ? '' : '_blank';
        desc = ( i.Comments === '' || i.Comments === '<div></div>' ) ? '': i.Comments;
        desc = ept.removeHTML( desc );
        tiledesc = ( i.Enterprise_x0020_Tile_x0020_Size === '2x2' || i.Enterprise_x0020_Tile_x0020_Size === '3x3') ? '' : desc;
        hasdesc = ( desc ) ? 'macys-tile-desc' : 'macys-tile-no-desc';
        return {
          index : c,
          title : i.Title,
          id : i.EnterpriseTileSet+'-'+i.ID,
          set : i.EnterpriseTileSet,
          text : '',
          type : i.EnterpriseTileType,
          url : i.URL.Url,
          icon : i.Enterprise_x0020_Tile_x0020_Icon,
          color : i.Enterprise_x0020_Tile_x0020_Colo,
          size : i.Enterprise_x0020_Tile_x0020_Size,
          row : i.EnterpriseTileRow,
          column  : i.EnterpriseTileColumn,
          target : target,
          description : desc,
          tiledescription : tiledesc,
          hasDescription : hasdesc
        };
      });
      return results;
  }

  function addWeatherInfo() {
      $.when( ept.listItem.get( weatherListInfo ) ).done( processWeather ).fail( failedWeather );
  }

  function addStockInfo() {
    $.when( ept.listItem.get( stockListInfo ) ).done (processStock ).fail( failedStock );
  }

  $(function() {
    init();
  });

})( jQuery, ept, window, document );
