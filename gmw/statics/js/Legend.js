class Legend extends React.Component{

    palette = {
        provinces: ['#f66','#0000',3],
        grid : ['#666', "#0000", 3],
        municipalities: ['#f66','#000',1],
        districts: ['#f66','#0000',3],
        forestconcessions: ['#2f2',"#0000",1],
        miningconcessions: ["#ff6","#0000",1],
        protectedareas:["#009b2f", "#009b2f99",1],
        indigenouslands: ["#f7861b", "#0000",1],
        'ee-Layer': ['#f00','#f00',1],
        change19: ['#ff0000','#ff0000',1],
        change18: ['#ff6600','#ff6600',1],
        change17: ['#ffb366','#ffb366',1],
        change16: ['#ffd11a','#ffd11a',1]
    }

    names = {
        provinces: 'Provinces',
        grid : 'Grid',
        districts: 'Province Boundary',
        municipalities: 'District Boundary',
        forestconcessions: 'Forest Management Concessions',
        miningconcessions: 'Mining Concessions',
        protectedareas: 'Protected Areas',
        indigenouslands: 'Indigenous Lands',
        'ee-Layer': 'Predicted Changes',
        change19: 2019,
        change18: 2018,
        change17: 2017,
        change16: 2016
    }

    getLegendEntry = (layer) => {
        let palet = this.palette[layer];
        return <div key={layer} style={{width:'100%',padding:'1px 3px'}}>
            <div style={{height:'10px',
                         width:'10px',
                         border:['solid',palet[2]+'px',palet[0]].join(' '),
                         background:palet[1],
                         marginTop:'5px',
                         float:'left'
                        }}>
            </div>
            <div style={{width:'calc(100% - 15px)', marginLeft:'5px', float:'left', wordWrap:'break-word'}}>
                {this.names[layer]}
            </div>
        </div>;
    }

    getChangeEntry = (layer) => {
        let subentries = [9,8,7,6].map((y)=>{
            return this.getLegendEntry('change1'+y);
        });
        return <div key={layer} style={{width:'100%',padding:'1px 3px'}}>
            Forest Change Year
            {subentries}
        </div>
    }

    buildLegend = (list) => {
        return list.map((layer) => (layer=='ee-Layer'?this.getChangeEntry(layer):this.getLegendEntry(layer)));//.join('');
    }

    render(){
        let component = null;
        if (this.props.activeLayers.length > 0) 
            component = <div id="legend" style={{padding:'5px',
                                      minHeight:'100px',
                                      minWidth:'100px',
                                      maxWidth:'200px',
                                      position:'absolute',
                                      bottom:'20px',
                                      right:'10px',
                                      background:'black',
                                      color:'white',
                                      borderRadius:'3px',
                                      zIndex:1000}}>
                <h4><b>Legend</b></h4>
                {this.buildLegend(this.props.activeLayers.sort())}
            </div>
        return component;
    }
  }
  