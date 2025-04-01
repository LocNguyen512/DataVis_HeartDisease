d3.csv("project_heart_disease.csv").then(data => {
    const filtered = data.filter(d => d["Exercise Habits"] && d["Heart Disease Status"]);
    const habitOrder = ["Low", "Medium", "High"];

    const counts = d3.rollup(
        filtered,
        v => ({
            Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
            No: v.filter(d => d["Heart Disease Status"] === "No").length
        }),
        d => d["Exercise Habits"]
    );

    const processedData = habitOrder.map(key => {
        const value = counts.get(key);
        const total = value ? value.Yes + value.No : 1;
        return {
            group: key,
            Yes: value ? (value.Yes / total) * 100 : 0,
            No: value ? (value.No / total) * 100 : 0
        };
    });

    const svg = d3.select("#chart2"),
        margin = { top: 40, right: 150, bottom: 80, left: 80 },
        width = 1000 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const x = d3.scaleBand()
        .domain(processedData.map(d => d.group))
        .range([margin.left, width + margin.left])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height + margin.top, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(["No", "Yes"])
        .range(["#5bc0de", "#d9534f"]);

    const stackedData = d3.stack().keys(["No", "Yes"])(processedData);

    const tooltip = d3.select("#tooltip");

    const bars = svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key));

    bars.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.group))
        .attr("y", y(0))
        .attr("height", 0)
        .attr("rx", 6)
        .attr("width", x.bandwidth())
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]));

    bars.selectAll("rect")
        .on("mouseover", function (event, d) {
            const key = this.parentNode.__data__.key;
            tooltip.transition().duration(100).style("opacity", 1);
            tooltip.html(`<strong>${key === "Yes" ? "Mắc bệnh tim" : "Không mắc"}</strong><br>Tỷ lệ: ${(d[1] - d[0]).toFixed(2)}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            d3.select(this).attr("opacity", 0.85);
        })
        .on("mouseout", function () {
            tooltip.transition().duration(150).style("opacity", 0);
            d3.select(this).attr("opacity", 1);
        });

    bars.selectAll("text")
        .data(d => d)
        .join("text")
        .attr("x", d => x(d.data.group) + x.bandwidth() / 2)
        .attr("y", d => (y(d[1]) + y(d[0])) / 2)
        .text(d => `${(d[1] - d[0]).toFixed(2)}%`)
        .attr("text-anchor", "middle")
        .attr("fill", d => d[1] - d[0] > 10 ? "white" : "black")
        .style("font-size", "15px")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("transform", `translate(${margin.left + width / 2}, ${height + margin.top + 50})`)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Exercise Habits");

    svg.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("y", margin.left - 80)
        .attr("x", -(margin.top + height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("% Heart Disease Proportion");

    svg.append("g")
        .attr("transform", `translate(0,${height + margin.top})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .style("font-size", "14px");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-size", "14px");

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
        .selectAll("line")
        .attr("stroke", "#dcdcdc")
        .attr("stroke-dasharray", "3,2");
});
