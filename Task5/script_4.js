// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 40},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz_3")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Function to normalize column names
function normalizeColumnName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// get the data
d3.csv("project_heart_disease.csv", function(data) {
    // Normalize column names
    data.forEach(d => {
        Object.keys(d).forEach(key => {
            let newKey = normalizeColumnName(key);
            if (newKey !== key) {
                d[newKey] = d[key];
                delete d[key];
            }
        });
    });

    // Remove rows with missing cholesterol or heart_disease_status
    data = data.filter(d => d.bmi && d.heart_disease_status);
    data.forEach(d => d.bmi = +d.bmi);

  // X axis: scale and draw:
    var minCholesterol = d3.min(data, d => d.bmi);
    var maxCholesterol = d3.max(data, d => d.bmi);
  var x = d3.scaleLinear()
      .domain([minCholesterol-2,maxCholesterol+2])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
      .range([0, width]);
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // set the parameters for the histogram
  var histogram = d3.histogram()
      .value(function(d) { return +d.bmi; })   // I need to give the vector of value
      .domain(x.domain())  // then the domain of the graphic
      .thresholds(x.ticks(100)); // then the numbers of bins

  // And apply twice this function to data to get the bins.
  var bins1 = histogram(data.filter( function(d){return d.heart_disease_status === "Yes"} ));
  var bins2 = histogram(data.filter( function(d){return d.heart_disease_status === "No"} ));

  // Y axis: scale and draw:
  var y = d3.scaleLinear()
      .range([height, 0]);
      y.domain([0,170+ d3.max(bins1, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
  svg.append("g")
      .call(d3.axisLeft(y));

  // append the bars for series 1
  svg.selectAll("rect")
      .data(bins1)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "red")
        .style("opacity", 0.6)

  // append the bars for series 2
  svg.selectAll("rect2")
      .data(bins2)
      .enter()
      .append("rect")
        .attr("x", 1)
        .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
        .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
        .attr("height", function(d) { return height - y(d.length); })
        .style("fill", "green")
        .style("opacity", 0.6)

  // Handmade legend
  svg.append("circle").attr("cx",360).attr("cy",30).attr("r", 6).style("fill", "green")
  svg.append("circle").attr("cx",360).attr("cy",60).attr("r", 6).style("fill", "red")
  svg.append("text").attr("x", 390).attr("y", 30).text("No").style("font-size", "15px").attr("alignment-baseline","middle")
  svg.append("text").attr("x", 390).attr("y", 60).text("Yes").style("font-size", "15px").attr("alignment-baseline","middle")

});