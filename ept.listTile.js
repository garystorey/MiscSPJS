
(function($) {
'use strict';

var MacysListTile = function( elm, options ) {
  this.el = elm;
  this.$el = $(elm);
  this.$el.html('<div class="macys-tile-canvas macys-container-height-13 macys-container-width-13"></div>');
  this.$canvas = this.$el.find( '.macys-tile-canvas' );
  this.init( options );
};

MacysListTile.prototype = {

  init : function ( options ) {
    this.options = $.extend( true, {}, $.fn.macysListTile.defaults, options );
    this._setLocation();
    this._build( this.options.sharepoint.siteName, this.options.sharepoint.listName, this.options.sharepoint.listOptions );
    this._setEvents();
    this.$el.data('MacysListTile', this);
    this.$el.attr('data-initialized','true');
    return this.$el;
  },

  _setLocation : function () {
    var loc = this.options.sharepoint.startLocation,
        col = '', row = '', len=loc.length,curr=0, test='';

        for (;curr<len;curr++) {
          test = loc.charAt(curr)+'';
          if ('0123456789'.indexOf(test)>-1) {
            row+=test.trim();
          } else {
            col+=test.trim();
          }
        }
        if ( col.length === 0 ) {
          this.options.sharepoint.listName = 'InvalidStartLocation';
        }
        row = parseInt( row, 10 );
        this.$canvas.addClass( 'macys-container-start-width-' + col ).addClass( 'macys-container-start-height-' + row );
  },

  _build : function( siteName, listName , options ) {
    var self = this, len = 0, i = 0, template = '', curr = 0, tiles = '';

    $.when ( ept.getSPList( siteName, listName, options ) )
    .done( function ( results ) {
      results = self._remapData( results.d.results );
      len = results.length;
      while ( i < len ) {
        template = self.options.templates.tile;
        curr = results[i];
        template = template.replaceAll( '{{tilelocation}}', curr.column+curr.row );
        template = template.replaceAll( '{{icon}}', curr.icon );
        template = template.replaceAll( '{{color}}', curr.color );
        template = template.replaceAll( '{{row}}', curr.row );
        template = template.replaceAll( '{{column}}', curr.column );
        template = template.replaceAll( '{{url}}', curr.url );
        template = template.replaceAll( '{{target}}', curr.target );
        template = template.replaceAll( '{{tileclass}}', self.options.classes.tile );
        template = template.replaceAll( '{{iconclass}}', self.options.classes.icon );
        template = template.replaceAll( '{{titleclass}}', self.options.classes.title );
        template = template.replaceAll( '{{position}}', curr.position );
        template = template.replaceAll( '{{title}}', curr.title );
        template = template.replaceAll( '{{desc}}', curr.description );
        template = template.replaceAll( '{{size}}', curr.size );
        template = template.replaceAll( '{{tiledescription}}', curr.tiledescription );
        template = template.replaceAll( '{{hasDescription}}', curr.hasDescription );
        tiles += template;
        i++;
      }
      self.$canvas.append( tiles );
      self.$el.trigger('tilesloaded');
    })
    .fail(function(){
      self.$el.append( self.options.templates.error ).css({'border':'1px solid #000','padding':'10px'});
    });
  },

  _setEvents : function () {
    var self=this;
    $('body').on('keydown.tile', function( ev ){
      if (ev.ctrlKey && ev.altKey && String.fromCharCode(ept.getKey(ev))==='T') {
        self.$canvas.toggleClass('tile-debug');
      }
    });
  },

  _remapData : function( data ) {
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

};

jQuery.fn.macysListTile = function( options ) {
  return this.each( function ( index ) {
    var $t = $( this ),
        $d = ept.isTrue( $t.attr('data-initialized') );
        $t.attr('data-tileset', index+1 );
    if ( !$d ) {
      new MacysListTile( $t, options );
    }
  });

};


jQuery.fn.macysListTile.defaults = {

  classes : {
    tile : 'macys-listtile',
    icon : 'macys-linktile-icon',
    title  : 'macys-listtile-title'
  },

  templates : {
    tile : '<div data-location="{{tilelocation}}" class="{{tileclass}} macys-listtile-size-{{size}} macys-linktile-color-{{color}} macys-tile-row{{row}} macys-tile-col{{column}}" title="{{tiledescription}}">' +
            '<a class="{{hasDescription}}" href="{{url}}" target="{{target}}">' +
              '<div class="macys-listtile-html">' +
                '<span class="macys-listtile-icon-text"></span><div class="{{iconclass}} mymacys-icon-{{icon}}"></div>' +
                '<div class="macys-linktile-BottomCenter {{titleclass}}">'+
                  '<div class="macys-title-header">{{title}}</div>' +
                  '<div class="macys-title-desc">{{desc}}</div>' +
                '</div>' +
              '</div>' +
            '</a>'+
            '</div>',
    error : '<p>Unable to display. Possible Reasons:<ul>'+
              '<li>Site Name not set or incorrect.</li>'+
              '<li>List Name not set or incorrect.</li>'+
              '<li>Start Location is not valid.</li>'+
              '<li>A JavaScript error prevented display.</li>'+
              '<li>No Tiles in list.</li>'+
            '</p>'
  },

  sharepoint : {
    siteName : '',
    listName : '',
    listOptions : '',
    tileSet : 'default',
    startLocation : 'A1'
  }
};

}(jQuery));
