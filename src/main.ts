import fs from "fs";
import { Beatmap, ControlPointGroup, HitObject } from "osu-classes";
import { BeatmapDecoder, BeatmapEncoder } from "osu-parsers";
import { StandardRuleset } from "osu-standard-stable";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
const MP3Cutter = require("mp3-cutter");

async function main() {
  const userMapFolder = getUsersMapFolder();
  const maps = fs.readdirSync(userMapFolder) as string[];

  const mapsPath = maps
    .filter((map) => {
      if (fs.lstatSync(`${userMapFolder}/${map}`).isDirectory()) {
        return true;
      } else {
        return false;
      }
    })
    .map((map) => {
      return `${userMapFolder}/${map}`;
    });

  const minimumStarRate = 5;
  const maximumStarRate = 7;
  const minimumTime = 30; //TV Size :)
  const maximumTime = 120;
  const minimumBPM = 250;
  const maximumBPM = 300;

  console.log("Searching for songs...");

  const firstSong = await getDifficulty(mapsPath, {
    minS: minimumStarRate,
    maxS: maximumStarRate,
    minT: minimumTime,
    maxT: maximumTime,
    minBPM: minimumBPM,
    maxBPM: maximumBPM,
  });

  const secondSong = await getDifficulty(mapsPath, {
    minS: minimumStarRate,
    maxS: maximumStarRate,
    minT: minimumTime,
    maxT: maximumTime,
    minBPM: minimumBPM,
    maxBPM: maximumBPM,
  });

  if (firstSong.diffPath === secondSong.diffPath) {
    console.log("Same song, trying again");
    main();
    return;
  }

  console.log(firstSong);
  console.log(secondSong);

  console.log("Found songs !");
  console.log("Merging map objects...");

  const decoder = new BeatmapDecoder();

  const firstSongParsed = await decoder.decodeFromPath(
    firstSong.diffPath,
    true
  );
  const secondSongParsed = await decoder.decodeFromPath(
    secondSong.diffPath,
    true
  );

  const mergedHitObjects = await mergeHitObjects(
    firstSongParsed,
    secondSongParsed
  );

  firstSongParsed.hitObjects = mergedHitObjects.hitObjects;

  const mergedDifficultyPoints = await mergeControlPointsGroups(
    firstSongParsed,
    secondSongParsed,
    mergedHitObjects.firstSecondSongTiming,
    mergedHitObjects.lastFirstSongTiming
  );

  firstSongParsed.controlPoints.groups =
    mergedDifficultyPoints.controlPointsGroups;

  console.log("Map objects merged !");

  firstSongParsed.general.previewTime = 0;
  firstSongParsed.metadata.version = "Mashup version";
  firstSongParsed.metadata.title = (
    firstSongParsed.metadata.title +
    " VS " +
    secondSongParsed.metadata.title
  ).replace(/[\\/:*?"<>|]/g, "");
  firstSongParsed.metadata.artist = (
    firstSongParsed.metadata.artist +
    " VS " +
    secondSongParsed.metadata.artist
  ).replace(/[\\/:*?"<>|]/g, "");

  fs.mkdirSync(`./${firstSongParsed.metadata.title}`);

  console.log("Merging audio files...");

  await mergeAudioFiles(
    `${firstSong.folderPath}/${firstSongParsed.general.audioFilename}`,
    `${secondSong.folderPath}/${secondSongParsed.general.audioFilename}`,
    mergedHitObjects.lastFirstSongTiming,
    mergedHitObjects.firstSecondSongTiming,
    firstSongParsed.metadata.title
  );

  firstSongParsed.general.audioFilename = "merged.mp3";

  if (firstSongParsed.events.backgroundPath) {
    fs.copyFileSync(
      `${firstSong.folderPath}/${firstSongParsed.events.backgroundPath}`,
      `./${firstSongParsed.metadata.title}/merged.jpg`
    );

    firstSongParsed.events.backgroundPath = "merged.jpg";
  }

  const encoder = new BeatmapEncoder();
  await encoder.encodeToPath(
    `./${firstSongParsed.metadata.title}/${firstSongParsed.metadata.title}(${firstSongParsed.metadata.version}).osu`,
    firstSongParsed
  );

  console.log(`You can find your map as "${firstSongParsed.metadata.title}"`);
}

main();

async function mergeAudioFiles(
  firstSongPath: string,
  secondSongPath: string,
  timeToEnd: number,
  timeToStart: number,
  pathToExport: string
) {
  await MP3Cutter.cut({
    src: firstSongPath,
    target: "target2.mp3",
    end: timeToEnd / 1000,
  });
  await MP3Cutter.cut({
    src: secondSongPath,
    target: "target1.mp3",
    start: timeToStart / 1000,
  });

  ffmpeg()
    .setFfmpegPath(ffmpegInstaller.path)
    .setFfprobePath(ffprobe.path)
    .input("target2.mp3")
    .input("target1.mp3")
    .on("error", function (err) {
      console.log("An error occurred: " + err.message);
    })
    .on("end", function () {
      console.log("Merging finished !");
    })
    .mergeToFile(`./${pathToExport}/merged.mp3`, "./tmp");

  console.log("Merging audio fiels finished !");
}

async function mergeControlPointsGroups(
  firstSong: Beatmap,
  secondSong: Beatmap,
  firstSecondSongTiming: number,
  lastFirstSongTiming: number
): Promise<{
  controlPointsGroups: ControlPointGroup[];
}> {
  const firstHalf = firstSong.controlPoints.groups.filter((point) => {
    return point.startTime < lastFirstSongTiming;
  });

  const secondHalf = secondSong.controlPoints.groups
    .filter((point) => point.startTime > firstSecondSongTiming)
    .map((point) => {
      point.startTime += lastFirstSongTiming - firstSecondSongTiming;
      return point;
    });

  const controlPointsGroups = [...firstHalf, ...secondHalf];

  return { controlPointsGroups };
}

async function mergeHitObjects(
  firstSong: Beatmap,
  secondSong: Beatmap
): Promise<{
  hitObjects: HitObject[];
  lastFirstSongTiming: number;
  firstSecondSongTiming: number;
}> {
  const firstHalf = firstSong.hitObjects.slice(
    0,
    Math.floor(firstSong.hitObjects.length / 2)
  );

  const secondHalf = secondSong.hitObjects.slice(
    Math.floor(secondSong.hitObjects.length / 2)
  );

  const lastFirstSongTiming = firstHalf[firstHalf.length - 1].startTime;
  const firstSecondSongTiming = secondHalf[0]?.startTime ?? 0;

  const hitObjects = [
    ...firstHalf.slice(0, firstHalf.length - 1),
    ...(secondHalf.length
      ? secondHalf.map((hitObject) => {
          hitObject.startTime += lastFirstSongTiming - firstSecondSongTiming;
          return hitObject;
        })
      : []),
  ];

  return { hitObjects, lastFirstSongTiming, firstSecondSongTiming };
}

function getUsersMapFolder() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: node main.js <path to maps folder>");
    process.exit(1);
  } else {
    return args[0];
  }
}

async function getDifficulty(
  songs: string[],
  filter?: {
    minS?: number;
    maxS?: number;
    minT?: number;
    maxT?: number;
    minBPM?: number;
    maxBPM?: number;
  }
) {
  if (songs.length <= 1) {
    throw new Error("Not enough songs");
  }

  let tries = 0;
  while ((filter && tries < 5000) || tries < 10) {
    const folderPath = songs[Math.floor(Math.random() * songs.length)];
    const mapFiles = fs
      .readdirSync(folderPath, "utf8")
      .filter((file) => file.endsWith(".osu"));

    console.log(mapFiles);

    if (filter) {
      for (const diff of mapFiles) {
        const decoder = new BeatmapDecoder();

        const parsed = await decoder
          .decodeFromPath(`${folderPath}/${diff}`, true)
          .catch(() => {
            return;
          });

        if (!parsed) {
          continue;
        }

        /* Check if gamemode is osu! standard */
        if (parsed.mode === 1) continue;

        /* Check for BPM if needed */
        if (filter.minBPM && Math.floor(parsed.bpm) < filter.minBPM) continue;
        if (filter.maxBPM && Math.floor(parsed.bpm) > filter.maxBPM) continue;

        /* Check for starrate if needed */
        const ruleset = new StandardRuleset();
        const difficultyCalculator = ruleset
          .createDifficultyCalculator(parsed)
          .calculate().starRating;

        if (filter.minS && difficultyCalculator < filter.minS) continue;
        if (filter.maxS && difficultyCalculator > filter.maxS) continue;

        /* Check for time if needed */
        const mapsTime = Math.floor(
          (parsed.length -
            parsed.general.audioLeadIn -
            (parsed.hitObjects[parsed.hitObjects.length - 1].startTime -
              parsed.length)) /
            1000
        );

        if (filter.minT && mapsTime < filter.minT) continue;
        if (filter.maxT && mapsTime > filter.maxT) continue;

        return { folderPath: folderPath, diffPath: `${folderPath}/${diff}` };
      }
    }

    tries++;
  }

  console.log("It looks like search took too long, do you want to continue?");
  // TODO: GET USER INPUT
  throw new Error("Search took too long");
}
