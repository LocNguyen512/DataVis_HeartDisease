d3.csv("project_heart_disease.csv").then(data => {
    // Check if the element with ID "chart3" exists to determine which chart to render.
    const isTask3 = document.querySelector("#chart3") !== null;
    // Select the SVG element based on whether it's for Task 3 or Task 2.
    const svg = d3.select(isTask3 ? "#chart3" : "#chart2"),
        // Define the margins around the chart.
        margin = { top: 30, right: 30, bottom: 50, left: 60 },
        // Define the overall width of the SVG.
        width = 700,
        // Calculate the height of the chart area within the SVG, excluding margins.
        height = +svg.attr("height") - margin.top - margin.bottom,
        // Create a group element within the SVG and apply a translation to account for margins.
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter the data based on whether it's for "Smoking" (Task 3) or "Exercise Habits" (Task 2),
    // and ensure that "Heart Disease Status" is also present.
    const filtered = data.filter(d => (isTask3 ? d["Smoking"] : d["Exercise Habits"]) && d["Heart Disease Status"]);
    // Define the order of the groups for the x-axis based on the task.
    const groupOrder = isTask3 ? ["Yes", "No"] : ["Low", "Medium", "High"];
    // Use d3.rollup to count the occurrences of "Yes" and "No" heart disease status
    // for each group (smoking status or exercise habit).
    const counts = d3.rollup(
        filtered,
        v => ({
            Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
            No: v.filter(d => d["Heart Disease Status"] === "No").length
        }),
        d => isTask3 ? d["Smoking"] : d["Exercise Habits"]
    );

    // Process the rolled-up data to create an array suitable for plotting.
    const processedData = groupOrder.map(key => {
        const value = counts.get(key);
        const total = value ? value.Yes + value.No : 1; // Avoid division by zero
        return {
            group: key,
            Yes: value ? value.Yes : 0,
            No: value ? value.No : 0,
            percentYes: value ? (value.Yes / total) * 100 : 0,
            percentNo: value ? (value.No / total) * 100 : 0,
            total: value ? total : 0
        };
    });

    // Define the x-axis scale using a band scale, mapping the group order to the width.
    const x0 = d3.scaleBand().domain(groupOrder).range([0, width]).padding(0.2);
    // Define the y-axis scale using a linear scale, mapping the maximum total count to the height.
    const y = d3.scaleLinear().domain([0, d3.max(processedData, d => d.total)]).nice().range([height, 0]);
    // Define the color scale for the "Yes" and "No" heart disease status.
    const color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#d9534f", "#5bc0de"]);

    // Append the x-axis to the chart group and translate it to the bottom.
    g.append("g").attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0)).selectAll("text").style("font-size", "14px");

    // Append the y-axis to the chart group.
    g.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "14px");

    // Add a label for the y-axis.
    svg.append("text").attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + height / 2))
        .attr("y", 13).attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Number of People");

    // Add grid lines for the y-axis.
    g.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    // Add a label for the x-axis.
    svg.append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(isTask3 ? "Smoking Status" : "Exercise Habits");

    // Create groups for each category on the x-axis.
    const groups = g.selectAll(".group")
        .data(processedData)
        .join("g")
        .attr("transform", d => `translate(${x0(d.group)},0)`);

    // For each group, create the stacked bars for "No" and "Yes" heart disease status.
    groups.each(function (d) {
        let yStart = height;
        ["No", "Yes"].forEach(key => {
            const val = d[key];
            const barHeight = height - y(val);
            yStart -= barHeight;

            // Append a rectangle for each segment of the stacked bar.
            d3.select(this).append("rect")
                .attr("x", 0)
                .attr("y", yStart)
                .attr("width", x0.bandwidth())
                .attr("height", barHeight)
                .attr("fill", color(key))
                .attr("class", "bar")
                // Add mouseover event listener for tooltip.
                .on("mouseover", function (event) {
                    d3.select("#tooltip").style("opacity", 1)
                        .html(`
                            <strong>${isTask3 ? "Smoking" : "Exercise"}: </strong> ${d.group}<br/>
                            <strong>Heart Disease Status:</strong> ${key}<br/>
                            <strong>Count:</strong> ${val}<br/>
                            <strong>Percentage:</strong> ${key === "Yes" ? d.percentYes.toFixed(1) : d.percentNo.toFixed(1)}%<br/>
                            <strong>Total in group:</strong> ${d.total}
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

            // Add text label for the percentage on each bar segment.
            d3.select(this).append("text")
                .attr("x", x0.bandwidth() / 2)
                .attr("y", yStart + barHeight / 2 + 5)
                .attr("text-anchor", "middle")
                .attr("fill", "#fff")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`${key === "Yes" ? d.percentYes.toFixed(1) : d.percentNo.toFixed(1)}%`);
        });

        // Add text label for the total count at the top of each bar group.
        d3.select(this).append("text")
            .attr("x", x0.bandwidth() / 2)
            .attr("y", y(d.total) - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "#000")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(`${d.total}`);
    });

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

    // Add colored rectangles and text for each legend item.
    ["Yes", "No"].forEach((key, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${(i + 1) * 20})`);
        row.append("rect").attr("width", 18).attr("height", 15).attr("fill", color(key));
        row.append("text").attr("x", 20).attr("y", 12).text(key);
    });
});