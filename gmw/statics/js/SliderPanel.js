class SliderPanel extends React.Component{

  getOptions(list){
    var options = []
    for (let i = 0; i < list.length; i++) {
      options.push(<option value={list[i]} key={i}>{list[i]}</option>);
    }
    return options
  }

  componentDidMount(){
    new rSlider({
      target: '#probabilitySlider',
      values: {min:0, max:100},
      step:1,
      range: true,
      scale: false,
      labels:false,
      set: [this.props.minprobability, this.props.maxprobability],
      onChange: ((vals)=>{this.props.probSliderUpdated(vals)}).bind(this)
    });
    if (this.props.imageDates.length>0){
      let list = this.props.imageDates.slice().sort();
      new rSlider({
        target: '#dateSlider',
        values: list,
        step  : 1,
        range : true,
        scale : false,
        labels: false,
        set: [this.props.minDate, this.props.maxDate],
        onChange: ((vals)=>{this.props.dateSliderUpdated(vals)}).bind(this)
      });
    }
  }

  render(){
    // var imageDates = this.props.imageDates;

    var singledate = <div className={this.props.showcomposite?'see-through ht_0':''}>
      Select a date of Inference
      <select className='select-image-date' id='selectimagedate'>
        {this.getOptions(this.props.imageDates)}
      </select>
      <br/><br/>
    </div>

    var range = <div className={this.props.showcomposite?'':'see-through ht_0'}>
      {/*Change sliders to control data*/}
      <div className='inputLabel'>Sliders to change time-series agreement(%) range</div>
      <div className='slider-div'><input type="text" id="probabilitySlider" /></div>
      <br/>
      {this.props.imageDates.length>0?<div className='inputLabel'>Sliders to change years </div>:""}
      {this.props.imageDates.length>0?<div className='slider-div'><input type="text" id="dateSlider" /></div>:""}
    </div>
    return <div className='popup-container' style={{minHeight:'100px'}}>
      <h3><b>FILTER DATA</b></h3>
      {/* <input type="checkbox" className="form-check-input" id="showcomposite" onChange={this.props.oncheckchange} defaultChecked={this.props.showcomposite}/>
      &nbsp;Show Composite <br/>
      <small className="form-text text-muted">time series agreement (%)</small> */}
      {singledate}
      {/* {range} */}
      <div style={{'textAlign':'center','width':'100%'}}>
        <button type="button" className="btn btn-warning map-upd-btn" onClick={this.props.imageUpdated}>Update Map</button>
      </div>
    </div>
  }
}
