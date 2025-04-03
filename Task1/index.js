
const svg = d3.select("svg"),
        margin = {top: 30, right: 30, bottom: 50, left: 60},
        width = 700,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
   
d3.csv("project_heart_disease.csv").then(rawData => {
    const ageGroups = ["18–35", "36–55", ">55"];
    const grouped = {
    "18–35": { Yes: 0, No: 0, total: 0 },
    "36–55": { Yes: 0, No: 0, total: 0 },
    ">55":   { Yes: 0, No: 0, total: 0 }
    };

    rawData.forEach(d => {
    const age = +d["Age"];
    const status = d["Heart Disease Status"];
    let group = null;
    if (age >= 18 && age <= 35) group = "18–35";
    else if (age >= 36 && age <= 55) group = "36–55";
    else if (age > 55) group = ">55";
    if (group && (status === "Yes" || status === "No")) {
        grouped[group][status]++;
        grouped[group].total++;
    }
    });

    const data = [];
    ageGroups.forEach(group => {
    const total = grouped[group].total || 1;
    ["Yes", "No"].forEach(status => {
        const count = grouped[group][status];
        const percent = count / total * 100;
        data.push({ ageGroup: group, status, value: percent, count: count, total: total });
    });
    });

    const x0 = d3.scaleBand()
    .domain(ageGroups)
    .range([0, width])
    .paddingInner(0.1);

    const x1 = d3.scaleBand()
    .domain(["Yes", "No"])
    .range([0, x0.bandwidth()])
    .padding(0.05);

    const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

    const color = d3.scaleOrdinal()
    .domain(["Yes", "No"])
    .range(["#d9534f", "#5bc0de"]);

    g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll("text")
    .style("font-size", "14px"); // 👈 tăng font-size



    g.append("g")
    .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + "%"))
    .selectAll("text")
    .style("font-size", "14px");
    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", - (margin.top + height / 2))
    .attr("y", 13)  // 👈 Thay vì dùng `dy`
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Heart Disease Proportion (%)");

    g.append("g")
    .attr("class", "grid")
    .call(
        d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
    );
    
    svg.append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", height + margin.top + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Age groups");

    
    const groups = g.selectAll(".ageGroup")
    .data(d3.groups(data, d => d.ageGroup))
    .join("g")
    .attr("transform", d => `translate(${x0(d[0])},0)`);

    groups.selectAll("rect")
    .data(d => d[1])
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x1(d.status))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", d => color(d.status))
    .on("mouseover", function (event, d) {
        d3.select("#tooltip")
        .style("opacity", 1)
        .html(`
            <strong>Age Group:</strong> ${d.ageGroup}<br/>
            <strong>Heart Disease Status:</strong> ${d.status}<br/>
            <strong>Count:</strong> ${d.count}<br/>
            <strong>Percentage:</strong> ${d.value.toFixed(1)}%<br/>
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

    // 👉 Nhãn phần trăm trên cột
    groups.selectAll("text.label")
    .data(d => d[1])
    .join("text")
    .attr("x", d => x1(d.status) + x1.bandwidth() / 2)
    .attr("y", d => y(d.value) + (height - y(d.value)) / 2 + 5) // 👈 nằm giữa bar
    .attr("text-anchor", "middle")
    .attr("fill", "#fff") // màu trắng để nổi bật trên nền cột
    .style("font-size", "20px")
    .text(d => `${d.count}`);

    // 👉 Legend đẹp
    const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + width + 30}, ${margin.top})`);

    legend.append("rect")
    .attr("x", -10)
    .attr("y", -20)
    .attr("width", 200)
    .attr("height", 90)
    .attr("fill", "#fff")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("rx", 8);

    legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .text("Heart Disease Status");

    ["Yes", "No"].forEach((key, i) => {
    const row = legend.append("g")
        .attr("transform", `translate(0, ${(i + 1) * 20})`);

    row.append("rect")
        .attr("width", 18)
        .attr("height", 15)
        .attr("fill", color(key));

    row.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(key);
    });
});