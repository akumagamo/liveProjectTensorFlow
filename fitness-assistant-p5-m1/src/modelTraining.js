import * as tf from '@tensorflow/tfjs';

function buildModel(numOfFeatures){
    const model = tf.sequential();
    
    model.add(tf.layers.dense({units: 12, inputShape: [numOfFeatures]}));
    model.add(tf.layers.dense({units: 8, activation: 'relu'}));
    model.add(tf.layers.dense({units: 3, activation: 'softmax'}));

    model.compile({
        loss: 'categoricalCrossentropy',
        optimizer: tf.train.adam(0.001),
        metrics: ['accuracy']
    })

    return model;
}

export  async function runTraining(convertedDatasetTraining, convertedDatasetValidation, numOfFeatures){
    let model = buildModel(numOfFeatures);

    await model.fitDataset(convertedDatasetTraining, {
        epochs: 100,
        validationData: convertedDatasetValidation,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            console.info(epoch + ':' + logs.loss);
          }
        }
      });

      await model.save('downloads://model');

      console.info('Model saved');

      return model;
}

