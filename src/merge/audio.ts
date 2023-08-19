import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
const MP3Cutter = require("mp3-cutter");

export async function mergeAudioFiles(
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

  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  ffmpeg.setFfprobePath(ffprobe.path);

  ffmpeg()
    .input("target2.mp3")
    .input("target1.mp3")
    .mergeToFile(`./${pathToExport}/merged.mp3`, "./tmp")
    .on("error", function (err) {
      console.log("An error occurred: " + err.message);
    })
    .on("end", function () {
      console.log("Merging finished !");
    });

  console.log("Merging audio fiels finished !");
}
