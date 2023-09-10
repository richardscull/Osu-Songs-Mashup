import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import printWatermarkAndClear from "../lib/watermark";
import inquirer from "inquirer";
import msToMinAndSec, { toTimeIfNumber } from "../lib/msToMin&Sec";

export async function setFilters(config: Jsoning, name: "local" | "chimu") {
  const localization = await getLocalizationJson(config);
  const localizationFilter = await localization.get("filter");
  const localizationMashupMethods = await localization.get("mashupMethods");
  const filters = config.get("filters") ? config.get("filters") : {};
  const filter = filters[name] ? filters[name] : {};

  const InquirerChoices = ["starRating", "bpm", "length"];

  if (name === "chimu") InquirerChoices.push("query");

  for (const choice of InquirerChoices) {
    printWatermarkAndClear();

    console.log(
      name === "local"
        ? localizationMashupMethods.localMashup.name
        : localizationMashupMethods.chimuMoeMashup.name
    );

    if (name === "local")
      console.log(localizationFilter.localFilterLeeway + "\n");

    const isMultipleVal = choice !== "query";
    const isLength = choice === "length";

    console.log(
      `${localizationFilter[choice]}: ${
        isMultipleVal
          ? isLength
            ? `${toTimeIfNumber(filter[`${choice}Min`]) || "0"} — ${
                toTimeIfNumber(filter[`${choice}Max`]) || "∞"
              }`
            : `${filter[`${choice}Min`] || "0"} — ${
                filter[`${choice}Max`] || "∞"
              }` || localizationFilter.notSet
          : filter[choice] || localizationFilter.notSet
      }`
    );

    await changeSettingInput(config, name, choice);
  }

  require("./settings").default(config);
}

async function changeSettingInput(
  config: Jsoning,
  name: "local" | "chimu",
  attr: string
) {
  const localization = await getLocalizationJson(config);
  const localizationFilter = await localization.get("filter");
  const localizationSettings = await localization.get("settings");
  const localizationSetSettings = await localization.get("setSettings");

  await inquirer
    .prompt([
      {
        name: "changeFilter",
        type: "confirm",
        message: localizationSettings.change + "?",
      },
    ])
    .then(async (options) => {
      if (options.changeFilter) {
        if (attr === "query") {
          await enterValue(false);
        } else {
          if (attr === "length")
            console.log("\n" + localizationSetSettings.writeValInSeconds);
          await enterValue(true);
        }
      }
    });

  async function enterValue(multipleVal: boolean) {
    const filters = config.get("filters") ? config.get("filters") : {};
    const filter = filters[name] ? filters[name] : {};

    let timesToEnter = multipleVal ? 2 : 1;
    for (timesToEnter; timesToEnter > 0; timesToEnter--) {
      const enterNumVal = `${localizationSettings.change} ${
        timesToEnter == 2 ? "1" : "2"
      } ${localizationSettings.newValue}`;

      await inquirer
        .prompt([
          {
            name: "value",
            type: "input",
            message: multipleVal
              ? enterNumVal
              : localizationFilter.enterNewValue,
          },
        ])
        .then((options: any) => {
          if (attr !== "query" && isNaN(options.value)) {
            filter[attr] = undefined;
          } else if (attr !== "query" && multipleVal) {
            filter[`${attr}${timesToEnter == 2 ? "Min" : "Max"}`] =
              options.value || undefined;
          } else {
            filter[attr] = options.value || undefined;
          }
        });

      config.set("filters", {
        ...filters,
        [name]: filter,
      });
    }
  }
}
