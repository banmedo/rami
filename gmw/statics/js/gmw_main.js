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
    MUNS: 'api/getmunicipallayer'
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
    showMineLayers:false,
    displayBox:false,
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

  
  triggerLayer(layername, state){
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

  // set up parameters after components are mounted
  componentDidMount(){
    // render maps
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [-75.5609339,-10],
      zoom: 5
    });

    this.map.on('load', (e) => {
      this.map.addControl(new mapboxgl.NavigationControl({showCompass:false}),'top-left');
      this.map.addControl(new mapboxgl.ScaleControl({maxWidth: 80}),'bottom-left');

      this.addLayerSources(['ee-Layer']);

      // this.addLayerSources(['ee-Layer','municipal_bounds','national_parks','other_authorizations',
      //                       'tierras_de_com','resguardos','legal_mines']);

      // this.flags.layeradded = true;
      // const overlays = {
      //   'ee-Layer': 'Prediction',
      //   'municipal_bounds': 'Municipal Boundaries',
      //   'legal_mines' : 'Legal mines',
      //   'national_parks': 'National Parks',
      //   'other_authorizations': 'Other Authorizations',
      //   'tierras_de_com': 'Ethnic territories I',
      //   'resguardos' : 'Ethnic territories II',
      //   'mapbox-streets':'Mapbox Streets'
      // }
      // var opacity = new OpacityControl({
      //   // baseLayers:baseLayers,
      //   overLayers:overlays,
      //   opacityControl:true
      // })
      // // this.map.addControl(opacity, 'bottom-right');
      // this.getGEELayers(['municipal_bounds','national_parks','other_authorizations',
      //                    'tierras_de_com','resguardos','legal_mines']);

      this.map.on('mousemove',(e)=>{
        var lat = Math.round(e.lngLat.lat*10000)/10000;
        var lng = Math.round(e.lngLat.lng*10000)/10000;
        var hud = document.getElementById('lng-lat-hud');
        hud.style.display = 'inherit';
        hud.innerHTML = [lat,lng].join(', ');
      })
      this.map.on('mouseout',(e)=>{
        var hud = document.getElementById('lng-lat-hud');
        hud.style.display = 'none';
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
                onClick={((e) => this.togglePanel(e, 'appinfohidden')).bind(this)}>
                  Methodology & Publications
        </button>
        <button className={(this.state.showSelectLayers)?'col-sm-12 sidebar-icon active':'col-sm-12 sidebar-icon'}
                onClick={((e) => this.setState({showSelectLayers : !this.state.showSelectLayers})).bind(this)}>
                  Boundaries
        </button>
        {(this.state.showSelectLayers)?
          <div className="col-sm-12">
            {this.getSwitch("Region Boundary")}
            {this.getSwitch("District Boundary")}
            {this.getSwitch("Protected Areas")}
            {this.getSwitch("Indigenous Lands Boundary")}
            {this.getSwitch("Forest Management Concessions")}
            {this.getSwitch("Mining Concessions")}
          </div>
          :""}
        <button className={(this.state.showMineLayers)?'col-sm-12 sidebar-icon active':'col-sm-12 sidebar-icon'}
                onClick={((e) => this.setState({showMineLayers : !this.state.showMineLayers})).bind(this)}>
                  Mine Layers
        </button>
        {(this.state.showMineLayers)?
          <div className="col-sm-12">
            {this.getSwitch("Mine Alerts (accumulated)", 'ee-Layer')}
            {this.getSwitch("Historical Mining Data")}
            {this.getSwitch("Illegal Mining (Protected Areas/Ind. Territories")}
            {this.getSwitch("Mining in Concessions")}
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
      <AppInfo ishidden={this.state.appinfohidden} onOuterClick={((e) => this.togglePanel(e, 'appinfohidden')).bind(this)}/>
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
