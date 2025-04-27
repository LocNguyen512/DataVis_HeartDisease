// Select the SVG element and set up margin and inner width/height
const svg = d3.select("svg"),
    margin = { top: 50, right: 150, bottom: 50, left: 60 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Create a tooltip div and hide it initially
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// Load CSV data
d3.csv("pivot_heart_disease_risk.csv").then(data => {
    // Convert necessary fields from strings to numbers
    data.forEach(d => {
        d['Healthy Lifestyle Score'] = +d['Healthy Lifestyle Score'];
        d['<35'] = +d['<35'];
        d['36-55'] = +d['36-55'];
        d['55+'] = +d['55+'];
    });

    // Define the three age groups
    const ageGroups = ["<35", "36-55", "55+"];

    // X scale - Healthy Lifestyle Score
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d['Healthy Lifestyle Score'])) // Get min and max
        .range([0, width]);

    // Y scale - Heart Disease Risk (%)
    const y = d3.scaleLinear()
        .domain([15, d3.max(data, d => Math.max(d['<35'], d['36-55'], d['55+']))]) // start from 15%
        .range([height, 0]);

    // Color scale for different age groups
    const color = d3.scaleOrdinal()
        .domain(ageGroups)
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Line generator function for each age group
    const line = ageGroup => d3.line()
        .x(d => x(d['Healthy Lifestyle Score']))
        .y(d => y(d[ageGroup]));

    // Draw a line and points for each age group
    ageGroups.forEach(ageGroup => {
        const gLine = g.append("g"); // Group for each line+points set

        // Draw line
        gLine.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line(ageGroup))
            .attr("stroke", color(ageGroup))
            .attr("fill", "none")
            .attr("stroke-width", 2);

        // Draw points on the line
        gLine.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d['Healthy Lifestyle Score']))
            .attr("cy", d => y(d[ageGroup]))
            .attr("r", 4)
            .attr("fill", color(ageGroup))
            .on("mouseover", function (event, d) {
                // On mouse over: enlarge point and show tooltip
                d3.select(this).transition().duration(100).attr("r", 7);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>Age Group:</strong> ${ageGroup}<br/>
                    <strong>Healthy Score:</strong> ${d['Healthy Lifestyle Score']}<br/>
                    <strong>Risk (%):</strong> ${d[ageGroup].toFixed(3)}%
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mousemove", function (event) {
                // Follow mouse when moving
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", function () {
                // On mouse out: shrink point back and hide tooltip
                d3.select(this).transition().duration(100).attr("r", 4);
                tooltip.transition().duration(300).style("opacity", 0);
            });
    });

    // Add X Axis
    g.append("g")
        .attr("transform", `translate(0,${height})`) // Move axis to bottom
        .call(d3.axisBottom(x).ticks(6)) // Add bottom axis with 6 ticks
        .append("text") // X-axis label
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Healthy Lifestyle Score");

    // Add Y Axis
    g.append("g")
        .call(d3.axisLeft(y)) // Add left axis
        .append("text") // Y-axis label
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Heart Disease Risk (%)");

    // Add Legend
    const legend = g.selectAll(".legend")
        .data(ageGroups)
        .enter().append("g")
        .attr("transform", (d, i) => `translate(${width + 20},${i * 25})`); // Space out each legend item vertically

    // Add legend title
    g.append("text")
        .attr("x", width + 50)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Age Group");

    // Add legend color squares
    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color);

    // Add legend text labels
    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(d => d);
});
