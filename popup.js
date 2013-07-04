var bg = chrome.extension.getBackgroundPage();

$(function () { 
    var chartData = getPieData(bg.mode);
    $('#chart_div').highcharts({
	title: { text: null },
	chart :{
	    margin: [0,0,0,0],
	    height: 250
	},
	tooltip: {
	    valueDecimals: 1,
	    pointFormat: '<b>{point.percentage}%</b>'
	},
	plotOptions: {
	    pie: {
		allowPointSelect: true,
		cursor: 'pointer',
		dataLabels: {
		    formatter: function() {
			return '<b>'+this.point.name+'</b>';
		    }
		}
	    }
	},
	series: [{
	    type: 'pie',
	    data: chartData
	}]
    });

    var domains = [];
    var usages = [];
    for(var i=0;i<chartData.length;i++) {
	domains.push(chartData[i][0]);
	usages.push(chartData[i][1]);
    }

    $('#table_div').highcharts({
	chart: { 
	    type: 'column',
	    height: 280
	},
	title: { text: null },
	xAxis: { 
	    categories: domains,
	    labels: {
		rotation: -45,
		align: 'right'
	    }
	},
	yAxis: { title: { text: 'time usage' } },
	tooltip: {
	    formatter: function() {
		return this.x+": <b>"+timeString(this.y)+'</b>';
	    }
	},
	legend : {
	    enabled: false
	},
	series: [{ 
	    data:usages,
	    dataLabels: {
		enabled: true,
		formatter: function() {
		    return '<b>'+timeString(this.y)+'</b>';
		}
	    }
	}]
    });
});


// Converts duration to String
function timeString(numSeconds) {
  if (numSeconds === 0) {
    return "0s";
  }
  var remainder = numSeconds;
  var timeStr = "";
  var timeTerms = {
    h: 3600,
    m: 60,
    s: 1
  };
  // Don't show seconds if time is more than one hour
  if (remainder >= timeTerms.hour) {
    remainder = remainder - (remainder % timeTerms.minute);
    delete timeTerms.second;
  }
  // Construct the time string
  for (var term in timeTerms) {
    var divisor = timeTerms[term];
    if (remainder >= divisor) {
      var numUnits = Math.floor(remainder / divisor);
      timeStr += numUnits + "" + term;
      // Make it plural
      //if (numUnits > 1) {
      //  timeStr += "s";
      //}
      remainder = remainder % divisor;
      if (remainder) {
        timeStr += "";
      }
    }
  }
  return timeStr;
}


// Show the data for the time period indicated by addon
function getPieData(type) {
  // Get the domain data
  var domains = JSON.parse(localStorage["domains"]);
  var chart_data = [];
  for (var domain in domains) {
    var domain_data = JSON.parse(localStorage[domain]);
    var numSeconds = 0;
    if (type === bg.TYPE.today) {
      numSeconds = domain_data.today;
    } else if (type === bg.TYPE.average) {
      numSeconds = Math.floor(domain_data.all / parseInt(localStorage["num_days"], 10));
    } else if (type === bg.TYPE.all) {
      numSeconds = domain_data.all;
    } else {
      console.error("No such type: " + type);
    }
    if (numSeconds > 0) {
      chart_data.push([domain, numSeconds]);
    }
  }

  // Display help message if no data
  if (chart_data.length === 0) {
    document.getElementById("nodata").style.display = "inline";
  } else {
    document.getElementById("nodata").style.display = "none";
  }

  // Sort data by descending duration
  chart_data.sort(function (a, b) {
    return b[1] - a[1];
  });

  // Limit chart data
  var limited_data = [];
  var chart_limit;
  // For screenshot: if in iframe, image should always have 8 items
  if (top == self) {
    chart_limit = parseInt(localStorage["chart_limit"], 10);
  } else {
    chart_limit = 8;
  }
  for (var i = 0; i < chart_limit && i < chart_data.length; i++) {
    limited_data.push(chart_data[i]);
  }
  var sum = 0;
  for (var i = chart_limit; i < chart_data.length; i++) {
    sum += chart_data[i][1];
  }
  // Add time in "other" category for total and average
  var other = JSON.parse(localStorage["other"]);
  if (type === bg.TYPE.average) {
    sum += Math.floor(other.all / parseInt(localStorage["num_days"], 10));
  } else if (type === bg.TYPE.all) {
    sum += other.all;
  }
  if (sum > 0) {
    limited_data.push(["Other", sum]);
  }

  return limited_data;
}

function updateNav(type) {
  document.getElementById('today').className = '';
  document.getElementById('average').className = '';
  document.getElementById('all').className = '';
  document.getElementById(type).className = 'active';
}

function show(mode) {
  bg.mode = mode;
  var chart = $('#chart_div').highcharts();
  var chart = $('#table_div').highcharts();
  chart.redraw();
  updateNav(mode);
}


// Show options in a new tab
function showOptions() {
  chrome.tabs.create({
    url: 'options.html'
  });
}

// Open share's tab
function share() {
  chrome.tabs.create({
    url: 'share.html'
  });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#today').addEventListener('click', function() { show(bg.TYPE.today); });
    document.querySelector('#average').addEventListener('click', function() { show(bg.TYPE.average); });
    document.querySelector('#all').addEventListener('click', function() { show(bg.TYPE.all); });

    document.querySelector('#options').addEventListener('click', showOptions);
    document.querySelector('#share').addEventListener('click', share);
});
