import logo from './logo.svg';
import './App.css';

import { useEffect, useState, useRef } from 'react';

import * as posenet from '@tensorflow-models/posenet';
import * as tfjsWebGl from '@tensorflow/tfjs-backend-webgl';

import * as Webcam from 'react-webcam';


function getTime(){
    return (new Date()).getTime();
}


function App() {
    const POSE_INTERVAL_IN_MS = 100;
    const [model, setModel] = useState({});    

    const [isPoseEstimation, setIsPoseEstimation] = useState(false);    
    

    const webcamRef = useRef(null);
    const poseEstimationLoop =  useRef(null);

    async function loadPosenet(){


            let model = await posenet.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                inputResolution: { width: 800, height: 600 },
                multiplier: 0.75
            });

            setModel(model);

            console.info('Posenet Model Loaded…');
    }

    const handlePoseEstimation = () =>{

        if(isPoseEstimation){
            stopPoseEstimation();   
        } else{
            startPoseEstimation();
        }
        setIsPoseEstimation(!isPoseEstimation);
    }

    const startPoseEstimation = async () =>{
        if(webcamRef && webcamRef.current){
            let currentTime = getTime();

            const video = webcamRef.current.video;
            const {videoHeight, videoWidth} = webcamRef.current.video;

            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            poseEstimationLoop.current = setInterval( POSE_INTERVAL_IN_MS );

            const pose = await model.estimateSinglePose(video, {
                flipHorizontal: false
              });

            const endTime = getTime();

            console.info(pose, endTime,  endTime - currentTime );
        }   


    }

    const stopPoseEstimation = () => {
        clearInterval(poseEstimationLoop.current)
    }

    useEffect(() =>{
        loadPosenet();
    });

  return (
    <div className="App">
      <header className="App-header">
          <button onClick={handlePoseEstimation}> {isPoseEstimation ? 'STOP' : 'START'}</button>
      <Webcam
        audio={false}
        width={800}
        height={600}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="web-cam"
      />

      </header>
    </div>
  );
}

export default App;
