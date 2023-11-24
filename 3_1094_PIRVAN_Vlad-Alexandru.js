//*
//* GLOBAL VARIABLES
//*

let PARSED_DATA;

const INDICATORS = {
  gdp_per_capita: {
    name: "PIB pe cap de locuitor",
    datasetCode: "sdg_08_10?na_item=B1GQ&unit=CLV10_EUR_HAB",
    code: "PIB",
  },
  life_expectancy: {
    name: "Speranta de viata",
    datasetCode: "demo_mlexpec?sex=T&age=Y1",
    code: "SV",
  },
  population: {
    name: "Populatie",
    datasetCode: "demo_pjan?sex=T&age=TOTAL",
    code: "POP",
  },
};

const COUNTRIES = [
  "BE",
  "BG",
  "CZ",
  "DK",
  "DE",
  "EE",
  "IE",
  "EL",
  "ES",
  "FR",
  "HR",
  "IT",
  "CY",
  "LV",
  "LT",
  "LU",
  "HU",
  "MT",
  "NL",
  "AT",
  "PL",
  "PT",
  "RO",
  "SI",
  "SK",
  "FI",
  "SE",
];

const BUBBLE_CHART_X_AXIS = "PIB";
const BUBBLE_CHART_Y_AXIS = "SV";
const BUBBLE_CHART_BUBBLE_SIZE = "POP";

const CURRENT_YEAR = new Date().getFullYear();
const NUMBER_OF_YEARS = 15;

//*
//* FUNCTIONS FOR WORKING WITH THE DATA
//*

const lastNumberOfYears = [...Array(NUMBER_OF_YEARS).keys()].map(
  (year) => CURRENT_YEAR - year
);

const eurostatURL = (indicator, time) =>
  `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${indicator}&time=${time}${COUNTRIES.map(
    (country) => `&geo=${country}`
  ).join("")}`;

const getEurostatDataBasedOnIndicator = async (indicator, time) => {
  return (await fetch(eurostatURL(indicator, time))).json();
};

const getRawEurostatData = async (indicatorsToFetch) => {
  const result = {
    gdp_per_capita: {},
    life_expectancy: {},
    population: {},
  };
  const promises = [];
  for (const indicator of Object.keys(indicatorsToFetch)) {
    for (const year of lastNumberOfYears) {
      promises.push(
        getEurostatDataBasedOnIndicator(INDICATORS[indicator].datasetCode, year)
          .then((data) => {
            result[indicator][year] = data;
          })
          .catch((error) => {
            console.log(`Error for ${indicator} and ${year} - ${error}`);
          })
      );
    }
  }
  await Promise.all(promises);
  return result;
};

const parseEurostatData = (data) => {
  const result = [];
  for (const indicator of Object.keys(data)) {
    for (const year of Object.keys(data[indicator])) {
      for (const [country, index] of Object.entries(
        data[indicator][year].dimension.geo.category.index
      )) {
        result.push({
          tara: country,
          an: year,
          indicator: INDICATORS[indicator].code,
          valoare: data[indicator][year].value[index] ?? -1,
        });
      }
    }
  }
  return result;
};

//*
//* FUNCTIONS FOR WORKING WITH DOM
//*

const initializeIndicatorSelect = (indicators) => {
  const select = document.querySelector("#indicator-select");
  Object.keys(indicators).forEach((indicator) => {
    const option = document.createElement("option");
    option.value = indicator;
    option.innerText = INDICATORS[indicator].name;
    select.appendChild(option);
  });
  select.onchange = () => {
    document.querySelector("#graph-container > svg")?.remove();
  };
};

const initializeCountrySelect = (COUNTRIES) => {
  const select = document.querySelector("#country-select");
  COUNTRIES.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.innerText = country;
    select.appendChild(option);
  });
  select.onchange = () => {
    document.querySelector("#graph-container > svg")?.remove();
  };
};

const initializeCreateChartButtonEventListener = () => {
  document.querySelector("#create-chart-button").onclick = () => {
    if (!PARSED_DATA) return alert("Datele nu au fost incarcate");
    const indicatorSelect = document.querySelector("#indicator-select");
    const countrySelect = document.querySelector("#country-select");
    document.querySelector("#graph-container > svg")?.remove();
    const newSVG = createSVG(
      PARSED_DATA.filter(
        (data) =>
          data.indicator === INDICATORS[indicatorSelect.value].code &&
          data.tara === countrySelect.value
      ).map((data) => ({ valoare: data.valoare, an: data.an }))
    );
    document.querySelector("#graph-container").appendChild(newSVG);
  };
};

