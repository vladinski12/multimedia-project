const inidicators = {
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

const currentYear = new Date().getFullYear();

const eurostatURL = (indicator) =>
  `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${indicator}1&sinceTimePeriod=${
    currentYear - 15
  }&untilTimePeriod=${currentYear}${countries
    .map((country) => `&geo=${country}`)
    .join("")}`;

async function getEurostatDataBasedOnIndicator(inidicator) {
  const data = await fetch(eurostatURL(inidicator));
  const json = await data.json();
  return json;
}

document.addEventListener("DOMContentLoaded", async () => {
  initIndicatorSelect(inidicators);
  initCountrySelect(countries);

  let data = {};
  try {
    Object.keys(inidicators).forEach(async (indicator) => {
      data[indicator] = await getEurostatDataBasedOnIndicator(
        inidicators[indicator].datasetCode
      );
    });
  } catch (error) {
    console.log(error);
  }
  console.log(data);
  console.log(data.population.dimension);
  const parsedData = parseEurostatData(data);
});

const parseEurostatData = (data) => {
  let result = [];
  Object.keys(data).forEach((indicator) => {
    Object.entries(data[indicator].dimension.geo.category.index).forEach(
      (country, countryIndex) => {
        Object.entries(data[indicator].dimension.time.category.index).forEach(
          (year, yearIndex) => {
            const index = countryIndex * 2 + yearIndex;
            const objMetadata = {
              tara: country,
              an: year,
              indicator: indicators[indicator].code,
              valoare: data.value[index],
            };
            result.push(objMetadata);
          }
        );
      }
    );
  });
  return result;
};

const initIndicatorSelect = (indicators) => {
  const select = document.querySelector("#indicator-select");
  Object.keys(indicators).forEach((indicator) => {
    const option = document.createElement("option");
    option.value = indicator;
    option.innerText = indicators[indicator].name;
    select.appendChild(option);
  });
  select.onchange = (event) => {
    console.log(event.target.value);
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
    console.log(event.target.value);
  };
};
