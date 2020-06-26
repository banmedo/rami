class SmartIcons extends React.Component{
  render(){
    var parentProps = {
      className:'smart-icon '+this.props.parentclass,
      onClick: this.props.clickhandler,
      title: this.props.tooltip
    }
    return <div {...parentProps}>
      <span className={'glyphicon '+this.props.glyphicon}></span>
    </div>
  }
}

class PlaceHolder extends React.Component{
  render(){
    return <div className="placeholder"><b> Work in Progress ... </b></div>
  }
}
