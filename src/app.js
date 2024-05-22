const Hapi = require('@hapi/hapi');
const { customAlphabet  } = require('nanoid');
const { loadModel, predict, store_data, fetch_data } = require('./inference');

class InputError extends Error {
    constructor(message, statusCode = 400, type = 'InputError') {
        super(message);
        this.statusCode = statusCode;
        this.name = type;
    }
}

(async () => {
    const model = await loadModel();
    console.log('model loaded!');

    const server = Hapi.server({
        host: process.env.NODE_ENV !== 'production' ? '0.0.0.0': '0.0.0.0',
        port: 3000
    });

    server.route([
        {
            method: 'POST',
            path: '/predict',
            handler: async (request, h) => {
                const { image } = request.payload;
                const predictions = await predict(model, image);
                
                let id, result, suggestion, createdAt, code;  

                const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                const part1 = customAlphabet(alphabet, 8);
                const part2 = customAlphabet(alphabet, 4);
                const part3 = customAlphabet(alphabet, 12);
                id = part1() + '-' + part2() + '-' + part2() + '-' + part2() + '-' + part3();

                createdAt = new Date().toISOString();

                if (predictions[0] == 1){
                    code = 201;
                    result = "Cancer";
                    suggestion = "Segera periksa ke dokter";
                } else {
                    code = 201;
                    result = "Non-cancer";
                    suggestion = "yaudah sih wir";
                }

                const data = {
                    id: id,
                    result: result,
                    suggestion: suggestion,
                    createdAt: createdAt,
                }
                await store_data(data);

                const response = h.response ({
                    status: "success",
                    message: "Model is predicted successfully",
                    data: data,
                })
                response.code(code);
                return response;
            },
            options: {
                payload: {
                    allow: 'multipart/form-data',
                    multipart: true,
                    maxBytes: 1000000,
                }
            }
        },
        {
            method: 'GET',
            path: '/predict/histories',
            handler: async () => {
                const data = await fetch_data();
                return ({
                    status: "success",
                    data: data
                });
            }
        }
    ]);

    server.ext("onPreResponse", function (request, h) {
        const response = request.response;

        if (response.isBoom && response.output.statusCode == 413) {
            const failResponse = h.response({
                status: "fail",
                message: response.message,
            });
            failResponse.code(response.output.statusCode);
            return failResponse;
        }

        if (response instanceof InputError || response.isBoom) {
            const failResponse = h.response({
                status: "fail",
                message: "Terjadi kesalahan dalam melakukan prediksi",
            });
            failResponse.code(400);
            return failResponse;
        }

        return h.continue;
    });

    await server.start();

    console.log(`Server start at: ${server.info.uri}`);
})();