const createSVG = (data) => {
  const container = document.querySelector("#graph-container");
  const maxValue = Math.max(...data.map((obj) => obj.valoare));
  const barWidth = 50;
  const spacing = 10;
  const yOffset = 30;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("id", "svg-1");

  for (const [index, obj] of data.entries()) {
    if (obj.valoare === -1) continue;
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("class", "bar");
    bar.setAttribute("x", index * (barWidth + spacing));
    bar.setAttribute(
      "y",
      container.clientHeight -
        ((obj.valoare / maxValue) * container.clientHeight - yOffset)
    );
    bar.setAttribute("width", barWidth);
    bar.setAttribute(
      "height",
      (obj.valoare / maxValue) * (container.clientHeight - yOffset)
    );
    bar.setAttribute("fill", "red");
    svg.appendChild(bar);

    bar.onmousemove = (event) => {
      const tooltip = document.querySelector("#tooltip");
      tooltip.style.display = "block";
      tooltip.style.top = `${event.clientY}px`;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.textContent = `An: ${obj.an} - Valoare: ${obj.valoare}`;
    };
    bar.onmouseout = () => {
      const tooltip = document.querySelector("#tooltip");
      tooltip.style.display = "none";
    };
  }
  return svg;
};

const initializeYearSelect = (select) => {
  lastNumberOfYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.innerText = year;
    select.appendChild(option);
  });
};

//*
//* BUBBLE CHART
//*

const returnMinMaxValuesBasedOnIndicator = (indicator) => {
  const minValue = Math.min(
    ...PARSED_DATA.filter(
      (item) => item.indicator === indicator && Number(item.valoare) !== -1
    ).map((item) => item.valoare)
  );

  const maxValue = Math.max(
    ...PARSED_DATA.filter(
      (item) => item.indicator === indicator && Number(item.valoare) !== -1
    ).map((item) => item.valoare)
  );

  return [minValue, maxValue];
};

const initializeBubbleChartTriggerAnimationButton = () => {
  const button = document.querySelector(
    "#trigger-animation-bubble-chart-button"
  );
  button.onclick = () => {
    animateBubbleChart(CURRENT_YEAR - NUMBER_OF_YEARS, CURRENT_YEAR);
  };
};

const initializeBubbleChartYearSelect = () => {
  const select = document.querySelector("#year-bubble-chart-select");
  initializeYearSelect(select);
  select.onchange = () => {
    drawBubbleChart(select.value);
  };
};

