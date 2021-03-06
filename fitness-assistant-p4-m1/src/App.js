import './App.css';

import { useEffect, useState, useRef } from 'react';

import * as posenet from '@tensorflow-models/posenet';
import * as tfjsWebGl from '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

import * as Webcam from 'react-webcam';

import {drawKeypoints, drawSkeleton} from './utilities';

import { runTraining } from './modelTraining';
import { processData } from './dataProcessing';

import { Grid, makeStyles, AppBar, Toolbar, Typography, 
    Button, Card, CardContent, CardActions, 
    FormControl, InputLabel, NativeSelect, FormHelperText,
    Snackbar, CircularProgress 
} from  '@material-ui/core';

import MuiAlert from  '@material-ui/lab/Alert';

function getTime(){
    return (new Date()).getTime();
}

function Alert(props) {
    return <MuiAlert variant="filled" {...props} />;
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

const delay = (time) => {
    return new Promise((resolve, reject) => {
        if (isNaN(time)) {
            reject(new Error('delay requires a valid number.'));
        } else {
            setTimeout(resolve, time);
        }
    });
}

window.useStyles = useStyles;
function App() {
    const classes = useStyles()
    const POSE_INTERVAL_IN_MS = 1000;

    const [model, setModel] = useState({});   
    
    const [snackbarDataColl, setSnackbarDataColl] = useState(false);   
    const [snackbarDataNotColl, setSnackbarDataNotColl] = useState(false);   

    const [snackbarTrainingError, setSnackbarTrainingError] = useState(false);

    const [isPoseEstimation, setIsPoseEstimation] = useState(false);    
    const [workoutState, setWorkoutState] = useState({
        workout: '',
        name: '',
      });

    let state = 'waiting';
    const [dataCollect, setDataCollect] = useState( false );

    const [opCollectData, setOpCollectData] = useState({}); 
    
    const [rawData, setRawData] = useState([]); 

    const [trainModel, setTrainModel] = useState(false); 
    
    const canvasRef = useRef(null);
    const webcamRef = useRef(null);

    const poseEstimationLoop =  useRef(null);

    const openSnackbarDataColl = () => {
        setSnackbarDataColl(true);
    };

    const closeSnackbarDataColl = () => {
        setSnackbarDataColl(false);
    };
    
    const openSnackbarDataNotColl = () => {
        setSnackbarDataNotColl(true);
    };

    const closeSnackbarDataNotColl = () => {
        setSnackbarDataNotColl(false);
    };

    const handleWorkoutSelect = (event) => {

        setWorkoutState({workout: event.target.value, name: event.target.name})
    };

    const openSnackbarTrainingError = () => {
        setSnackbarTrainingError(true);
      };
      
      const closeSnackbarTrainingError = (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }
        setSnackbarTrainingError(false);
      };
    
    const handleTrainModel = async () => {
        if(rawData.length > 0){
            setTrainModel(true);
            
            const [numOfFeatures, convertedDatasetTraining, convertedDatasetValidation] = processData(rawData);
            console.info(numOfFeatures, convertedDatasetTraining, convertedDatasetValidation);
            await runTraining( convertedDatasetTraining, convertedDatasetValidation, numOfFeatures);
            setTrainModel(false);
            
        } else {
            openSnackbarTrainingError();
        }

    };
    
    const collectData = async () => {
        setOpCollectData('active');

        setTimeout( _ => {
            openSnackbarDataColl();
            state = 'collecting';
            setTimeout( _ => {
                openSnackbarDataNotColl();
                setOpCollectData('inactive');
                state = 'waiting';
            } ,30 * 1000);
        },10 * 1000);
    };

    async function loadPosenet(){

            let model = await posenet.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                inputResolution: { width: 400, height: 300 },
                multiplier: 0.75
            });

            setModel(model);

            console.info('Posenet Model Loaded???');
    }

    const handlePoseEstimation = (event) =>{
        console.info(isPoseEstimation , event.currentTarget.value , workoutState, opCollectData);
        let inputValue = event.currentTarget.value;
        
        if( inputValue == 'COLLECT_DATA' ){
            if(isPoseEstimation && opCollectData == 'inactive'){
                setIsPoseEstimation(!isPoseEstimation);
                stopPoseEstimation();   
                state = 'waiting';
                setDataCollect(false);
            } else if(!isPoseEstimation && workoutState && workoutState.workout != ''){
                setIsPoseEstimation(!isPoseEstimation);
                startPoseEstimation();
                collectData();
                setDataCollect(true)
            }
        }
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

            const windowWidth = 800;
            const windowHeight = 600;

            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;

            poseEstimationLoop.current = setInterval( async() => {
                const pose = await model.estimateSinglePose(video, {
                    flipHorizontal: false
                });

                console.info('####################');
                const endTime = getTime();
                let inputs = [];

                console.info( endTime - currentTime );
                console.info(tf.getBackend());
                console.info(pose);
                console.info(workoutState.workout);

                for(let point of pose.keypoints){
                    let x = 0;
                    let y = 0;
                    if(point.score >= 0.1){
                        x = point.position.x ;
                        y = point.position.y ;
                    }
                    x = (x / (windowWidth / 2)) - 1;
                    y =  (y / (windowHeight / 2)) - 1;
                    inputs.push(x,y);
                }

                console.log('STATE->' + state);
                if (state === 'collecting') {
                    console.info('RAW ##################');
                    let rawDataRow = { xs: inputs, ys: workoutState.workout}

                    rawData.push(rawDataRow);
                    setRawData(rawData);

                }

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
                    <NativeSelect inputProps={{
                        name: 'workout',
                        id: 'age-native-helper',
                      }}
                       onChange={handleWorkoutSelect} value={workoutState.workout}>
                        <option value=""></option>
                        <option value="JJ">Jumping Jacks</option>
                        <option value="WS">Wall-Sit</option>
                        <option value="L">Lunges</option>
                    </NativeSelect>
                    <FormHelperText> Select training data type </FormHelperText>                
                </FormControl>
                <Toolbar>
                <Typography style={{marginRight:16}} >
                        <Button disabled={trainModel}
                        variant='contained'  value='COLLECT_DATA' 
                            color={isPoseEstimation? 'secondary' : 'default'} onClick={handlePoseEstimation}>
                                {isPoseEstimation? 'Stop' : 'Collect Data'} </Button>
                        </Typography>
                        <Typography style={{marginRight:16}} >
                        <Button variant='contained' disabled={dataCollect}  onClick={handleTrainModel}> Train Model </Button>                        
                    </Typography>
                    {trainModel ? <CircularProgress color="secondary"/> : null}
                </Toolbar>
            </Grid>
            <Snackbar open={snackbarDataColl} autoHideDuration={2000}
             onClose={closeSnackbarDataColl}>
                <Alert severity="info" onClose={closeSnackbarDataColl}>Started collecting pose data!</Alert>
            </Snackbar>
            <Snackbar open={snackbarDataNotColl} autoHideDuration={2000}
             onClose={closeSnackbarDataNotColl}>
                <Alert severity="success" onClose={closeSnackbarDataNotColl}>Completed collecting pose data!</Alert>
            </Snackbar>
            <Snackbar open={snackbarTrainingError} autoHideDuration={2000} onClose={closeSnackbarTrainingError}>
            <Alert onClose={closeSnackbarTrainingError} severity="error">
                Training data is not available!
            </Alert>
            </Snackbar>
        </Grid>
    </div>
  );
}

export default App;
