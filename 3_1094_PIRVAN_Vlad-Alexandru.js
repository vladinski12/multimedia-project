//*
//* GLOBAL VARIABLES
//*

let parsedData;

const indicators = {
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

const countries = [
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

//*
//* FUNCTIONS FOR FETCHING DATA
//*

const last15Years = [...Array(15).keys()].map(
  (year) => new Date().getFullYear() - year
);

const eurostatURL = (indicator, time) =>
  `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${indicator}&time=${time}${countries
    .map((country) => `&geo=${country}`)
    .join("")}`;

async function getEurostatDataBasedOnIndicator(inidicator, time) {
  const data = await fetch(eurostatURL(inidicator, time));
  const json = await data.json();
  return json;
}

async function getRawEurostatData(indicators) {
  const result = {
    gdp_per_capita: {},
    life_expectancy: {},
    population: {},
  };
  const promises = [];
  for (const indicator of Object.keys(indicators)) {
    for (const year of last15Years) {
      promises.push(
        getEurostatDataBasedOnIndicator(indicators[indicator].datasetCode, year)
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
}

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
          indicator: indicators[indicator].code,
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

const initIndicatorSelect = (indicators) => {
  const select = document.querySelector("#indicator-select");
  Object.keys(indicators).forEach((indicator) => {
    const option = document.createElement("option");
    option.value = indicator;
    option.innerText = indicators[indicator].name;
    select.appendChild(option);
  });
  select.onchange = () => {
    document.querySelector("#graph-container > svg")?.remove();
  };
};

const initCountrySelect = (countries) => {
  const select = document.querySelector("#country-select");
  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.innerText = country;
    select.appendChild(option);
  });
  select.onchange = () => {
    document.querySelector("#graph-container > svg")?.remove();
  };
};

const initCreateChartButtonEventListener = () => {
  document.querySelector("#create-chart-button").onclick = () => {
    if (!parsedData) return alert("Datele nu au fost incarcate");
    const indicatorSelect = document.querySelector("#indicator-select");
    const countrySelect = document.querySelector("#country-select");
    document.querySelector("#graph-container > svg")?.remove();
    const newSVG = createSVG(
      parsedData
        .filter(
          (data) =>
            data.indicator === indicators[indicatorSelect.value].code &&
            data.tara === countrySelect.value
        )
        .map((data) => ({ valoare: data.valoare, an: data.an }))
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

  //container.style.width = `${(data.length - 1) * (barWidth + spacing)}px`;

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

const initYearSelect = () => {
  const select = document.querySelector("#year-select");
  last15Years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.innerText = year;
    select.appendChild(option);
  });
};

const drawBubbleChart = () => {
  const canvas = document.querySelector("#bubble-chart");
  const ctx = canvas.getContext("2d");

  const minValue = Math.min(...parsedData.map((item) => item.valoare));
  const maxValue = Math.max(...parsedData.map((item) => item.valoare));

  parsedData.forEach((item) => {
    const x = (parseInt(item.an) - 2000) * 100; // Adjust x position based on year
    const y = canvas.height - item.valoare * 5; // Adjust y position based on value
    const radius = mapValueToRadius(item.valoare, minValue, maxValue, 5, 30);

    drawBubble(ctx, x, y, radius);
  });
};

const drawBubble = (ctx, x, y, r) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.stroke();
};

const mapValueToRadius = (value, minValue, maxValue, minRadius, maxRadius) => {
  return (
    ((value - minValue) / (maxValue - minValue)) * (maxRadius - minRadius) +
    minRadius
  );
};

//*
//* MAIN
//*

document.addEventListener("DOMContentLoaded", async () => {
  initIndicatorSelect(indicators);
  initCountrySelect(countries);
  initCreateChartButtonEventListener();

  parsedData = parseEurostatData(await getRawEurostatData(indicators));

  initYearSelect();
  drawBubbleChart();
});
