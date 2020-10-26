var t;

class OuterShell extends React.Component{
  // set up class flags so each component update doesn't do redundant JS tasks
  flags = {
    updatelayers : true,
    layeradded : false
  }
  // API URLS
  URLS = {
    FEATURE_NAMES: 'api/getfeaturenames',
    IMG_DATES:'/api/getimagenames',
    SINGLE_IMAGE: '/api/getsingleimage',
    COMPOSITE_IMAGE: '/api/getcompositeimage',
    LEGAL_MINES: 'api/getlegalmines',
    GEE_LAYER: 'api/getgeetiles',
    MUNS: 'api/getmunicipallayer',
    INFO: 'api/getinfo'
  }
  // overall app parameters
  appparams = {
    minprobability:props.minprobability,
    maxprobability:props.maxprobability,
    minDate:false,
    maxDate:false
  }
  // initial component states
  appstates = {
    appinfohidden:true,
    showSelectLayers:true,
    showMineLayers:true,
    displayBox:false,
    activeLayers:[]
  }
  persistentstates = {
    showcomposite:false,
    imageDates:[],
    selectedDate:false,
    regionSelected:false,
    featureNames:{},
    sublist:[]
  }
  // combining everything to app state
  state = {...this.appparams, ...this.appstates, ...this.persistentstates}

  interactionMode = "none"
  rulergjson = {}
  layerstyles = {}

  constructor(props){
    super(props)
  }

  probSliderUpdated(vals){
    let probs = vals.split(',');
    this.setState({
      minprobability : parseInt(probs[0]),
      maxprobability : parseInt(probs[1])
    });
  }

  dateSliderUpdated(vals){
    let dates = vals.split(',');
    this.setState({
      minDate : dates[0],
      maxDate : dates[1]
    });
    console.log(this.state);
  }

  // function to call when slider values are changed
  imageUpdated(){
    if (this.state.showcomposite){
      var probvals = this.probSlider.getValue().split(',').map((val)=>parseInt(val));
      var yearvals = this.yearSlider.getValue().split(',');
      var newappparams = {
        minprobability:probvals[0],
        maxprobability:probvals[1],
        minyear:yearvals[0],
        maxyear:yearvals[1]
      }
      var tileURL = this.URLS.COMPOSITE_IMAGE+'?minp='+newappparams.minprobability+
                      '&maxp='+newappparams.maxprobability+
                      '&miny='+newappparams.minyear+
                      '&maxy='+newappparams.maxyear
      this.setState({
        selectedDate:false
      });
    }else{
      var iid =document.getElementById('selectimagedate').value
      var tileURL = this.URLS.SINGLE_IMAGE+'?id='+iid
      this.setState({
        selectedDate:iid
      });
    }
    this.refreshlayers(tileURL);
  }

  getImageDates(){
    var tileURL = this.URLS.IMG_DATES;
    fetch(tileURL)
      .then(res => res.json())
      .then(
        (result) => {
          result.ids.sort();
          result.ids.reverse()
          this.setState({
            imageDates   : result.ids,
            selectedDate : result.ids[0],
            minDate      : result.ids[result.ids.length],
            maxDate      : result.ids[0]
          })
          var tileURL = this.URLS.SINGLE_IMAGE+'?id='+result.ids[0]
          this.refreshlayers(tileURL)
        },
        (error) => {
          l(error);
        }
      )
  }

  getFeatureNames(){
    var url = this.URLS.FEATURE_NAMES;
    fetch(url)
      .then(res => res.json())
      .then(
        (result) => {
          if (result.action == "FeatureNames"){
            this.setState({
              featureNames:result.features
            });
          }
        }, (error) => {
          l(error)
        }
      );
  }

  updateSubList(list){
    this.setState({
      sublist:list
    })
  }

