export default async function printWatermarkAndClear(firstRun?: boolean) {
  const asciiArt = [
    "              ⢸⣿⡿⠷⠄⠿⠿⠿⠟⠓⠰⠘⠿⣿⣿⡈⣿⡇⢹⡟⠰⠦⠁⠈⠉⠋⠄⠻⢿⣿",
    "              ⢨⡑⠶⡏⠛⠐⠋⠓⠲⠶⣭⣤⣴⣦⣭⣥⣮⣾⣬⣴⡮⠝⠒⠂⠂⠘⠉⠿⠖⣬",
    "              ⠈⠉⠄⡀⠄⣀⣀⣀⣀⠈⢛⣿⣿⣿⣿⣿⣿⣿⣿⣟⠁⣀⣤⣤⣠⡀⠄⡀⠈⠁",
    "              ⠄⠠⣾⡀⣾⣿⣧⣼⣿⡿⢠⣿⣿⣿⣿⣿⣿⣿⣿⣧⣼⣿⣧⣼⣿⣿⢀⣿⡇⠄",
    "              ⡀⠄⠻⣷⡘⢿⣿⣿⡿⢣⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣜⢿⣿⣿⡿⢃⣾⠟⢁⠈",
    "              ⢃⢻⣶⣬⣿⣶⣬⣥⣶⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⣿⣷⣶⣶⣾⣿⣷⣾⣾⢣",
    "                osu!SM - osu! Songs Mashup",
    `                Version: ${process.env.npm_package_version}`,
    "",
  ];

  console.clear();

  for (const line of asciiArt) {
    console.log(line);
    if (firstRun) await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
