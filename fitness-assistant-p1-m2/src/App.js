import logo from './logo.svg';
import * as tf from '@tensorflow/tfjs';
import './App.css';


const doTraining = async (model, xs, ys) => {
    const history =
      await model.fit(xs, ys,
        {
          epochs: 200,
          callbacks: {
            onEpochEnd: async (epoch, logs) => {
              console.info("Epoch:" + epoch,  logs);
            }
          }
        });
    console.log(history.params);
  }
  
function App() {


const handleRunTraining = () =>{
    console.info('Run Training');
    
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  
    model.compile({ optimizer: 
            tf.train.sgd(0.01), 
            loss: 'meanSquaredError' });
    model.summary();

     // Equation: y = 2x - 1
    const equation = (x) => 2* x -1; 
    const xValues = [ -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const yValues = xValues.map( equation);
    const xs = tf.tensor2d(xValues, [xValues.length, 1]);
    const ys = tf.tensor2d(yValues, [yValues.length, 1]);
    
    doTraining(model, xs, ys).then(() => {
        const prediction = model.predict(tf.tensor2d([10], [1, 1]));
        var result = prediction.dataSync();
        prediction.dispose();
        
        console.info(result)
        console.info('Result: ' + result[0]);
    });

};


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={handleRunTraining}> Run Training </button>
      </header>
    </div>
  );
}

export default App;