  pointmapto(type,arg){
    if(type == 'point') {
      try{
        this.map.flyTo({center:arg, zoom:11, essential:true});
      }catch(err){
        l('Please enter valid coordinates.')
      }
    }
    else if(type == 'bbox'){
      try{
        this.map.fitBounds(arg);
      }catch(error){
        l('Please enter valid bounds.')
      }
    }
  }

  getGEELayers(list){
    var name = list.shift();
    fetch(this.URLS.GEE_LAYER+"?name="+name)
      .then(res => res.json())
      .then(
        (result) => {
          this.map.getSource(name).tiles = [result.url];
          // clear existing tile cache and force map refresh
          this.map.style.sourceCaches[name].clearTiles()
          this.map.style.sourceCaches[name].update(this.map.transform)
          // document.getElementsByClassName("vis-"+name)[0].style["border"] = "solid 1px "+result.style.color;
          // document.getElementsByClassName("vis-"+name)[0].style["background"] = result.style.fillColor;
          this.map.triggerRepaint()
          if (list.length > 0) this.getGEELayers(list);
        }, (error) => {
          l(error);
          if (list.length > 0) this.getGEELayers(list);
        }
      );
  }

  addLayerSources(list){
    var name = list.shift();
    this.map.addSource(name,{'type': 'raster',
      'tiles': [],
      'tileSize': 256,
      'vis':{'palette':[]}
    });
    this.map.addLayer({
      'id'     : name,
      'type'   : 'raster',
      'source' : name,
      'layout' : {'visibility':'none'},
      'minzoom': 0,
      'maxzoom': 22
    });
    if (list.length > 0) this.addLayerSources(list);
  }

  refreshlayers(tileURL){
    fetch(tileURL)
      .then(res => res.json())
      .then(
        (result) => {
          this.map.getSource('ee-Layer').tiles = [result.url];
          // clear existing tile cache and force map refresh
          this.map.style.sourceCaches['ee-Layer'].clearTiles()
          this.map.style.sourceCaches['ee-Layer'].update(this.map.transform)
          // document.getElementsByClassName("vis-ee-Layer")[0].style["background"] = '#'+result.visparams.palette[0];
          this.map.triggerRepaint()
        },
        (error) => {
          l(error);
        }
      )
  }

  regionSelected(level,name){
    this.setState({
      regionSelected:[level,name]
    });
  }
  
  toggleBaseSatellite(checked){
    window.m = this.map
    // console.log(this.layerstyles)
    // console.log(this.state.activeLayers)
    let cstyle = this.map.getStyle();
    console.log(cstyle.layers)
    console.log(cstyle.sources)
    var pref = "mapbox://styles/mapbox/"
    var layer = checked?"satellite-v9":"light-v10";
    console.log(pref+layer)
    this.map.setStyle(pref+layer)
    cstyle = this.map.getStyle();
    console.log(cstyle.layers)
    console.log(cstyle.sources)
  }

  triggerLayer(layername, state){
    if (layername != "satellite") {
      let currentlist = [...this.state.activeLayers];
      if (state) currentlist.push(layername);
      else currentlist.splice(currentlist.indexOf(layername),1);
      this.setState({activeLayers:currentlist});
    }
    this.map.setLayoutProperty(layername,'visibility',(state?'visible':'none'));
  }

  getSwitch(label,layername){
    return <div className="sidebar-sub-icon w_100">
      <div className = "sub-span">{label}</div>
      <label className="switch">
        <input type="checkbox" onChange={((e) => this.triggerLayer(layername,e.target.checked)).bind(this)}/>
        <span className="slider round"></span>
      </label>
    </div>;
  }

  setDisplayBox(val){
    (this.state.displayBox==val)?this.setState({displayBox:false}):this.setState({displayBox:val});
  }

  resetInteractionMode(map){
    // clear map
    try{
      this.map.getCanvas().style.cursor = 'grab';
      map.removeLayer('measure-points');
      map.removeLayer('measure-lines');
      map.removeSource('geojson');
    }catch(err){console.log("can't clean map")}
    this.rulergjson = this.getBlankGeojson();

    if (this.interactionMode == 'ruler'){
      this.addBlankRulerLayer(map);
    }
  }

