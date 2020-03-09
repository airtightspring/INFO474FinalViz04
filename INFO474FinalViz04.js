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

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["accommodates"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["price"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

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
    // get population data as array
    /*let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]); */

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

          // make line graph within tooltip of population over time for given country
          //makeLineGraph(data, tipSVG, originalData, current);

          makePie(tipSVG, data, originalData, current);
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        }); 

        // adds labels to certain countries
        /* = data.filter(d => d['population'] >= 100000000);
        console.log(data);
        svgContainer.selectAll('.text')
          .data(data)
          .enter()
          .append('text')
          .attr('x', xMap)
          .attr('y', yMap)
          .style('font-size', '10pt')
          .text(d => d.country)
          .attr('transform', 'translate(20, 5)');*/

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


  // Section for creating line graph
  function makeLineGraph(csvData, lineSVG, originalData, currentCountry) {
    data = originalData // assign data as global variable

    // filters original data by country and valid population data
    data = data.filter(d => d['accommodates'] == currentCountry);
    //data = data.filter(d => d['population'] != "NA");

    // get arrays of year and population data
    let year_data = data.map((row) => parseFloat(row["overall_satisfaction"]));
    let pop_data = data.map((row) => parseFloat(row["price"]));

    // find data limits
    let axesLimits = findMinMax(year_data, pop_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawLineAxes(axesLimits, "overall_satisfaction", "price", lineSVG);

    // plot data as points and add tooltip functionality
    plotLineData(mapFunctions, lineSVG, data);

    // draw title and axes labels
    makeLineLabels(lineSVG);

  }

  // make title and axes labels
  function makeLineLabels(lineSVG) {
    lineSVG.append('text')
      .attr('x', 90)
      .attr('y', 20)
      .style('font-size', '13pt')
      .text("Price vs Satisfaction");

      lineSVG.append('text')
      .attr('x', 93)
      .attr('y', 34)
      .style('font-size', '10pt')
      .text("For Homes with X People");

    lineSVG.append('text')
      .attr('x', 175)
      .attr('y', 290)
      .style('font-size', '10pt')
      .text('Satisfaction');

    lineSVG.append('text')
      .attr('transform', 'translate(10, 150)rotate(-90)')
      .style('font-size', '10pt')
      .text('Price');
  }

  // plots line of population over time for given country
  function plotLineData(map, lineSVG, countryData) {
    let xMap = map.x;
    let yMap = map.y;
    
    lineSVG.selectAll('.dot')
    .data(countryData)
    .enter()
    .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 4)
      .attr('fill', "#4286f4")
      .attr('class', 'dot')
  }

  // draw the axes and ticks
  function drawLineAxes(limits, x, y, lineSVG) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 290]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    lineSVG.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 250]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    lineSVG.append('g')
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

  function makePie(tipSVG, myData, originalData, current) {

    var newData = originalData;

    newData = newData.filter(d => d['accommodates'] == current);

    newData = newData.filter(d => d['overall_satisfaction'] > 0);

    let acc_data = newData.map((row) => parseFloat(row["overall_satisfaction"]));

    let result = foo(acc_data);

    let keys = result[0];

    let colors = [];

    let values = result[1];

    let total = 0;

    for (let i = 0; i < acc_data.length; i++) {
      total = total + acc_data[i];
    }

    let average = total / acc_data.length;

    average = average.toFixed(2);


    var svg = tipSVG,
        width = svg.attr("width"),
        height = svg.attr("height"),
        radius = 90,
        g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var color = d3.scaleOrdinal(['#4daf4a','#377eb8','#ff7f00','#984ea3','#e41a1c']);

    // Generate the pie
    var pie = d3.pie();

    // Generate the arcs
    var arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);

    //Generate groups
    var arcs = g.selectAll("arc")
                .data(pie(values))
                .enter()
                .append("g")
                .attr("class", "arc")

    //Draw arc paths
    arcs.append("path")
        .attr("fill", function(d, i) {
            colors[i] = color(i);
            return color(i);
        })
        .attr("d", arc);

    makeColorKey(colors, keys, tipSVG, current, average);

  
  }

  function foo(arr) {
    var a = [], b = [], prev;

    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }

    return [a, b];
}

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
