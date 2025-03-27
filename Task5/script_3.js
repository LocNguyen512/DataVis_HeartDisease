// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Function to normalize column names
function normalizeColumnName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// append the svg3 object to the body of the page
var svg3 = d3.select("#my_dataviz_2")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

    // Remove rows with missing BMI or heart_disease_status
    data = data.filter(d => d.bmi && d.heart_disease_status);
    data.forEach(d => d.bmi = +d.bmi);

    // Set up y scale for BMI
    var y = d3.scaleLinear()
        .domain([d3.min(data, d => d.bmi) - 5, d3.max(data, d => d.bmi) + 5])
        .range([height, 0]);
    
    svg3.append("g")
        .call(d3.axisLeft(y));
    
    // Set up histogram bins
    var histogram = d3.histogram()
        .value(d => d.bmi)
        .domain(y.domain())
        .thresholds(y.ticks(100));
    
    var binsNo = histogram(data.filter(d => d.heart_disease_status === "No"));
    var binsYes = histogram(data.filter(d => d.heart_disease_status === "Yes"));
    
    // Set up x scale for count (mirrored)
    var maxCount = d3.max([...binsNo, ...binsYes], d => d.length);
    var x = d3.scaleLinear()
        .domain([-maxCount - 40, maxCount])
        .range([0, width]);
    
    svg3.append("g")
        .attr("transform", "translate(0," + height + ")")
        // .call(d3.axisBottom(x));
        .call(d3.axisBottom(x).tickFormat(d => Math.abs(d)));
    
    // Plot histogram for "No" on the left side
    svg3.selectAll(".barNo")
        .data(binsNo)
        .enter().append("rect")
        .attr("class", "barNo")
        .attr("x", d => x(-d.length))
        .attr("y", d => y(d.x1))
        .attr("width", d => x(0) - x(-d.length))
        .attr("height", d => y(d.x0) - y(d.x1))
        .style("fill", "green")
        .style("opacity", 0.6);
    
    // Plot histogram for "Yes" on the right side
    svg3.selectAll(".barYes")
        .data(binsYes)
        .enter().append("rect")
        .attr("class", "barYes")
        .attr("x", x(0))
        .attr("y", d => y(d.x1))
        .attr("width", d => x(d.length) - x(0))
        .attr("height", d => y(d.x0) - y(d.x1))
        .style("fill", "red")
        .style("opacity", 0.6);
    
    // Add Y axis label
    svg3.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("BMI");

    // Add X axis label
    svg3.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Count");
    
    // Handmade legend
    svg3.append("circle").attr("cx", width - 100).attr("cy", 30).attr("r", 6).style("fill", "red");
    svg3.append("circle").attr("cx", width - 100).attr("cy", 60).attr("r", 6).style("fill", "green");
    svg3.append("text").attr("x", width - 80).attr("y", 30).text("Yes").style("font-size", "15px").attr("alignment-baseline", "middle");
    svg3.append("text").attr("x", width - 80).attr("y", 60).text("No").style("font-size", "15px").attr("alignment-baseline", "middle");
});
