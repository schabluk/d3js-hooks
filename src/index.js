import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import moment from "moment";
import Rect, { useRect } from "@reach/rect";

import "./styles.css";

const randomIntFromRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const generateData = (length = 32) =>
  d3.range(length).map((_, i) => ({
    date: moment().add(i, "days"),
    size: i * randomIntFromRange(2, 4) + Math.random()
  }));

function getRandom() {
  return Array.from({ length: randomIntFromRange(1, 5) }).map(_ =>
    generateData()
  );
}

function getAxes(xScale, yScale) {
  // prettier-ignore
  return [
    d3.axisBottom(xScale).ticks(10).tickSize(10),
    d3.axisLeft(yScale).ticks(10, "s").tickSize(10)
  ]
}

function Chart({
  width = 0,
  height = 0,
  data,
  margins = { top: 15, right: 1, bottom: 20, left: 40 },
  className = "Svg"
}) {
  const { left, right, top, bottom } = margins;
  const gWidth = width - left - right;
  const gHeight = height - top - bottom;
  const ref = useRef(null);

  const [xDomain, yDomain] = [
    [
      d3.min(data, co => d3.min(co, d => d.date)),
      d3.max(data, co => d3.max(co, d => d.date))
    ],
    [
      d3.min(data, co => d3.min(co, d => d.size)),
      d3.max(data, co => d3.max(co, d => d.size))
    ]
  ];

  // prettier-ignore
  const [xScale, yScale] = [
    d3.scaleTime().domain(xDomain).range([0, gWidth]),
    d3.scaleLinear().domain(yDomain).range([gHeight, 0]).nice()
  ];

  const [xAxis, yAxis] = getAxes(xScale, yScale);

  const line = d3
    .line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.size))
    // .curve(d3["curveLinear"])
    .curve(d3["curveMonotoneX"]);

  const trans = d3.transition().duration(250);

  useEffect(() => {
    const group = d3.select(ref.current);

    // prettier-ignore
    group.append("g").attr("class", "xAxis").attr("transform", `translate(0, ${gHeight})`).call(xAxis);
    // prettier-ignore
    group.append("g").attr("class", "yAxis").call(yAxis);
  }, []);

  /**
   * Resize Event.
   */
  useEffect(() => {
    const group = d3.select(ref.current);

    // re-draw x & y axes.
    group.select(".xAxis").call(xAxis);
    group.select(".yAxis").call(yAxis);

    // prettier-ignore
    group.selectAll(".line").data(data).attr("d", d => line(d));
  }, [width, height]);

  useEffect(() => {
    // Bind data to DOM line elements.
    const group = d3
      .select(ref.current)
      .selectAll(".line")
      .data(data)
      .attr("d", d => line(d));

    // On event: datum entering data set.
    group
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", d => line(d))
      .style("stroke", (d, i) => d3.schemeSet3[i])
      .style("stroke-width", 3)
      .style("fill", "none");

    // On event: datum leaving data set.
    group
      .exit()
      .transition(trans)
      // .attr("d", datum => {
      //   return d3
      //     .line()
      //     .x(d => xScale(d.date))
      //     .y(d => gHeight)(datum);
      // })
      .style("stroke", "white")
      .style("stroke-opacity", 0)
      .style("stroke-width", 1)
      .remove();
  }, [data]);

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax meet"
    >
      <g
        ref={ref}
        width={gWidth}
        height={gHeight}
        transform={`translate(${left}, ${top})`}
      />
    </svg>
  );
}

function App() {
  const [data, setData] = useState(getRandom());
  const changeData = () => setData(getRandom());

  return (
    <div className="App">
      <Rect observe={true}>
        {({ rect, ref }) => (
          <div ref={ref} className="Container">
            {rect && (
              <Chart width={rect.width} height={rect.height} data={data} />
            )}
          </div>
        )}
      </Rect>
      <br />
      <button onClick={changeData}>Update</button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
