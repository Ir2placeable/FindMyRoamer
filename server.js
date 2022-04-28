// modules for opening server
const express = require('express');
const server = express();
const server_port = 8080;

// modules for connecting blockchain
const solc = require('solc');
const Web3 = require('web3');
const blockchain_endpoint = 'http://172.30.76.207:8545';
const web3 = new Web3(Web3.givenProvider || blockchain_endpoint);

// modules for getting address from QR code
const url = require('url');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const caller = web3.eth.getAccounts().then(result => {
    return result[0]
})
contract_objects = {} // key : CA, value : Contract

// 반려동물 등록 파트
server.get('/register', (req, res) => {
    const input_query =  url.parse(req.url, true).query;

    const address = registerPet(input_query['pw'], caller, input_query['owner_name'], input_query['owner_location'], input_query['owner_phone']
        , input_query['pet_name'], input_query['pet_breed'], input_query['pet_feature'], input_query['pet_age'])

    QRCode.toDataURL(address, function(err, url) {
        const data = url.replace(/.*,/, '');
        const img = new Buffer(data, 'base64');
        res.writeHead(200 , {'Content-Type':'image/png'});
        res.end(img);
    })
})

server.get('/report', (req, res) => {
    let req_components = url.parse(req.url, true).query;
    console.log(req_components);
})

server.get('/found', (req, res) => {
    let req_components = url.parse(req.url, true).query;
    console.log(req_components);
})

server.get('/browse', (req, res) => {
    let req_components = url.parse(req.url, true).query;
    console.log(req_components);
})

function compile() {
    const filePath = path.resolve(__dirname, 'contracts', 'FindMyPet.sol');
    const source_code = fs.readFileSync(filePath, 'utf8');
    const solidity_compile_input = {
        language: 'Solidity',
        sources: {
            'FindMyPet.sol' : {
                content: source_code
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': [ '*' ]
                }
            }
        }
    };
    const solidity_compiled_result = JSON.parse(solc.compile(JSON.stringify(solidity_compile_input)));
    return solidity_compiled_result.contracts["FindMyPet.sol"].FindMyPet;

}
async function registerPet(password, caller, owner_name, owner_location, owner_phone, pet_name, pet_breed, pet_feature, pet_age) {
    console.log('start creating new pet');

    const solidity_compiled_result = compile();
    const interface = solidity_compiled_result.abi;
    const bytecode = solidity_compiled_result.evm.bytecode.object;

    await new web3.eth.Contract(interface)
        .deploy({data : bytecode, arguments : [password, owner_name, owner_location, owner_phone]})
        .send({gas : '3000000' , from : caller})
        .then(result => {
            let ca = result.options.address
            contract_objects[ca] = result;
            console.log("CA : ", ca);

            result.methods.registerPet(pet_name, pet_breed, pet_feature, pet_age)
                .send({from : caller, gas : '3000000'})
            console.log('finish creating new pet');

            return 'google.com'
        })
}

server.listen(server_port, () => {
    console.log('server open');
})