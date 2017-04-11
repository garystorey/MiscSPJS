
(function($) {
'use strict';

var MacysSlider = function( elm, options ) {
  this.el = elm;
  this.$el = $(elm);
  this.visible = 1;
  this.maximum = 0;
  this.init( options );
};

MacysSlider.prototype = {

  init : function ( options ) {
    this.options = $.extend( true, {}, $.fn.macysSlider.defaults, options );
    this._build( this.options.sharepoint.siteName, this.options.sharepoint.listName, this.options.sharepoint.listOptions );
    this.$el.data('MacysSlider', this);
    return this.$el;
  },

  destroy : function () { },

  _setCurrent : function ( counter ) {
    var curr = this.visible;
    if ( counter === 'next' ) {
        curr++; 
        this.visible = ( curr <= this.maximum ) ? curr : 1;
    } else { 
        curr--;
        this.visible = ( curr > 0 ) ? curr : this.maximum;
    }
    return this.visible;    
},


  _bindEvents : function() {
    var self = this;
    if ( ept.isTrue( this.options.useKeys ) ) { this._bindKeyEvents(); }
  },

  _bindKeyEvents : function () {
    var self = this;
    
    $('body').on('keyup.mmSlider', function(e){
      if ( ept.compareKey( e, ept.keys.RIGHTARROW) ) { self.show( self._setCurrent( 'next' ) ); return; }
      if ( ept.compareKey( e, ept.keys.LEFTARROW) ) { self.show( self._setCurrent( 'prev' ) ); return; }
    });

  },

  _bindNavEvents : function () {
    var self = this;
    self.$el.find( '.macys-slider-nav-titles' ).find( 'p' ).on( 'click.slider', function() {
      self.options.autoplay = false;
      self._autoplay();
      self.show( $(this).parent().data( 'slide' ) );
    });
    self.$el.find('.macys-slider-nav-area').on('click.slider', function () {
        var $t = $(this),area;

        $('.macys-slider-nav-area').removeClass( 'macys-slider-nav-area-selected' ).find( '.macys-slider-nav-area-arrow' ).hide();
        if ( $t.hasClass( 'macys-slider-nav-area-bu' ) ) { 
            self.$el.find( '.macys-slider-nav' ).find( '[data-area=corp]' ).hide();
            self.$el.find( '.macys-slider-nav' ).find( '[data-area=bu]' ).show();
            area=self.$el.find( '.macys-slider-nav' ).find( '[data-area=bu]' ).first().data('slide');
            self.show(area);
            self.visible=area
        }  else {
            self.$el.find( '.macys-slider-nav' ).find( '[data-area=corp]' ).show();
            self.$el.find( '.macys-slider-nav' ).find( '[data-area=bu]' ).hide();
            area=self.$el.find( '.macys-slider-nav' ).find( '[data-area=corp]' ).first().data('slide');
            self.show(area);
            self.visible=area
        }
        $t.addClass( 'macys-slider-nav-area-selected' ).find( '.macys-slider-nav-area-arrow' ).show();
        self.options.autoplay = false;
        self._autoplay();        
    });

  },

  _autoplay : function () {
    var self = this, auto = ept.isTrue( self.options.autoplay );
    if ( auto ) {
      self.interval = setInterval( function() { self.show( self._setCurrent( 'next' ) );  return; }, self.options.autoTimer );
    } else {
      clearInterval( self.interval );
    }
  },

  show : function ( num ) {
    var slide = this.$el.find( '.' + this.options.classes.slide ),
        nav = this.$el.find( '.' + this.options.classes.nav ),
        oldnav = nav.find( '.macys-slider-active' ),
        newnav = nav.find( '.' + this.options.classes.nav + '-' + num ),
        oldslide = slide.filter( '.macys-slider-show' ),
        newslide = slide.filter( '.' + this.options.classes.slide + '-' + num );


    oldnav.removeClass( 'macys-slider-active' );
    newnav.addClass( 'macys-slider-active' );
    if ( newnav.attr( 'data-area' ) === 'corp' ) {
        $( '[data-area=bu]' ).hide();
        $( '[data-area=corp]' ).show();
        $( '.macys-slider-nav-area-corp' ).addClass( 'macys-slider-nav-area-selected' ).find( '.macys-slider-nav-area-arrow' ).show();     
        $( '.macys-slider-nav-area-bu' ).removeClass( 'macys-slider-nav-area-selected' ).find( '.macys-slider-nav-area-arrow' ).hide();     
    } else {
        $( '.macys-slider-nav-area-bu' ).addClass( 'macys-slider-nav-area-selected' ).find( '.macys-slider-nav-area-arrow' ).show();     
        $( '.macys-slider-nav-area-corp' ).removeClass( 'macys-slider-nav-area-selected' ).find( '.macys-slider-nav-area-arrow' ).hide();   
        $( '[data-area=corp]' ).hide();
        $( '[data-area=bu]' ).show();
    }
      
    if ( ept.isTrue( this.options.useTransitions ) ) {
      oldslide.addClass( 'macys-slider-hide' ).removeClass( 'macys-slider-show animated ' + this.options.transitionType );
      newslide.addClass( 'macys-slider-show animated ' + this.options.transitionType ).removeClass( 'macys-slider-hide' );
    } else {
      oldslide.addClass( 'macys-slider-hide' ).removeClass( 'macys-slider-show' );
      newslide.addClass( 'macys-slider-show' ).removeClass( 'macys-slider-hide' );
    }
    this.visible = num;
  },
  
  _build : function() {
    var self = this, 
      today = ept.spdatetime( new Date() ),
      corp, bu, len = 0, i = 0, listopts = '', buitems = '', corpitems = '',
      hasData = true, corphasData = true;

    listopts += '$orderby=EnterpriseSliderRank%20asc';
    listopts += (typeof isCorporateSlider === 'undefined') ? '&$top=' + ((this.options.sharepoint.maxSlides) + 1 ) : '&$top=' + this.options.sharepoint.maxSlides;        
    listopts += "&$filter=( EnterpriseSliderEffectiveDate le " + today + ") and ( EnterpriseSliderExpirationDate ge " + today + ")";
    if ( typeof isCorporateSlider === "undefined" ) {
    //just regular slider
    if ( this.options.sharepoint.buList == '' ) { 
      self.$el.append( self.options.templates.defaultSlide.replace('{{text}}','ERROR: There are no slides to display.') ); 

    } else {
      bu = ept.getSiteAndListFromURL( this.options.sharepoint.buList );
                
      $.when( ept.getSPList( bu[0], bu[1], listopts ) )
        .done( function( r1 ) {
            bu = self._remapData( r1.d.results, false );
            if ( bu.length === 0 ) {
                hasData = false;
            }
            corphasData = false;
            self._processData( bu, hasData, corphasData );
        })
        .fail( function() {
              self.$el.append( self.options.templates.defaultSlide.replace('{{text}}','ERROR: The slides could not be displayed.')) });
      }
    } else {
        //corporate slider
        corp = ept.getSiteAndListFromURL( this.options.sharepoint.corpList );
        
        if ( this.options.sharepoint.buList == '' ) { 
          hasData = false;
          $.when( ept.getSPList( corp[0], corp[1], listopts ) )
          .done( function ( results ) {
              corp = self._remapData( results.d.results, true );
              if ( corp.length === 0 ) { corphasData = false; }
              self._processData( corp, hasData, corphasData );
          })
          .fail (function (){
                self.$el.append( self.options.templates.defaultSlide.replace('{{text}}', 'ERROR: The slides could not be displayed.') );
          });

        } else {
          bu = ept.getSiteAndListFromURL( this.options.sharepoint.buList );

          $.when( ept.getSPList( bu[0], bu[1], listopts ),
                  ept.getSPList( corp[0], corp[1], listopts ) )
          .done( function( r1, r2 ) {
              bu = self._remapData( r1[0].d.results, false );
              corp =  self._remapData( r2[0].d.results, true );
              if ( bu.length === 0 ) { hasData = false; }
              if ( corp.length === 0 ) { corphasData = false; }
              corp = corp.concat( bu );
              self._processData( corp, hasData, corphasData );
          })
          .fail( function () {
                self.$el.append( self.options.templates.defaultSlide.replace('{{text}}', 'ERROR: The slides could not be displayed.') );
          });

        }
    }
  },
  
  _processData : function (results, hasData, corphasData) {
      var self = this, len = results.length, i = 0, slides = [], titles = [],
            slide, title, curr, navclass = self.options.classes.nav, navarea = '',corpitems = '',buitems = '',
            nav = self.$el.find( '.' + navclass );
            
      while (i < len){
        slide= self.options.templates.slide;
        title = self.options.templates.nav;
        curr = results[i];
        slide = slide.replaceAll( '{{Title}}', curr.title );
        slide = slide.replaceAll( '{{Description}}', curr.description );
        slide = slide.replaceAll( '{{imageURL}}', curr.imageurl );
        slide = slide.replaceAll( '{{SlideType}}', curr.slidetype );
        slide = slide.replaceAll( '{{URL}}', curr.url );
        slide = slide.replaceAll( '{{target}}', curr.target );
        
        if ( curr.isCorp ) {
            slide = slide.replaceAll( '{{area}}', 'corp' );
            title = title.replaceAll( '{{area}}', 'corp' );
        } else {
            slide = slide.replaceAll( '{{area}}', 'bu' );
            title = title.replaceAll( '{{area}}', 'bu' );
        }
        title = title.replaceAll( '{{navClass}}', navclass );
        title = title.replaceAll( '{{title}}', curr.title );

        titles[i] = title;
        slides[i] = slide;
        i++;
      }

    navarea = this.options.templates.toolbar;

    len = titles.length;
    for ( i = 0; i < len ; i++ ) {
        titles[i] = titles[i].replaceAll( '{{index}}', i+1 );
    }
    len = slides.length;
    for ( i = 0; i < len ; i++ ) {
        slides[i] = slides[i].replaceAll( '{{index}}', i+1 );
    }
    navarea = navarea.replace( '{{alltitles}}', titles.join('') );

      corpitems = self.options.templates.allitems;
      corpitems = corpitems.replaceAll( '{{area}}' ,'Corp' );
      buitems = self.options.templates.allitems;
      buitems = buitems.replaceAll( '{{area}}', 'BU' );

    self.$el.append( corpitems + buitems + slides.join('') + navarea );
 

    self.allSlides = self.$el.find( '.' + self.options.classes.slide );
    self.maximum = self.allSlides.length;
    self.allSlides.addClass('macys-slider-hide');

    self._bindEvents();
    self._bindNavEvents();

    if ( hasData &&  (typeof isCorporateSlider === 'undefined')) {
      $( '.macys-slider-nav-areas' ).hide();
    }
    if ( !hasData ) { 
      $( '.macys-slider-nav-areas' ).find( '.macys-slider-nav-area-bu' ).hide().end().find( '.macys-slider-nav-area-corp' ).css( 'width', '100%' ); 
    }
    if ( !corphasData ) { 
      $( '.macys-slider-nav-areas' ).find( '.macys-slider-nav-area-corp' ).hide().end().find( '.macys-slider-nav-area-bu' ).css( 'width', '100%' ); 
    }
    if ( !corphasData && !hasData ) {
      $( '.macys-slider-nav' ).hide();
       self.$el.append( self.options.templates.defaultSlide.replace('{{text}}','ERROR: There are no slides to display.'));return;
    }
    
    if ( self.isCorp ) {
       $( '[data-area=corp]' ).hide();
       $( '.macys-slider-nav-areas' ).hide();
       $( '.macys-slider-allitems-Corp' ).hide();
    } else {
       $( '[data-area=bu]' ).hide();
       $( '.macys-slider-allitems-BU' ).hide();
    }

    self.show( 1 );
    self._autoplay();

    
  },

  _remapData : function ( data, isCorp ) {
    var results, slideType = '',c = 0, target = '', self = this, linkUrl = '', imageUrl = '', title = '', desc = '', corp;
    results = $.map( data, function ( i ) {
      c++; 
      slideType = ( ept.isTrue( self.options.sharepoint.withImage ) ) ? 'macys-slide-image' : slideType = 'macys-slide-text';
      if ( ept.isTrue( i. EnterpriseSliderIsVideo ) && slideType ==='macys-slide-image') { slideType = 'macys-slide-video'; } 

      target = ( ept.isTrue( self.options.sharepoint.openInSameWindow ) ) ? '' : '_blank';

      title = i.Title + ' ';
      desc = i.EnterpriseSliderDescription + ' ';
      linkUrl = ( i.EnterpriseSliderLink ) ? i.EnterpriseSliderLink.Url + ''.toLowerCase() : '#';
      imageUrl = ( i.EnterpriseSliderImage ) ? i.EnterpriseSliderImage.Url + ''.toLowerCase() : '';

      if ( imageUrl === '' || imageUrl === 'http://' ) { imageUrl="/_layouts/15/images/mymacys2013/noslides.png"; }
      if ( linkUrl === ''  || linkUrl  === 'http://' ) { linkUrl = '#'; }
     
      return {
        index : c,
        title : title,
        url : linkUrl,
        description : desc,
        imageurl : imageUrl,
        slidetype : slideType,
        target : target,
        isCorp : isCorp
      };
    });

    return results;
  }
};

jQuery.fn.macysSlider = function( options ) {

  switch ( typeof options ) {
    case 'number':
      MacysSlider = $(this).data( 'MacysSlider' );
      if ( MacysSlider !== null ) {
        MacysSlider.show( options );
      }
      break;
    case 'string':
      MacysSlider = $(this).data( 'MacysSlider' );
      if ( MacysSlider !== null ) {
        switch( options ) {
          case 'init':
            MacysSlider.init();
            break;
          case 'destroy':
            MacysSlider.destroy();
            break;
        }
      }
      break;
    default:
      return this.each( function () {
        new MacysSlider( $( this ), options );
      });
  }

};


jQuery.fn.macysSlider.defaults = {
  
  autoplay : true, 
  autoTimer : 5000,
  useKeys : false,
  width : '100%',
  height : '100%',
  useTransitions : true,
  transitionType: 'fadeIn',

  classes : {
    slide : 'macys-slide',
    nav  : 'macys-slider-nav'
  },
  
  templates : {
    slide : '<div class="macys-slide macys-container-width-6 {{SlideType}} macys-slide-{{index}} {{area}}"><a href="{{URL}}" target={{target}}><div class="macys-slide-image-container"><div class="macys-slide-overlay"><span><i class="macys-icon-play"></i></span></div><img src="{{imageURL}}" alt="{{Description}}" /></div><div class="macys-slide-text-container"><p>{{Description}}</p></div></a></div>',
    nav : '<div data-area="{{area}}" data-slide="{{index}}" class="macys-slide-title {{navClass}}-{{index}}"><p>{{title}}</p></div>',
    toolbar: '<div class="macys-slider-nav">'+
                '<div class="macys-slider-nav-areas">'+
                  '<div class="macys-slider-nav-area macys-container-width-1 macys-slider-nav-area-corp macys-slider-nav-area-selected">corp<br><i class="macys-slider-nav-area-arrow macys-icon-caret-down"></i></div>'+
                    '<div class="macys-slider-nav-area macys-container-width-1 macys-slider-nav-area-bu">bu<br><i class="macys-slider-nav-area-arrow macys-icon-caret-down"></i></div>'+
                  '</div>'+
                '<div class="macys-slider-nav-titles">{{alltitles}}</div>'+
              '</div>',
  
    allitems:'',
    defaultSlide : '<div class="macys-slide macys-container-width-8 macys-slide-image macys-slide-1 corp"><a href="/"><div class="macys-slide-image-container"><img src="/_layouts/15/images/mymacys2013/noslides.png" alt="" /></div><div class="macys-slide-text-container"><p>{{text}}</p></div></a></div>',
  },

  sharepoint : {
    withImage: true,
    openInSameWindow: true,
    maxSlides : 5,
    buList : '',
    buPage : '',
    corpList : '/sites/communications/Lists/CorporateNews/AllItems.aspx',
    corpPage : 'http://mymacys.net/'
  }

};

}(jQuery));

