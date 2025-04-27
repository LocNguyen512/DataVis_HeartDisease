d3.csv("project_heart_disease.csv").then(data => {
    // Select the SVG element with the ID "chart2".
    const svg = d3.select("#chart2"),
        // Define the margins around the chart.
        margin = { top: 30, right: 30, bottom: 50, left: 60 },
        // Define the overall width of the SVG.
        width = 700,
        // Calculate the height of the chart area within the SVG, excluding margins.
        height = +svg.attr("height") - margin.top - margin.bottom,
        // Create a group element within the SVG and apply a translation to account for margins.
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter the data to include only records where "Exercise Habits" and "Heart Disease Status" are defined.
    const filtered = data.filter(d => d["Exercise Habits"] && d["Heart Disease Status"]);
    // Define the order of the exercise habit groups for the x-axis.
    const groupOrder = ["Low", "Medium", "High"];

    // Use d3.rollup to count the occurrences of "Yes" and "No" heart disease status
    // for each exercise habit group.
    const counts = d3.rollup(
        filtered,
        v => ({
            Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
            No: v.filter(d => d["Heart Disease Status"] === "No").length
        }),
        d => d["Exercise Habits"]
    );

    // Process the rolled-up data to create an array suitable for the stacked bar chart.
    const processedData = groupOrder.map(key => {
        const value = counts.get(key);
        const total = value ? value.Yes + value.No : 1; // Ensure total is at least 1 to avoid division by zero.
        return {
            group: key,
            Yes: value ? value.Yes : 0,
            No: value ? value.No : 0,
            total: value ? value.Yes + value.No : 0 // Store the total count for each exercise group.
        };
    });

    // Define the x-axis scale using a band scale, mapping the exercise habit groups to the width.
    const x0 = d3.scaleBand().domain(groupOrder).range([0, width]).padding(0.1);
    // Find the maximum total count across all exercise habit groups to set the y-axis domain.
    const maxCount = d3.max(processedData, d => d.total);
    // Define the y-axis scale using a linear scale, mapping the maximum count to the height.
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([height, 0]);
    // Define the color scale for the "Yes" and "No" heart disease status.
    const color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#d9534f", "#5bc0de"]);

    // Append the x-axis to the chart group and translate it to the bottom.
    g.append("g").attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0)).selectAll("text").style("font-size", "14px");

    // Append the y-axis to the chart group with 10 ticks.
    g.append("g").call(d3.axisLeft(y).ticks(10))
        .selectAll("text").style("font-size", "14px");

    // Add a label for the y-axis.
    svg.append("text").attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + height / 2)).attr("y", 13)
        .attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Heart Disease Count");

    // Add grid lines for the y-axis.
    g.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    // Add a label for the x-axis.
    svg.append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Exercise Habits");

    // Create a stack generator, specifying the keys to stack ("No" and "Yes").
    const stack = d3.stack().keys(["No", "Yes"]);
    // Apply the stack generator to the processed data to create the stacked series.
    const series = stack(processedData);

    // Create groups for each series (No and Yes heart disease status).
    g.selectAll(".serie")
        .data(series)
        .join("g")
        .attr("fill", d => color(d.key)) // Set the fill color based on the key ("No" or "Yes").
        .selectAll("rect")
        .data(d => d) // Bind the data for each rectangle within the series.
        .join("rect")
        .attr("x", d => x0(d.data.group)) // Set the x-position based on the exercise habit group.
        .attr("y", d => y(d[1])) // Set the y-position of the top edge of the rectangle.
        .attr("height", d => y(d[0]) - y(d[1])) // Set the height of the rectangle.
        .attr("width", x0.bandwidth()) // Set the width of the rectangle based on the band scale.
        // Add mouseover event listener for tooltip.
        .on("mouseover", function (event, d) {
            const key = d3.select(this.parentNode).datum().key; // Get the key of the current series.
            const value = d.data[key]; // Get the count for the current segment.
            const percent = (value / d.data.total * 100).toFixed(1); // Calculate the percentage.
            d3.select("#tooltip").style("opacity", 1)
                .html(`
                    <strong>Exercise: </strong> ${d.data.group}<br/>
                    <strong>Heart Disease Status:</strong> ${key}<br/>
                    <strong>Count:</strong> ${value}<br/>
                    <strong>Percentage:</strong> ${percent}%<br/>
                    <strong>Total in group:</strong> ${d.data.total}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 40) + "px");
            d3.select(this).attr("opacity", 0.85);
        })
        // Add mousemove event listener to update tooltip position.
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        // Add mouseout event listener to hide tooltip.
        .on("mouseout", function () {
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this).attr("opacity", 1);
        });

    // Add percentage labels to each segment of the stacked bars.
    g.selectAll(".percent-label")
        .data(series.flatMap(s => s.map(d => ({
            key: s.key,
            x: x0(d.data.group) + x0.bandwidth() / 2, // Calculate the horizontal center of the bar.
            y: y((d[0] + d[1]) / 2), // Calculate the vertical center of the segment.
            value: (d.data[s.key] / d.data.total * 100).toFixed(1) + "%" // Calculate and format the percentage.
        }))))
        .join("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff") // Set the text color to white for better visibility.
        .style("font-size", "14px")
        .text(d => d.value);

    // Create a legend group.
    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left + width + 30}, ${margin.top})`);

    // Add a background for the legend.
    legend.append("rect")
        .attr("x", -10).attr("y", -20)
        .attr("width", 200).attr("height", 90)
        .attr("fill", "#fff").attr("stroke", "#ccc")
        .attr("stroke-width", 1).attr("rx", 8);

    // Add a title for the legend.
    legend.append("text")
        .attr("x", 0).attr("y", 0)
        .attr("font-size", "18px").attr("font-weight", "bold")
        .text("Heart Disease Status");

    // Add colored rectangles and text for each legend item ("Yes" and "No").
    ["Yes", "No"].forEach((key, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${(i + 1) * 20})`);
        row.append("rect").attr("width", 18).attr("height", 15).attr("fill", color(key));
        row.append("text").attr("x", 20).attr("y", 12).text(key);
    });
});