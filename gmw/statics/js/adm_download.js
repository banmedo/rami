var table = new Tabulator("#datTable", {
	// data:data,           //load row data from array
	layout:"fitColumns",      //fit columns to width of table
	responsiveLayout:"hide",  //hide columns that dont fit on the table
	tooltips:true,            //show tool tips on cells
	addRowPos:"top",          //when adding a new row, add it to the top of the table
	history:true,             //allow undo and redo actions on the table
	pagination:"local",       //paginate the data
	paginationSize:10,         //allow 7 rows per page of data
	movableColumns:true,      //allow column order to be changed
	resizableRows:true,       //allow row order to be changed
	columns:[                 //define the table columns
		{title:"user", field:"id", headerFilter:"input"},
    {title:"longitude", field:"y", headerFilter:"input"},
    {title:"latitude", field:"x", headerFilter:"input"},
    {title:"date", field:"dataDate", headerFilter:"number"},
    {title:"mine", field:"classNum", headerFilter:"number"},
		{title:"label", field:"className", headerFilter:"input"},
	],
});

$.ajax({
	url:'/getDataDates',
	success:function(resp){
		resp = resp.map(x => x.split('T')[0]);
		let options = resp.map(x => "<option value='"+x+"'>"+x+"</option>")
		$('#projectDate').html("<option value=false selected='selected' disabled>Select Date</option>"+options.join(''));
		$('#projectDate').on('change', (e) => {
			let date = e.target.value;
			table.clearData();
			$.ajax({
					url:'/download-all',
					data: {date:date},
					success: function(tabledata){
						// console.log(tabledata);
						table.setData(tabledata)
					}
			});
		});
	}
})

// table.setData("/download-all")
//trigger download of data.csv file
$("#download-csv").click(function(){
    table.download("csv", "data.csv");
});

//trigger download of data.json file
$("#download-json").click(function(){
    table.download("json", "data.json");
});

function formatToGeoJson(data){
  var fc  = {
    "type": "FeatureCollection",
    "features": []
  };
  data.forEach((item, i) => {
    fc.features.push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [item.y, item.x]
      },
      "properties": {
        "user": item.id,
        "date": item.dataDate,
        "class": item.classNum,
        "label": item.className
      }
    })
  });
  return fc;
}
