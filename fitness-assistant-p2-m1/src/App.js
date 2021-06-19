import logo from './logo.svg';
import './App.css';

import { useEffect, useState, useRef } from 'react';

import * as posenet from '@tensorflow-models/posenet';
import * as tfjsWebGl from '@tensorflow/tfjs-backend-webgl';

import * as Webcam from 'react-webcam';


function App() {
    const [model, setModel] = useState({});    

    const webcamRef = useRef(null);

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

    useEffect(() =>{
        loadPosenet();
    });

  return (
    <div className="App">
      <header className="App-header">
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
