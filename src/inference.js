const tfjs = require('@tensorflow/tfjs-node');
const {Firestore} = require("@google-cloud/firestore");

function loadModel() {
    const modelUrl = "https://storage.googleapis.com/cancer-detection-model-hmd/submissions-model/model.json";
    return tfjs.loadGraphModel(modelUrl);
}

function predict(model, imageBuffer) {
    const tensor = tfjs.node
      .decodeJpeg(imageBuffer)
      .resizeNearestNeighbor([224, 224])
      .expandDims()
      .toFloat();

    return model.predict(tensor).data();
}

async function store_data(data) {
    const db = new Firestore();
    const predictionCollections = db.collection('predictions');
    const dataDoc = await predictionCollections.doc(data.id)
    try{
      await dataDoc.set(data);
    } catch(err) {
      console.log(err.message);
    }    
}

async function fetch_data() {
    const db = new Firestore();

    const predictionCollections = db.collection('predictions');
    
    try {
        const snapshot = await predictionCollections.get();
        const fetchedData = [];
        snapshot.forEach(doc => {
            fetchedData.push(doc.data());
        });
        return fetchedData;
    } catch (err) {
        console.log(err.message);
        return [];
    }
}

module.exports = { loadModel, predict, store_data, fetch_data };