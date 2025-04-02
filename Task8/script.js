d3.csv("project_heart_disease.csv").then(function (data) {

      // Lọc dữ liệu chỉ lấy các bản ghi có giá trị giới tính
      data = data.filter(d => d.Gender && d.Gender.trim() !== "");
  
      // Chuyển đổi dữ liệu Cholesterol Level sang số
      data.forEach(d => {
          d["Cholesterol Level"] = +d["Cholesterol Level"];
      });
  
      // Xác định tình trạng cholesterol
      const categories = ["Healthy", "At risk", "Dangerous"];
      data.forEach(d => {
          if (d["Cholesterol Level"] < 200) {
              d["Cholesterol Status"] = "Healthy";
          } else if (d["Cholesterol Level"] < 240) {
              d["Cholesterol Status"] = "At risk";
          } else {
              d["Cholesterol Status"] = "Dangerous";
          }
      });
  
      // Nhóm dữ liệu theo giới tính
      const groupedData = d3.rollup(
          data,
          v => ({
              Healthy: v.filter(d => d["Cholesterol Status"] === "Healthy").length,
              "At risk": v.filter(d => d["Cholesterol Status"] === "At risk").length,
              Dangerous: v.filter(d => d["Cholesterol Status"] === "Dangerous").length
          }),
          d => d.Gender
      );
  
      const dataset = Array.from(groupedData, ([key, value]) => ({ gender: key, ...value }));
  
      // Thiết lập kích thước biểu đồ
      const margin = { top: 40, right: 150, bottom: 50, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;
  
      const svg = d3.select("svg")
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);
  
      const xScale = d3.scaleBand()
                       .domain(dataset.map(d => d.gender))
                       .range([0, width])
                       .padding(0.2);
  
      const yScale = d3.scaleLinear()
                       .domain([0, d3.max(dataset, d => d.Healthy + d["At risk"] + d.Dangerous)])
                       .nice()
                       .range([height, 0]);
  
      const color = d3.scaleOrdinal()
                       .domain(categories)
                       .range(["#4CAF50", "#FFC107", "#F44336"]);
  
      const stack = d3.stack()
                       .keys(categories)
                       .order(d3.stackOrderNone)
                       .offset(d3.stackOffsetNone);
  
      const stackedData = stack(dataset);
      const tooltip = d3.select(".tooltip");
  
      // Thêm các cột vào biểu đồ
      svg.append("g")
          .selectAll("g")
          .data(stackedData)
          .enter().append("g")
          .attr("fill", d => color(d.key))
          .selectAll("rect")
          .data(d => d)
          .enter().append("rect")
          .attr("x", d => xScale(d.data.gender))
          .attr("y", d => yScale(d[1]))
          .attr("height", d => yScale(d[0]) - yScale(d[1]))
          .attr("width", xScale.bandwidth())
          .on("mouseover", function(event, d) {
              const total = d.data.Healthy + d.data["At risk"] + d.data.Dangerous;
              const category = d3.select(this.parentNode).datum().key;
              const count = d[1] - d[0];
              const percentage = ((count / total) * 100).toFixed(2) + "%";
  
              tooltip.style("visibility", "visible")
                     .html(`
                         <strong>Gender:</strong> ${d.data.gender}<br>
                         <strong>Category:</strong> ${category}<br>
                         <strong>Count:</strong> ${count}<br>
                         <strong>Percentage:</strong> ${percentage}<br>
                         <strong>Total in group:</strong> ${total}
                     `)
                     .style("left", (event.pageX + 10) + "px")
                     .style("top", (event.pageY - 40) + "px");
  
              d3.select(this).style("opacity", 0.7); // Làm mờ thanh khi di chuột qua
          })
          .on("mousemove", function(event) {
              const tooltipWidth = tooltip.node().getBoundingClientRect().width;
              const xPosition = (event.pageX + 10 + tooltipWidth > window.innerWidth) ? 
                  (event.pageX - tooltipWidth - 10) : (event.pageX + 10);
  
              tooltip.style("left", xPosition + "px")
                     .style("top", (event.pageY - 40) + "px");
          })
          .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
              
              // Khôi phục độ mờ về 1 (không mờ)
              d3.select(this).style("opacity", 1);
          })
          .on("click", function(event, d) {
              // Cập nhật nội dung chi tiết vào khung details
              const category = d3.select(this.parentNode).datum().key;
              const count = d[1] - d[0];
              const total = d.data.Healthy + d.data["At risk"] + d.data.Dangerous;
              const percentage = ((count / total) * 100).toFixed(2) + "%";
  
              document.getElementById("details-content").innerHTML = `
                  <strong>Gender:</strong> ${d.data.gender}<br>
                  <strong>Category:</strong> ${category}<br>
                  <strong>Count:</strong> ${count}<br>
                  <strong>Percentage:</strong> ${percentage}<br>
                  <strong>Total in group:</strong> ${total}
              `;
              
              // Xóa stroke của tất cả các cột
              d3.selectAll("rect").attr("stroke", "none").attr("stroke-width", 2);
  
              // Thêm stroke cho cột được chọn
              d3.select(this).attr("stroke", "black").attr("stroke-width", 2); // Thay đổi màu và độ dày stroke khi click
          });
  
      // Thêm trục X và trục Y
      svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(xScale));
  
      svg.append("g")
          .call(d3.axisLeft(yScale));
  
      // Thêm nhãn cho trục X và Y
      svg.append("text")
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", height + margin.bottom - 10)
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .text("Gender");
  
      svg.append("text")
          .attr("text-anchor", "middle")
          .attr("transform", "rotate(-90)")
          .attr("x", -height / 2)
          .attr("y", -margin.left + 10)
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .text("Number of people");
  
      // Tạo legend cho các categories
      const legend = svg.append("g")
          .attr("transform", `translate(${width - 10}, 10)`);
  
      const categoryDetails = {
          "Healthy": "(< 200 mg/dL)",
          "At risk": "(200 - 239 mg/dL)",
          "Dangerous": "(≥ 240 mg/dL)"
      };
  
      categories.forEach((cat, i) => {
          const legendRow = legend.append("g")
              .attr("transform", `translate(0, ${i * 25})`);
  
          legendRow.append("rect")
              .attr("width", 15)
              .attr("height", 15)
              .attr("fill", color(cat));
  
          legendRow.append("text")
              .attr("x", 20)
              .attr("y", 12)
              .attr("text-anchor", "start")
              .style("font-size", "12px")
              .text(`${cat} ${categoryDetails[cat]}`);
      });
});
  