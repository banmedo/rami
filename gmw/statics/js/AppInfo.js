class AppInfo extends React.Component{
  constructor(props){
    super(props);
  }

  triggerFunction(e, handler){
    if(e.target == e.currentTarget){
      handler();
    }
  }

  render(){
    if (USER_ADM){
      var adm_links = <span>
        <a href='/download'>Download Validated data </a> |
      </span>
    }
    if (USER_STATE){
      var user_section = <div className="user-section" style={{float:'right'}}>
        {adm_links} 
        <span>
          <a href='/accounts/logout'>Log out</a>
        </span>
      </div>
    }

    return <div className={['info-modal ',this.props.ishidden?'see-through':''].join(' ')} onClick={(e)=>{this.triggerFunction(e,this.props.onOuterClick)}}>
      <div className='inner-container'>
        {user_section}
        <h3 className='heading3'> The RAMI Platform </h3>
        <p className='justified-txt'>RAMI is an acronym for “Radar Mining Monitoring”. The platform provides data about deforestation by mining activities to policymakers and 
          other stakeholders. The gold mining monitoring service aims to produce near real-time information on mining deforestation and activity in 
          the southern Peruvian Amazon. It will have two major objectives: First, to quickly identify possible new illegal mining fronts in priority 
          areas, such as protected area buffer zones, and the persistent activity in degraded areas. Second, to discriminate the occurrence of the 
          activity (illegal, informal, and formal), considering the government’s new formalization process, to better understand how legal mining 
          impacts the forest as distinguished from illegal mining
        </p>
        <h4> Agreement </h4>
        <p className='justified-txt'>SERVIR-Amazonia is part of <a href="https://www.servirglobal.net">SERVIR Global</a>, a joint development 
          initiative of the National Aeronautics and Space Administration (<a href="https://www.nasa.gov">NASA</a>) and the United States Agency 
          for International Development (<a href="https://www.usaid.gov">USAID</a>). Since 2005, SERVIR has worked in partnership with 
          countries to use information provided by Earth-observing satellites and geospatial technologies. SERVIR-Amazonia, led by 
          the Alliance of Bioversity International and the International Center for Tropical Agriculture (<a href="https://ciat.cgiar.org">
          CIAT</a>), is the newest of five SERVIR hubs. It is a five-year program (2019-2023) that brings together local knowledge
          and some of the world’s best science in geospatial and Earth observation technology.
        </p>
        <h4> Data Sources </h4>
        <p className='justified-txt'>The RAMI platform is possible with the support provided by the data providers below.</p>
        <div width="100%" style={{textAlign:'center'}}>
          <img height="75px" src="/static/images/datasources.png"></img>
        </div>
        <h4> Technical Partners</h4>
        <p className='justified-txt'>Thanks to the support of our technical partners, stakeholders can access spatial 
          datasets and interact with our team of experts in order to alert mining activities. </p>
        <div width="100%" style={{textAlign:'center'}}>
          <img height="75px" src="/static/images/partners.png"></img>
        </div>

        <h4> DISCLAIMER </h4>
        <p> The data distributed here on the platform is referential; Conservación Amazónica - ACCA provides this 
          data without guarantee of any kind, either express or implicit, including the guarantees of merchantability 
          and suitability for a particular purpose. We kindly ask any users to cite this data in any published material 
          produced using this data, and if possible link web pages to the <a href="www.acca.org.pe">ACCA website</a>.
        </p>
      </div>
    </div>
  }
}
