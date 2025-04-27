// Set up the dimensions and margins of the graph
var margin = { top: 30, right: 180, bottom: 40, left: 60 }; // Increased right margin for legend
var width = 700 - margin.left - margin.right; // Fixed width for the chart
var height = 400 - margin.top - margin.bottom;

// Append the svg object to the body of the page
var svg = d3.select("#chart_5")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Function to normalize column names by trimming, lowercasing,
// replacing spaces with underscores, and removing non-alphanumeric characters.
function normalizeColumnName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// Tooltip container created and styled to be initially hidden.
var tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("visibility", "hidden")
    .style("font-size", "12px")
    .style("pointer-events", "none"); // Prevents the tooltip from interfering with mouse events.

// Read the data from the CSV file.
d3.csv("project_heart_disease.csv", function (data) {
    // Normalize the column names in the dataset.
    data.forEach(d => {
        Object.keys(d).forEach(key => {
            let newKey = normalizeColumnName(key);
            if (newKey !== key) {
                d[newKey] = d[key];
                delete d[key];
            }
        });
    });

    // Filter out rows where 'cholesterol_level' or 'heart_disease_status' is missing.
    data = data.filter(d => d.cholesterol_level && d.heart_disease_status);
    // Convert 'cholesterol_level' to a numeric value for calculations.
    data.forEach(d => d.cholesterol_level = +d.cholesterol_level);

    // Compute summary statistics (quartiles, median, min, max) for cholesterol levels
    // grouped by heart disease status.
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

    // Set the X scale as a band scale with categories "Yes" and "No" for heart disease status.
    var x = d3.scaleBand()
        .range([0, width])
        .domain(["Yes", "No"])
        .paddingInner(1)
        .paddingOuter(0.5);
    // Append the X axis to the SVG and position it at the bottom.
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add label for the X axis.
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Heart Disease Status");

    // Set the Y scale dynamically based on the range of cholesterol levels in the data.
    var minCholesterol = d3.min(data, d => d.cholesterol_level);
    var maxCholesterol = d3.max(data, d => d.cholesterol_level);
    var y = d3.scaleLinear()
        .domain([minCholesterol - 10, maxCholesterol + 10]) // Add some padding to the domain.
        .range([height, 0]);
    // Append the Y axis to the SVG.
    svg.append("g").call(d3.axisLeft(y));

    // Add label for the Y axis.
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Cholesterol Level");

    // Draw vertical lines connecting the min and max cholesterol levels for each group.
    svg.selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", d => x(d.key))
        .attr("x2", d => x(d.key))
        .attr("y1", d => y(d.value.min))
        .attr("y2", d => y(d.value.max))
        .attr("stroke", "black");

    // Compute the count of records for each heart disease status.
    var counts = d3.nest()
        .key(d => d.heart_disease_status)
        .rollup(d => d.length)
        .object(data);

    // Define the width of the box plots.
    var boxWidth = 100;
    // Draw the rectangular boxes representing the interquartile range (Q1 to Q3).
    svg.selectAll("boxes")
        .data(sumstat)
        .enter()
        .append("rect")
        .attr("x", d => x(d.key) - boxWidth / 2)
        .attr("y", d => y(d.value.q3))
        .attr("height", d => y(d.value.q1) - y(d.value.q3))
        .attr("width", boxWidth)
        .attr("stroke", "black")
        .style("fill", d => d.key === "Yes" ? "#d9534f" : "#5bc0de") // Red for "Yes", Blue for "No"
        // Add mouseover event to display the tooltip.
        .on("mouseover", function (d) {
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
        // Add mousemove event to position the tooltip.
        .on("mousemove", function () {
            tooltip.style("top", (d3.event.pageY + 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        })
        // Add mouseout event to hide the tooltip.
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
        });

    // Draw horizontal lines representing the median cholesterol level within each box.
    svg.selectAll("medianLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", d => x(d.key) - boxWidth / 2)
        .attr("x2", d => x(d.key) + boxWidth / 2)
        .attr("y1", d => y(d.value.median))
        .attr("y2", d => y(d.value.median))
        .attr("stroke", "black");

    // Add Legend to the chart.
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, ${margin.top})`);

    // Add a background rectangle for the legend.
    legend.append("rect")
        .attr("width", 140)
        .attr("height", 70)
        .attr("fill", "#fff")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1)
        .attr("rx", 8);

    // Add the title for the legend.
    legend.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("font-size", "13px")
        .attr("font-weight", "bold")
        .text("Heart Disease Status");

    // Define the items for the legend and their corresponding colors.
    const legendItems = ["Yes", "No"];
    const colors = ["#d9534f", "#5bc0de"]; // Corresponding colors for "Yes" and "No".

    // Iterate through the legend items to create colored rectangles and labels.
    legendItems.forEach((key, i) => {
        const row = legend.append("g")
            .attr("transform", `translate(10, ${(i + 1) * 20 + 10})`);

        row.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", colors[i]); // Use the corresponding color.

        row.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(key);
    });
});