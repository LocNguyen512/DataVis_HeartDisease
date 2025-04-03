// Set up the dimensions and margins of the graph
var margin = {top: 30, right: 180, bottom: 40, left: 60}; // Increased right margin for legend
var width = 700 - margin.left - margin.right; // Fixed width for the chart
var height = 400 - margin.top - margin.bottom;

// Append the svg object to the body of the page
var svg = d3.select("#chart_5")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Function to normalize column names
function normalizeColumnName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// Tooltip container
var tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("visibility", "hidden")
    .style("font-size", "12px")
    .style("pointer-events", "none"); // Prevents flickering

// Read the data
d3.csv("project_heart_disease.csv", function (data) {
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
    data = data.filter(d => d.cholesterol_level && d.heart_disease_status);
    data.forEach(d => d.cholesterol_level = +d.cholesterol_level);

    // Compute summary statistics
    var sumstat = d3.nest()
        .key(d => d.heart_disease_status)
        .rollup(d => {
            let values = d.map(g => +g.cholesterol_level).sort(d3.ascending);
            return {
                q1: d3.quantile(values, 0.25),
                median: d3.quantile(values, 0.5),
                q3: d3.quantile(values, 0.75),
                min: d3.min(values),
                max: d3.max(values)
            };
        })
        .entries(data);

    // Set X scale
    var x = d3.scaleBand()
        .range([0, width])
        .domain(["Yes", "No"])
        .paddingInner(1)
        .paddingOuter(0.5);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add X axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Heart Disease Status");

    // Set Y scale dynamically
    var minCholesterol = d3.min(data, d => d.cholesterol_level);
    var maxCholesterol = d3.max(data, d => d.cholesterol_level);
    var y = d3.scaleLinear()
        .domain([minCholesterol - 10, maxCholesterol + 10])
        .range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));


    // Add Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Cholesterol Level");

    // Draw main vertical line
    svg.selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", d => x(d.key))
        .attr("x2", d => x(d.key))
        .attr("y1", d => y(d.value.min))
        .attr("y2", d => y(d.value.max))
        .attr("stroke", "black");

		var counts = d3.nest()
		.key(d => d.heart_disease_status)
		.rollup(d => d.length)
		.object(data);

   	// Draw boxes
	var boxWidth = 100;
	svg.selectAll("boxes")
		.data(sumstat)
		.enter()
		.append("rect")
		.attr("x", d => x(d.key) - boxWidth / 2)
		.attr("y", d => y(d.value.q3))
		.attr("height", d => y(d.value.q1) - y(d.value.q3))
		.attr("width", boxWidth)
		.attr("stroke", "black")
		.style("fill", d => d.key === "Yes" ? "red" : "green") // Red for "Yes", Green for "No"
		.on("mouseover", function (d) {
			console.log(d); // Debugging output

			tooltip.style("visibility", "visible")
				.html(
					`<b>Status:</b> ${d.key} Heart Disease<br>
					<b>Count:</b> ${counts[d.key]}<br>
					<b>Max:</b> ${d.value.max}<br>
					<b>Q3:</b> ${d.value.q3}<br>
					<b>Median:</b> ${d.value.median}<br>
					<b>Q1:</b> ${d.value.q1}<br>
					<b>Min:</b> ${d.value.min}<br>`
				);
		})
		.on("mousemove", function () {
			tooltip.style("top", (d3.event.pageY + 10) + "px")
				.style("left", (d3.event.pageX + 10) + "px");
		})
		.on("mouseout", function () {
			tooltip.style("visibility", "hidden");
		});

    // Draw median lines
    svg.selectAll("medianLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", d => x(d.key) - boxWidth / 2)
        .attr("x2", d => x(d.key) + boxWidth / 2)
        .attr("y1", d => y(d.value.median))
        .attr("y2", d => y(d.value.median))
        .attr("stroke", "black");

    // Add Legend
    const legend = svg.append("g")
    .attr("transform", `translate(${width + 20}, ${margin.top})`);

  legend.append("rect")
    .attr("width", 140)
    .attr("height", 70)
    .attr("fill", "#fff")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("rx", 8);

  legend.append("text")
    .attr("x", 10)
    .attr("y", 20)
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("Heart Disease Status"); // Updated legend title

  const legendItems = ["Yes", "No"];
  const colors = ["red", "green"]; // Corresponding colors

  legendItems.forEach((key, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(10, ${(i + 1) * 20 + 10})`);

    row.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colors[i]); // Use the corresponding color

    row.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "12px")
      .text(key);
  });


});
