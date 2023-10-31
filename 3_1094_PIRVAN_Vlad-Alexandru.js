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

const last15Years = [...Array(15).keys()].map(
  (year) => new Date().getFullYear() - year
);

const eurostatURL = (indicator, time) =>
  `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${indicator}&time=${time}${countries
    .map((country) => `&geo=${country}`)
    .join("")}`;

const initIndicatorSelect = (indicators) => {
  const select = document.querySelector("#indicator-select");
  Object.keys(indicators).forEach((indicator) => {
    const option = document.createElement("option");
    option.value = indicator;
    option.innerText = indicators[indicator].name;
    select.appendChild(option);
  });
  select.onchange = (event) => {
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
  select.onchange = (event) => {
    document.querySelector("#graph-container > svg")?.remove();
  };
};

const initCreateChartButton = () => {
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

    const textYear = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    textYear.setAttribute("class", "bar-text");
    textYear.setAttribute("x", index * (barWidth + spacing) + barWidth / 6);
    textYear.setAttribute("y", container.clientHeight - yOffset / 2);
    textYear.textContent = obj.an;
    svg.appendChild(textYear);

    const textValue = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    textValue.setAttribute("class", "bar-text");
    textValue.setAttribute("x", index * (barWidth + spacing) + barWidth / 6);
    textValue.setAttribute(
      "y",
      container.clientHeight -
        ((obj.valoare / maxValue) * container.clientHeight - yOffset)
    );
    textValue.textContent = obj.valoare;
    svg.appendChild(textValue);
  }
  return svg;
};

document.addEventListener("DOMContentLoaded", async () => {
  initIndicatorSelect(indicators);
  initCountrySelect(countries);
  initCreateChartButton();

  const rawData = await getRawEurostatData(indicators);
  parsedData = parseEurostatData(rawData);
});
