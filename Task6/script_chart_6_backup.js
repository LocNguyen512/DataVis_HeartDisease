// Set up the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 40, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Append SVG object to the page
var svg4 = d3.select("#chart_6_backup")
    .append("svg")
        .attr("width", width + margin.left + margin.right + 150) // Adjust width to accommodate legend
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Append tooltip div (initially hidden)
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.2)")
    .style("opacity", 0)
    .style("pointer-events", "none");

// Function to normalize column names
function normalizeColumnName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

// Load the data
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

    // Remove rows with missing BMI or heart disease status
    data = data.filter(d => d.bmi && d.heart_disease_status);
    data.forEach(d => d.bmi = +d.bmi);

    // Group data into BMI bins
    var bins = d3.histogram()
        .value(d => d.bmi)
        .domain([d3.min(data, d => d.bmi), d3.max(data, d => d.bmi)])
        .thresholds(10)(data);

    // Prepare stacked data
    var stackedData = bins.map(bin => {
        return {
            bmi: bin.x0,
            x1: bin.x1, // Add the end of the bin
            No: bin.filter(d => d.heart_disease_status === "No").length,
            Yes: bin.filter(d => d.heart_disease_status === "Yes").length
        };
    });

        // console.log(stackedData);
    // X scale
    var x = d3.scaleBand()
        .domain(stackedData.map(d => d.bmi))
        .range([0, width])
        .padding(0.1);

    svg4.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format(".1f")))
        .selectAll("text").style("text-anchor", "middle");

    // Y scale
    var y = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d => d.No + d.Yes)])
        .nice()
        .range([height, 0]);

    svg4.append("g")
        .call(d3.axisLeft(y));

    // Colors
    var color = d3.scaleOrdinal()
        .domain(["No", "Yes"])
        .range(["green", "red"]);

    // Stack the data
    var series = d3.stack()
        .keys(["No", "Yes"])(stackedData);

    // console.log(series);
    // Draw the bars
    svg4.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.bmi))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, index) {
            const d = this.__data__;
            const heartDiseaseStatus = d3.select(this.parentNode).datum().key; // Get the key ("No" or "Yes")
            const count = d.data[heartDiseaseStatus];
            const bmiStart = d.data.bmi.toFixed(1);
            const bmiEnd = d.data.x1.toFixed(1); // Access the end of the bin
            const total = d.data.No + d.data.Yes;
            const percentage = ((count / total) * 100).toFixed(1);

            tooltip.style("opacity", 1);
            tooltip.html(`
                <strong>BMI:</strong> ${bmiStart} to ${bmiEnd}<br>
                <strong>Heart Disease (${heartDiseaseStatus}):</strong> ${count} (${percentage}%)
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
            d3.select(this).style("stroke", "black").style("opacity", 0.8);
        })
        .on("mousemove", function() {
            tooltip.style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 10) + "px");
        })
        .on("mouseleave", function() {
            tooltip.style("opacity", 0);
            d3.select(this).style("stroke", "none").style("opacity", 1);
        });

    // Add legend
    const legend = svg4.append("g")
        .attr("transform", `translate(${width }, ${margin.top})`);

    legend.append("rect")
        .attr("width", 150)
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
        .text("Heart Disease Status"); // Changed the legend title

    ["Yes", "No"].forEach((key, i) => {
        const row = legend.append("g")
            .attr("transform", `translate(10, ${(i + 1) * 20 + 10})`);

        row.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(key));

        row.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(key);
    });

    // Add Y axis label
    svg4.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Count");

    // Add X axis label
    svg4.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Heart Disease Status");

});