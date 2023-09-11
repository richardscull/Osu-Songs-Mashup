import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import { Difficulty } from "../locally/types";

export async function MergeAudioAndExport(
  firstSong: Difficulty,
  secondSong: Difficulty,
  timecodes: { endOfFirstHalf: number; startOfSecondHalf: number },
  pathToExport: string
) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  ffmpeg.setFfprobePath(ffprobe.path);

  await cutMP3Audio(
    `${firstSong.path}/${firstSong.difficulty.general.audioFilename}`,
    "Temp/FirstPart.mp3",
    {
      end: timecodes.endOfFirstHalf / 1000 + 1, // +1s to avoid unsync audio after fading
    }
  );

  await cutMP3Audio(
    `${secondSong.path}/${secondSong.difficulty.general.audioFilename}`,
    "Temp/SecondPart.mp3",
    {
      start: timecodes.startOfSecondHalf / 1000,
    }
  );

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input("Temp/FirstPart.mp3")
      .input("Temp/SecondPart.mp3")
      .complexFilter([
        {
          filter: "acrossfade",
          options: {
            d: 1,
          },
        },
      ])
      .output(`Temp/${pathToExport}/merged.mp3`)
      .on("error", function (err) {
        console.log("An error occurred: " + err.message);
        reject(err);
      })
      .on("end", function () {
        resolve(undefined);
      })
      .run();
  });
}

function cutMP3Audio(
  path: string,
  output: string,
  time: {
    start?: number;
    end?: number;
  }
) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path)
      .outputOptions(
        time.start !== undefined
          ? `-ss ${time.start || 0}`
          : `-t ${time.end || 0}`
      )
      .output(output)
      .on("error", function (err) {
        console.log("An error occurred during cutting: " + err.message);
        reject(err);
      })
      .on("end", function () {
        resolve(undefined);
      })

      .run();
  });
}
