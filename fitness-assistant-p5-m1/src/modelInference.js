import * as tf from '@tensorflow/tfjs';

export function runInference(model, data){
    console.info(data)
    const tensor = tf.tensor2d(data.xs, [1, data.xs.length]);
    const prediction = model.predict(tensor);
    const idx = tf.argMax(prediction, 1).dataSync();
    const probability = prediction.dataSync()[idx];

    console.info(tensor, prediction, probability);
    
    let result = null;
    if(probability > .99){
        let workouts = ["JJ", "WS", "L"];
        result = workouts[idx];
        console.info( `${workouts[idx]}, probability: ${probability}`);
    }

    prediction.dispose();
    return result;
}   