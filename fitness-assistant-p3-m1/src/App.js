import './App.css';

import { useEffect, useState, useRef } from 'react';

import * as posenet from '@tensorflow-models/posenet';
import * as tfjsWebGl from '@tensorflow/tfjs-backend-webgl';

import * as Webcam from 'react-webcam';

import {drawKeypoints, drawSkeleton} from './utilities';

import { Grid, makeStyles, AppBar, Toolbar, Typography, 
    Button, Card, CardContent, CardActions, 
    FormControl, InputLabel, NativeSelect, FormHelperText
} from  '@material-ui/core';



function getTime(){
    return (new Date()).getTime();
}

const useStyles =  makeStyles((theme) =>({
        backgroundAppBar: {
            background: '#1875d2'
        },
        title: {
            flexGrow: 1,
            textAlign: 'left'
        },
        statsCard:{
            width: '250px',
            margin: '10px'
        },
        singleLine:{
            flex:'display',
            alignItems: 'center',
            textAlign: 'justify',
            alignContent: 'center'
        },
        formControl: {
            margin: theme.spacing(1),
            minWidth: 120
        }
      }));


window.useStyles = useStyles;
function App() {
    const classes = useStyles()
    const POSE_INTERVAL_IN_MS = 1000;

    const [model, setModel] = useState({});    

    const [isPoseEstimation, setIsPoseEstimation] = useState(false);    
    const [workoutState, setWorkoutState] = useState({
        workout: '',
        name: 'hai',
      });
    
    const canvasRef = useRef(null);
    const webcamRef = useRef(null);
    const poseEstimationLoop =  useRef(null);

    const handleWorkoutSelect = () => {

    };

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
            <AppBar position='static' className={classes.backgroundAppBar} >
                <Toolbar variant='dense'>
                    <Typography
                        variant='h6'
                        color='inherit'
                        className={classes.title}
                    >Fitness Assistant</Typography>
                </Toolbar>
                <Button color='inherit'>Start Workout</Button>
                <Button color='inherit'>History</Button>
                <Button color='inherit'>Reset</Button>
            </AppBar>
            <Grid spacing={3} container={true} >
                <Card>
                    <CardContent>
                        <Webcam
                            audio={false}
                            width={400}
                            height={300}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
     
                            style={{
                                marginLeft: "auto",
                                marginRight: "auto",
                                marginTop: '10px',
                                marginBottom: '10px',
                        
                                textAlign: "center",
                                zindex: 9,
                                width: 800,
                                height: 600,
                              }}
                        />
                        <canvas 
                         style={{
                            position: "absolute",
                            marginLeft: "auto",
                            marginRight: "auto",
                            marginTop: '10px',
                            marginBottom: '10px',
                            textAlign: "center",
                            zindex: 9,
                            width: 800,
                            height: 600,
                            left:0,
                          }}
                            ref={canvasRef}>    
                        </canvas>
                    </CardContent>
                    <CardActions style={{justifyContent:'center'}}>
                        <Grid spacing={0} container={true}>
                            <Grid item={true} xs={12}>
                                <Toolbar style={{justifyContent:'center'}}>
                                    <Card className={classes.statsCard}>
                                        <CardContent>
                                            <Typography 
                                                className={classes.title}
                                                color='textSecondary'
                                                gutterBottom={true}
                                                >Jumping Jacks</Typography>
                                            <Typography variant='h2' component='h2' color='secondary'>75</Typography>
                                        </CardContent>
                                    </Card>
                                    <Card className={classes.statsCard}>
                                        <CardContent>
                                            <Typography 
                                                className={classes.title}
                                                color='textSecondary'
                                                gutterBottom={true}
                                                >Wall-sit</Typography>
                                            <Typography variant='h2' component='h2' color='secondary'>200</Typography>
                                        </CardContent>
                                    </Card>
                                    <Card className={classes.statsCard}>
                                        <CardContent>
                                            <Typography 
                                                className={classes.title}
                                                color='textSecondary'
                                                gutterBottom={true}
                                                >Lunges</Typography>
                                            <Typography variant='h2' component='h2' color='secondary'>5</Typography>
                                        </CardContent>
                                    </Card>
                                </Toolbar>
                            </Grid>
                        </Grid>
                    </CardActions>
                </Card>
            </Grid>
            <Grid item={true} xs={12} className={classes.singleLine}>
                <FormControl className={classes.formControl}>
                    <InputLabel htmlFor='age-native-helper'>Workout</InputLabel>
                    <NativeSelect inputProps onChange={handleWorkoutSelect} value={workoutState.workout}>
                        <option>None</option>
                        <option>Jumping Jacks</option>
                        <option>Wall-Sit</option>
                        <option>Lunges</option>
                    </NativeSelect>
                    <FormHelperText>
                        Select training data type’  
                    </FormHelperText>                
                </FormControl>
                <Toolbar>
                    <Typography style={{marginRight:16}} >
                        <Button variant='contained' > Collect Data </Button>
                        <Button variant='contained' > Train Model </Button>                        
                    </Typography>
                </Toolbar>
            </Grid>
        </Grid>
    </div>
  );
}

export default App;
