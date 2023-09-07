import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import printWatermarkAndClear from "../lib/watermark";
import inquirer from "inquirer";

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

    console.log(
      `${localizationFilter[choice]}: ${
        filter[choice] || localizationFilter.notSet
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

  const filters = config.get("filters") ? config.get("filters") : {};
  const filter = filters[name] ? filters[name] : {};

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
        await inquirer
          .prompt([
            {
              name: "value",
              type: "input",
              message: localizationFilter.enterNewValue,
            },
          ])
          .then((options: any) => {
            if (attr !== "query" && isNaN(options.value)) {
              filter[attr] = undefined;
            } else {
              filter[attr] = options.value || undefined;
            }

            config.set("filters", {
              ...filters,
              [name]: filter,
            });
          });
      }
    });
}
