import * as tf from '@tensorflow/tfjs';

export function processData(rawData) {

    let trainingLength = Math.floor(rawData.length * .8);
    const shuffledData = tf.data.array(rawData).shuffle(10);

    const trainingSet = shuffledData.take(trainingLength);
    const validationSet = shuffledData.skip(trainingLength);

    const convertTrainingSet = convertedDataset(trainingSet);
    const convertValidationSet = convertedDataset(validationSet);

    return[ rawData[0].length, convertTrainingSet, convertValidationSet];
};


const convertedDataset = (data) =>
  data.map(({ xs, ys }) => {
      const labels = [
          ys == "JJ" ? 1 : 0,
          ys == "WS" ? 1 : 0,
          ys == "L" ? 1 : 0
      ];
      return { 
            xs: Object.values(xs), 
            ys: Object.values(labels)};
  }).batch(30);