const drawBubbleChart = (year, withLegend = true) => {
  const canvas = document.querySelector("#bubble-chart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const xOffset = 50;
  const yOffset = 50;

  const filteredData = PARSED_DATA.filter(
    (item) => Number(item.an) === Number(year)
  );

  deleteLegend();

  if (filteredData.some((item) => Number(item.valoare) === -1)) {
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.strokeText("Fara date", canvas.width / 2, canvas.height / 2);
    return;
  }
  const [minValueX, maxValueX] =
    returnMinMaxValuesBasedOnIndicator(BUBBLE_CHART_X_AXIS);
  const [minValueY, maxValueY] =
    returnMinMaxValuesBasedOnIndicator(BUBBLE_CHART_Y_AXIS);
  const [minValueBubbleSize, maxValueBubbleSize] =
    returnMinMaxValuesBasedOnIndicator(BUBBLE_CHART_BUBBLE_SIZE);

  const scalingFactor = Math.abs(minValueBubbleSize / maxValueBubbleSize);

  filteredData
    .filter((item) => item.indicator === BUBBLE_CHART_BUBBLE_SIZE)
    .forEach((data) => {
      const xAxisValue = filteredData.find(
        (item) =>
          item.indicator === BUBBLE_CHART_X_AXIS && item.tara === data.tara
      ).valoare;
      const x =
        xOffset +
        ((xAxisValue - minValueX) / (maxValueX - minValueX)) * canvas.width;

      const yAxisValue = filteredData.find(
        (item) =>
          item.indicator === BUBBLE_CHART_Y_AXIS && item.tara === data.tara
      ).valoare;
      const y =
        ((yAxisValue - minValueY) / (maxValueY - minValueY)) * canvas.height -
        yOffset;

      const radius = Math.sqrt(Number(data.valoare)) * scalingFactor;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      const color = randomColor();
      ctx.fillStyle = randomColor();
      if (withLegend) insertLegend(data.tara, color);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(xAxisValue, x, canvas.height - 10);
      ctx.fillText(yAxisValue, 10, y);
    });
};

const deleteLegend = () => {
  const tableBody = document.querySelector("#bubble-chart-legend > tbody");
  tableBody.innerHTML = "";
};

const insertLegend = (country, color) => {
  const tableBody = document.querySelector("#bubble-chart-legend > tbody");
  const row = document.createElement("tr");
  const countryCell = document.createElement("td");
  countryCell.textContent = country;
  const colorCell = document.createElement("td");
  colorCell.style.backgroundColor = color;
  row.appendChild(countryCell);
  row.appendChild(colorCell);
  tableBody.appendChild(row);
};

const randomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 3; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const animateBubbleChart = (startYear, endYear) => {
  const select = document.querySelector("#year-bubble-chart-select");
  select.disabled = true;
  let currentYear = startYear;

  let currentFrame = 0;
  const framesPerSecond = 60;
  const totalFrames = Math.ceil((endYear - startYear) * framesPerSecond);

  const drawFrame = () => {
    const progress = currentFrame / totalFrames;
    drawBubbleChart(
      Math.round(startYear + progress * (endYear - startYear)),
      false
    );
    currentYear += 1 / framesPerSecond;
    currentFrame += 1;
    if (currentFrame < totalFrames) {
      requestAnimationFrame(drawFrame);
    }
  };
  requestAnimationFrame(drawFrame);
  setTimeout(() => {
    select.disabled = false;
    drawBubbleChart(endYear);
  }, (endYear - startYear) * 1000);
};

//*
//* TABLE
//*

const initializeTableYearSelect = () => {
  const select = document.querySelector("#year-table-select");
  initializeYearSelect(select);
  select.onchange = () => {
    drawTable(select.value);
  };
};

const drawTable = (year) => {
  const container = document.querySelector("#table-container");
  container.querySelector("table")?.remove();

  const table = document.createElement("table");

  initializeTableHeader(table);

  initializeRowData(year, table);
  container.appendChild(table);
};

const initializeTableHeader = (table) => {
  const rowHeader = document.createElement("tr");
  const countryHeader = document.createElement("th");
  countryHeader.textContent = "Tara";
  rowHeader.appendChild(countryHeader);
  for (const indicator of Object.keys(INDICATORS)) {
    const header = document.createElement("th");
    header.textContent = INDICATORS[indicator].name;
    rowHeader.appendChild(header);
  }
  table.appendChild(rowHeader);
};

const initializeRowData = (year, table) => {
  for (const country of COUNTRIES) {
    const row = document.createElement("tr");

    const countryTD = document.createElement("td");
    countryTD.textContent = country;
    row.appendChild(countryTD);

    for (let indicator of Object.keys(INDICATORS)) {
      const filteredData = PARSED_DATA.filter(
        (item) =>
          item.indicator === INDICATORS[indicator].code &&
          Number(item.an) === Number(year) &&
          Number(item.valoare) !== -1
      );

      const average =
        filteredData.map((item) => item.valoare).reduce((a, b) => a + b, 0) /
        filteredData.length;

      row.appendChild(createTableData(indicator, country, year, average));
    }

    table.appendChild(row);
  }
};

const createTableData = (indicator, country, year, average) => {
  const td = document.createElement("td");
  const data = PARSED_DATA.find(
    (item) =>
      item.tara === country &&
      item.indicator === INDICATORS[indicator].code &&
      item.an === year &&
      Number(item.valoare) !== -1
  );
  if (data) {
    td.textContent = data.valoare;
    td.style.backgroundColor = valueToRGB(Number(data.valoare), average);
  } else {
    td.textContent = "N/A";
  }
  return td;
};

const valueToRGB = (value, average) => {
  const distance = Math.abs(value - average);
  const normalizedValue = distance / (average * 2);

  const green = Math.floor((1 - normalizedValue) * 255);
  const red = Math.floor(normalizedValue * 255);

  const clampedGreen = Math.min(255, Math.max(0, green));
  const clampedRed = Math.min(255, Math.max(0, red));

  return `rgb(${clampedRed}, ${clampedGreen}, 0)`;
};

//*
//* MAIN
//*

document.addEventListener("DOMContentLoaded", async () => {
  initializeIndicatorSelect(INDICATORS);
  initializeCountrySelect(COUNTRIES);
  initializeCreateChartButtonEventListener();

  initializeBubbleChartYearSelect();
  initializeBubbleChartTriggerAnimationButton();

  initializeTableYearSelect();

  if (localStorage.getItem("eurostat-data")) {
    PARSED_DATA = JSON.parse(localStorage.getItem("eurostat-data"));
  } else {
    const rawData = await getRawEurostatData(INDICATORS);
    PARSED_DATA = parseEurostatData(rawData);
    localStorage.setItem("eurostat-data", JSON.stringify(PARSED_DATA));
  }

  drawBubbleChart(CURRENT_YEAR);
  drawTable(CURRENT_YEAR);
});
