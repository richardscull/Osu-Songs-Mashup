import inquirer from "inquirer";
import Jsoning from "jsoning";

export default async function getLocalizationJson(config: Jsoning) {
  const localization = await config.get("localization");

  return new Jsoning(`./localization/${localization}.json`);
}

export async function setLocalization(config: Jsoning) {
  console.log(); // Blank line
  await inquirer
    .prompt([
      {
        name: "localization",
        type: "list",
        message: "Choose a localization",
        choices: ["English", "Russian"],
      },
    ])
    .then(async (options) => {
      switch (options.localization) {
        case "English":
          await config.set("localization", "en");
          break;
        case "Russian":
          await config.set("localization", "ru");
          break;
      }
    });
}