  addControls(map){
    const ruler = new MapboxGLButtonControl({
      className: "glyphicon glyphicon-flag",
      title: "Ruler",
      eventHandler: (e) => { 
        this.interactionMode = (this.interactionMode == "ruler")?"none":"ruler";
        this.resetInteractionMode(map);
      }
    });
    const info = new MapboxGLButtonControl({
      className: "glyphicon glyphicon-info-sign",
      title: "Info",
      eventHandler: (e) => { 
        this.interactionMode = (this.interactionMode == "info")?"none":"info";
        this.resetInteractionMode(map);
      }
    });
    map.addControl(ruler, "top-left");
    map.addControl(info, "top-left");
  }

  // function to get empty gjson layer
  getBlankGeojson(){
    return {
      'type': 'FeatureCollection',
      'features' : []
    }
  }
  getBlankLine(){
    return {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': []
      }
    }
  }
  addBlankRulerLayer(map){
    // add layer for ruler
    map.addSource('geojson', {
      'type': 'geojson',
      'data': this.rulergjson
    });
    // Add styles to the map
    map.addLayer({
      id: 'measure-points',
      type: 'circle',
      source: 'geojson',
      paint: {
        'circle-radius': 5,
        'circle-color': '#FF0'
      },
      filter: ['in', '$type', 'Point']
    });
    map.addLayer({
      id: 'measure-lines',
      type: 'line',
      source: 'geojson',
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#FF0',
        'line-width': 2.5
      },
      filter: ['in', '$type', 'LineString']
    });
  }

  // set up parameters after components are mounted
  componentDidMount(){
    // render maps
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-69.57, -12.85],
      zoom: 9
    });

    this.map.on('load', (e) => {
      this.map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-left');
      this.map.addControl(new mapboxgl.ScaleControl({maxWidth: 80}),'bottom-left');
      this.addControls(this.map);

      this.map.addLayer({
        id    :'satellite',
        source:{type    :'raster',
                url     :"mapbox://mapbox.satellite",
                tilesize:256},
        type  :"raster",
        layout:{visibility:'none'}
      });

      let layerlist = ['districts','municipalities','forestconcessions','miningconcessions',
                       'protectedareas','indigenouslands']
      this.addLayerSources(layerlist.slice().concat('ee-Layer'));
      this.getGEELayers(layerlist.slice());

      this.map.on('mousemove',(e)=>{
        var hud = document.getElementById('lng-lat-hud');
        if (this.interactionMode == "none"){
          var lat = Math.round(e.lngLat.lat*10000)/10000;
          var lng = Math.round(e.lngLat.lng*10000)/10000;
          hud.style.display = 'inherit';
          hud.innerHTML = [lat,lng].join(', ');
        } else if (this.interactionMode == "ruler") {
          var features = this.map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
          });
          this.map.getCanvas().style.cursor = features.length ? 'pointer' : 'crosshair';
        } else if (this.interactionMode == 'info'){
          this.map.getCanvas().style.cursor = 'help'
        }
      })
      this.map.on('mouseout',(e)=>{
        var hud = document.getElementById('lng-lat-hud');
        if (this.interactionMode == "none") hud.style.display = 'none';
      })
      this.map.on('click',(e)=>{
        let map = this.map;
        if (this.interactionMode == "ruler"){
          var hud = document.getElementById('lng-lat-hud');
          hud.style.display = 'none';
          var features = map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
          });
          if (this.rulergjson.features.length > 1) this.rulergjson.features.pop();
          hud.innerHTML = ''
          if (features.length) {
            var id = features[0].properties.id;
            this.rulergjson.features = this.rulergjson.features.filter(function(point) {
              return point.properties.id !== id;
            });
          } else {
            var point = {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [e.lngLat.lng, e.lngLat.lat]
              },
              'properties': {
                'id': String(new Date().getTime())
              }
            }; 
            this.rulergjson.features.push(point);
          }
          if (this.rulergjson.features.length > 1) {
            let linestring = this.getBlankLine()
            linestring.geometry.coordinates = this.rulergjson.features.map((point)=>{
              return point.geometry.coordinates;
            });
            this.rulergjson.features.push(linestring);
            let value ='Total distance: ' +turf.length(linestring).toLocaleString() +'km';
            hud.style.display = 'inherit';
            hud.innerHTML = value;
          }
          map.getSource('geojson').setData(this.rulergjson);
        } else if (this.interactionMode == 'info'){
          let lat = e.lngLat.lat, lng = e.lngLat.lng;
          fetch(this.URLS.INFO+"?lat="+e.lngLat.lat+"&lon="+e.lngLat.lng+"&image="+this.state.selectedDate)
            .then(resp => resp.json())  
            .then((resp) => {
              let ln = Math.ceil(lng*10000)/10000;
              let lt = Math.ceil(lat*10000)/10000;
              let innerHTML = '';
              if (resp.action == 'Error'){
                innerHTML = `<b>${lt},${ln}</b>: ${resp.message}`;
              } else{
                innerHTML = `<b>${lt},${ln}</b>: ${resp.value}`;
              }
              var popup = new mapboxgl.Popup({ closeOnClick: false })
                              .setLngLat([lng, lat])
                              .setHTML(innerHTML)
                              .addTo(this.map);
            });
        }
      })
    });

    this.getImageDates();

    this.getFeatureNames();
    // call initial state functions
  }
  // set up actions to render app
  render(){
    return <div className='shell' {...this.props}>
      <div ref={el => this.mapContainer = el}></div>
      {(this.state.displayBox=="Filter")?
        <SliderPanel
          imageUpdated = {this.imageUpdated.bind(this)}
          oncheckchange = {((e) => this.setState({showcomposite:!this.state.showcomposite})).bind(this)}
          showcomposite = {this.state.showcomposite}
          maxprobability = {this.state.maxprobability}
          minprobability = {this.state.minprobability}
          probSliderUpdated = {this.probSliderUpdated.bind(this)}
          maxDate = {this.state.maxDate}
          minDate = {this.state.minDate}
          dateSliderUpdated = {this.dateSliderUpdated.bind(this)}
          imageDates = {this.state.imageDates}/>:""}
      {(this.state.displayBox=="Download")?
        <DownloadPanel
          regionSelected = {this.state.regionSelected}
          selectedDate = {this.state.selectedDate}/>:""}
      {(this.state.displayBox=="Alert")?
        <SubscribePanel
          selectedRegion = {this.state.regionSelected}
          updateSubList = {this.updateSubList.bind(this)}
          list = {this.state.sublist}/>:""}
      {(this.state.displayBox=="Validate")?
        <ValidatePanel 
          selectedDate = {this.state.selectedDate}
          featureNames = {this.state.featureNames}
          sublist = {this.state.sublist}/>:""}
      {(this.state.displayBox=="Stats")?
        <StatsPanel selectedDate = {this.state.selectedDate}/>:""}
      {(this.state.displayBox=="Search")?
        <SearchPanel
          pointmapto={this.pointmapto.bind(this)}
          regionSelected={this.regionSelected.bind(this)}
          featureNames={this.state.featureNames}/>:""}
      <div className='sidebar' >
        <div className='gold-drop app-icon'></div>
        <button className='col-sm-12 sidebar-icon'
                onClick={((e) => this.setState({appinfohidden : !this.state.appinfohidden})).bind(this)}>
                  Methodology & Publications
        </button>
        <div className="col-sm-12" style={{padding:0}}>
          {/* <div className="sidebar-sub-icon w_100">
            <div className = "sub-span">Satellite Layer</div>
            <label className="switch">
              <input type="checkbox" onChange={((e) => this.toggleBaseSatellite(e.target.checked)).bind(this)}/>
              <span className="slider round"></span>
            </label>
          </div> */}
          {this.getSwitch("Satellite Image","satellite")}
        </div>
        <button className={(this.state.showSelectLayers)?'col-sm-12 sidebar-icon active':'col-sm-12 sidebar-icon'}
                onClick={((e) => this.setState({showSelectLayers : !this.state.showSelectLayers})).bind(this)}>
                  Boundaries
        </button>
        {(this.state.showSelectLayers)?
          <div className="col-sm-12" style={{padding:0}}>
            {this.getSwitch("Province Boundary",'districts')}
            {this.getSwitch("District Boundary",'municipalities')}
            {this.getSwitch("Indigenous Lands Boundary",'indigenouslands')}
            {this.getSwitch("Forest Management Concessions","forestconcessions")}
            {this.getSwitch("Protected Areas","protectedareas")}
            {this.getSwitch("Mining Concessions","miningconcessions")}
          </div>
          :""}
        <button className={(this.state.showMineLayers)?'col-sm-12 sidebar-icon active':'col-sm-12 sidebar-icon'}
                onClick={((e) => this.setState({showMineLayers : !this.state.showMineLayers})).bind(this)}>
                  Mine Layers
        </button>
        {(this.state.showMineLayers)?
          <div className="col-sm-12" style={{padding:0}}>
            {this.getSwitch("Mine Alerts (accumulated)", 'ee-Layer')}
            {/* {this.getSwitch("Historical Mining Data")} */}
            {/* {this.getSwitch("Illegal Mining (Protected Areas/Ind. Territories")} */}
            {/* {this.getSwitch("Mining in Concessions")} */}
          </div>
          :""}
      </div>
      <div id="smart-buttons">
        <SmartIcons
          parentclass={this.state.displayBox=='Alert'?'active-icon':''}
          glyphicon='glyphicon-envelope'
          clickhandler={((e) => this.setDisplayBox('Alert')).bind(this)}
          tooltip='Alerts Subscription'/>
        <SmartIcons
          parentclass={this.state.displayBox=='Validate'?'active-icon':''}
          glyphicon='glyphicon-ok'
          clickhandler={((e) => this.setDisplayBox('Validate')).bind(this)}
          tooltip='Validation'/>
        <SmartIcons
          parentclass={this.state.displayBox=='Stats'?'active-icon':''}
          glyphicon='glyphicon-stats'
          clickhandler={((e) => this.setDisplayBox('Stats')).bind(this)}
          tooltip='Stats'/>
        <SmartIcons
          parentclass={this.state.displayBox=='Filter'?'active-icon':''}
          glyphicon='glyphicon-filter'
          clickhandler={((e) => this.setDisplayBox('Filter')).bind(this)}
          tooltip='Filter Image'/>
        <SmartIcons
          parentclass={this.state.displayBox=='Search'?'active-icon':''}
          glyphicon='glyphicon-search'
          clickhandler={((e) => this.setDisplayBox('Search')).bind(this)}
          tooltip='Search'/>
        <SmartIcons
          parentclass={this.state.displayBox=='Download'?'active-icon':''}
          glyphicon='glyphicon-save'
          clickhandler={((e) => this.setDisplayBox('Download')).bind(this)}
          tooltip='Download'/>

      </div>
      <AppInfo ishidden={this.state.appinfohidden} onOuterClick={((e) => this.setState({appinfohidden : !this.state.appinfohidden})).bind(this)}/>
      <Legend activeLayers={this.state.activeLayers}/>
      <div id="lng-lat-hud">
      </div>
    </div>
  }
};

const props = {
  minprobability:0,
  maxprobability:100,
};

ReactDOM.render(<OuterShell {...props}/>, document.getElementById('main-container'));
