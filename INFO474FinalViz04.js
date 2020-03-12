'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; 

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 750)
      .attr('height', 500);
    d3.csv("seattle_01.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with tool tips
  function makeScatterPlot(csvData) {
    data = csvData 
    const originalData = data;

    data = data.filter(d => d['price'] <= 2000);
    
    data = data.filter(d => d['price'] > 0);

    data = data.filter(d => d['price'] != null);

    data = data.filter(d => d['accommodates'] != null);

    // get arrays of accommodation and price data
    let accommodates_data = data.map((row) => parseFloat(row["accommodates"]));
    let price_data = data.map((row) => parseFloat(row["price"]));

    // find data limits
    let axesLimits = findMinMax(accommodates_data, price_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "accommodates", "price");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions, originalData);

    // draw title and axes labels
    makeLabels();

  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 375)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Accommodation Size');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 275)rotate(-90)')
      .style('font-size', '10pt')
      .text('Price');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, originalData) {

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', 4)
        .attr('fill', "#4286f4")
        .attr('class', 'dot')
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html("" + "<br/>")
            .style("left", (d3.event.pageX) + "px")		
            .style("top", (d3.event.pageY - 140) + "px")
          // add SVG to tooltip
          let tipSVG = d3.select(".tooltip")
            .append("svg")
            .attr("width", 300)
            .attr("height", 300)

          let current = d.accommodates;

          makePie(tipSVG, originalData, current);
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        }); 

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 700]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  function makePie(tipSVG, originalData, current) {

    // assign original data
    var newData = originalData;


    // filter data by passed accommodates and overall satisfaction valid values
    newData = newData.filter(d => d['accommodates'] == current);

    newData = newData.filter(d => d['overall_satisfaction'] > 0);

    // get the satisfaction data
    let satis_data = newData.map((row) => parseFloat(row["overall_satisfaction"]));

    // arange data into a result map that is then split into a key and vavues array
    let result = dataArranger(satis_data);

    let keys = result[0];
    let values = result[1];

    // array to hold color keys
    let colors = [];

    // calculate the average rating for all houses of a given accommodation size
    let total = 0;

    for (let i = 0; i < satis_data.length; i++) {
      total = total + satis_data[i];
    }

    let average = total / satis_data.length;

    average = average.toFixed(2);


    // set up pie chart
    var svg = tipSVG,
        width = svg.attr("width"),
        height = svg.attr("height"),
        radius = 90,
        g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var color = d3.scaleOrdinal(['#4daf4a','#377eb8','#ff7f00','#984ea3','#e41a1c']);

    // generate pie chart
    var pie = d3.pie();

    var arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

    var arcs = g.selectAll("arc")
                .data(pie(values))
                .enter()
                .append("g")
                .attr("class", "arc")

    arcs.append("path")
        .attr("fill", function(d, i) {
            colors[i] = color(i);
            return color(i);
        })
        .attr("d", arc);


    // append color key and titles for pie chart
    makeColorKey(colors, keys, tipSVG, current, average);

  
  }

  // sorts data into an array of arrays with keys and values
  function dataArranger(data) {
    var a = [], b = [], prev;

    data.sort();
    for ( var i = 0; i < data.length; i++ ) {
        if ( data[i] !== prev ) {
            a.push(data[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = data[i];
    }

    return [a, b];
}

// creates a key for colors and adds titles
function makeColorKey(colors, labels, svg, accommodation, average) {
  let colorValues = colors;
  let labelValues = labels;

  svg.append("text")
    .attr("class", "type label")
    .attr("text-anchor", "beginning")
    .attr("x", 60)
    .attr("y", 18)
    .attr("font-size", 18)
    .text("Customer Ratings By");

    svg.append("text")
    .attr("class", "type label")
    .attr("text-anchor", "beginning")
    .attr("x", 45)
    .attr("y", 38)
    .attr("font-size", 18)
    .text("Accommodation Numbers");


  svg.append("text")
    .attr("class", "type label")
    .attr("text-anchor", "beginning")
    .attr("x", 0)
    .attr("y", 60)
    .attr("font-size", 12)
    .text("Customer Rating Key");

  // adds colors for every color in the key
  for (let i = 0; i < colorValues.length; i++) {
      svg.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("x", 10)
      .attr("y", 20 * i + 71)
      .attr("fill",  colorValues[i])

      svg.append("text")
      .attr("class", "type label")
      .attr("text-anchor", "beginning")
      .attr("x", 25)
      .attr("y", 20 * i + 79)
      .attr("font-size", 10)
      .text(labelValues[i]);
  }

  svg.append("text")
  .attr("class", "type label")
  .attr("text-anchor", "beginning")
  .attr("x", 0)
  .attr("y", 260)
  .attr("font-size", 14)
  .text("Accommodation Number: " + accommodation);

  svg.append("text")
  .attr("class", "type label")
  .attr("text-anchor", "beginning")
  .attr("x", 0)
  .attr("y", 280)
  .attr("font-size", 14)
  .text("Average Rating: " + average);
}
})();
