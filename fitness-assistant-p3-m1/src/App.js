import './App.css';

import { useEffect, useState, useRef } from 'react';

import * as posenet from '@tensorflow-models/posenet';
import * as tfjsWebGl from '@tensorflow/tfjs-backend-webgl';

import * as Webcam from 'react-webcam';

import {drawKeypoints, drawSkeleton} from './utilities';

import { Grid } from  '@material-ui/core';



function getTime(){
    return (new Date()).getTime();
}

function App() {
    const POSE_INTERVAL_IN_MS = 1000;

    const [model, setModel] = useState({});    

    const [isPoseEstimation, setIsPoseEstimation] = useState(false);    
    
    const canvasRef = useRef(null);
    const webcamRef = useRef(null);
    const poseEstimationLoop =  useRef(null);

    async function loadPosenet(){

            let model = await posenet.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                inputResolution: { width: 400, height: 300 },
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
    };

    const drawCanvas = (pose, videoWidth, videoHeight, canvas) => {
        if(canvas){
            const ctx = canvas.getContext('2d');

            canvas.width = videoWidth;
            canvas.height = videoHeight;

            if(pose && pose.keypoints){
                let points = pose.keypoints.filter( x => x.score >.8 );
                for(let point of points){
                    if(point.score > .7){
                        drawKeypoints(ctx, point);
                    }   
                }

                drawSkeleton(ctx, pose);
            }


        }
        
    };

    const startPoseEstimation = async () =>{
        if(webcamRef && webcamRef.current && webcamRef.current.video.readyState === 4){
            let currentTime = getTime();

            const video = webcamRef.current.video;
            const {videoHeight, videoWidth} = webcamRef.current.video;

            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            poseEstimationLoop.current = setInterval( async() => {
                const pose = await model.estimateSinglePose(video, {
                    flipHorizontal: false
                });

                const endTime = getTime();
                console.info(pose, endTime - currentTime );
                drawCanvas(pose, videoWidth, videoHeight, canvasRef.current);                
            }, POSE_INTERVAL_IN_MS );
        }   


    }

    const stopPoseEstimation = () => {
        clearInterval(poseEstimationLoop.current)
    }

    useEffect(() =>{
        loadPosenet();
    },[]);

  return (
    <div className="App">
        <Grid spacing={3} container={true} >
            <Grid spacing={3} container={true} >
                <Grid spacing={3} container={true} item={true} xs={12} >

                </Grid>
            </Grid>
        </Grid>
        {/*} <Webcam
        audio={false}
        width={400}
        height={300}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="web-cam"
      />
        <canvas className='my-canvas' ref={canvasRef}></canvas> */}
    </div>
  );
}

export default App;
