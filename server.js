const express = require('express');
const server = express();
const url = require('url');
const server_port = 8080;

const path = require('path');
const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const blockchain_endpoint = 'http://10.30.114.49:8546';
const web3 = new Web3(Web3.givenProvider || blockchain_endpoint);

caller = "0x83e0b83f09183cb4bbD6CeAcb6De369456ef71A2"
contract_objects = {}

server.get('/register', (req, res) => {
    let req_components = url.parse(req.url, true).query;

    // let owner_name = req_components[owner_name];
    // let owner_location = req_components[owner_location];
    // let owner_phone = req_components[owner_phone];
    let owner_name = "ato";
    let owner_location = "seoul";
    let owner_phone = 123

    registerPet(caller, owner_name, owner_location, owner_phone)
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
async function registerPet(caller, owner_name, owner_location, owner_phone) {
    console.log('start creating new pet');

    const solidity_compiled_result = compile();
    const interface = solidity_compiled_result.abi;
    const bytecode = solidity_compiled_result.evm.bytecode.object;

    await new web3.eth.Contract(interface)
        .deploy({data : bytecode, arguments : [owner_name, owner_location, owner_phone]})
        .send({gas : '3000000' , from : caller})
        .then(result => {
            contract_objects[result.options.address] = result;
            console.log(result.options.address);

            // QR 코드 생성
            // QR 이미지 생성
            // 웹으로 QR 이미지 전송

            console.log('finish creating new pet');
        })
}

server.listen(server_port, () => {
    console.log('server open');
})