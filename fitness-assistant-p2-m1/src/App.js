import logo from './logo.svg';
import './App.css';

import { useEffect, useState } from 'react';

import * as posenet from '@tensorflow-models/posenet';
import * as tfjsWebGl from '@tensorflow/tfjs-backend-webgl';





function App() {
    const [model, setModel] = useState({});    


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
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit 123 <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <br />

      </header>
    </div>
  );
}

export default App;
