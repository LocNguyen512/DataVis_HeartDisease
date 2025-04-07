d3.csv("project_heart_disease.csv").then(data => {
    const svg = d3.select("#chart2"),
        margin = { top: 30, right: 30, bottom: 50, left: 60 },
        width = 700,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const filtered = data.filter(d => d["Exercise Habits"] && d["Heart Disease Status"]);
    const groupOrder = ["Low", "Medium", "High"];

    const counts = d3.rollup(
        filtered,
        v => ({
            Yes: v.filter(d => d["Heart Disease Status"] === "Yes").length,
            No: v.filter(d => d["Heart Disease Status"] === "No").length
        }),
        d => d["Exercise Habits"]
    );

    const processedData = groupOrder.map(key => {
        const value = counts.get(key);
        const total = value ? value.Yes + value.No : 1;
        return {
            group: key,
            Yes: value ? (value.Yes / total) * 100 : 0,
            No: value ? (value.No / total) * 100 : 0,
            countYes: value ? value.Yes : 0,
            countNo: value ? value.No : 0,
            total: value ? value.Yes + value.No : 0
        };
    });

    const x0 = d3.scaleBand().domain(groupOrder).range([0, width]).paddingInner(0.1);
    const x1 = d3.scaleBand().domain(["Yes", "No"]).range([0, x0.bandwidth()]).padding(0.05);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const color = d3.scaleOrdinal().domain(["Yes", "No"]).range(["#d9534f", "#5bc0de"]);

    g.append("g").attr("transform", `translate(0,${height})`)
     .call(d3.axisBottom(x0)).selectAll("text").style("font-size", "14px");

    g.append("g").call(d3.axisLeft(y).ticks(10).tickFormat(d => d + "%"))
     .selectAll("text").style("font-size", "14px");

    svg.append("text").attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + height / 2)).attr("y", 13)
        .attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Heart Disease Proportion (%)");

    g.append("g").attr("class", "grid")
     .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

    svg.append("text")
        .attr("x", margin.left + width / 2)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "18px").style("font-weight", "bold")
        .text("Exercise Habits");

    const groups = g.selectAll(".group")
        .data(d3.groups(processedData.flatMap(d => ["Yes", "No"].map(k => ({...d, status: k}))), d => d.group))
        .join("g")
        .attr("transform", d => `translate(${x0(d[0])},0)`);

    groups.selectAll("rect")
        .data(d => d[1])
        .join("rect")
        .attr("x", d => x1(d.status))
        .attr("y", d => y(d[d.status]))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d[d.status]))
        .attr("fill", d => color(d.status))
        .on("mouseover", function (event, d) {
            d3.select("#tooltip").style("opacity", 1)
              .html(`
                <strong>Exercise: </strong> ${d.group}<br/>
                <strong>Heart Disease Status:</strong> ${d.status}<br/>
                <strong>Percentage:</strong> ${d[d.status].toFixed(1)}%<br/>
                <strong>Count:</strong> ${d.status === "Yes" ? d.countYes : d.countNo}<br/>
                <strong>Total in group:</strong> ${d.total}
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 40) + "px");
            d3.select(this).attr("opacity", 0.85);
        })
        .on("mousemove", function(event) {
            d3.select("#tooltip")
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this).attr("opacity", 1);
        });

    groups.selectAll("text.label")
        .data(d => d[1])
        .join("text")
        .attr("x", d => x1(d.status) + x1.bandwidth() / 2)
        .attr("y", d => y(d[d.status]) + (height - y(d[d.status])) / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .style("font-size", "20px")
        .text(d => `${d.status === "Yes" ? d.countYes : d.countNo}`);

    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left + width + 30}, ${margin.top})`);

    legend.append("rect")
        .attr("x", -10).attr("y", -20)
        .attr("width", 200).attr("height", 90)
        .attr("fill", "#fff").attr("stroke", "#ccc")
        .attr("stroke-width", 1).attr("rx", 8);

    legend.append("text")
        .attr("x", 0).attr("y", 0)
        .attr("font-size", "18px").attr("font-weight", "bold")
        .text("Heart Disease Status");

    ["Yes", "No"].forEach((key, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${(i + 1) * 20})`);
        row.append("rect").attr("width", 18).attr("height", 15).attr("fill", color(key));
        row.append("text").attr("x", 20).attr("y", 12).text(key);
    });
});
