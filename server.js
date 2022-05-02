// modules for opening server
const express = require('express');
const server = express();
const server_port = 3001;
const server_ip = 'ec2-52-78-174-155.ap-northeast-2.compute.amazonaws.com'

// blockchain initialization
const solc = require('solc');
const Web3 = require('web3');
const blockchain_endpoint = 'http://172.31.8.46:8545';
const web3 = new Web3(Web3.givenProvider || blockchain_endpoint);
var owner;
var finder;
web3.eth.getAccounts().then(result => {
    caller = result[0];
    finder = result[1];
    console.log('caller : ', caller);
    console.log('finder : ', finder)

    web3.eth.personal.unlockAccount(caller, "123");
    web3.eth.personal.unlockAccount(finder, "123");
})
contract_objects = {} // key : CA, value : Contract

// modules for getting address from QR code
const url = require('url');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

// 메인 홈페이지 파트
server.get('/main_page', (req, res) => {

    // 메인 홈페이지 html 전송 to cilent -> return page
    var page; // ex) register_page or browse_page

    // register_page 또는 browse_page로 이동하는 주소
    const moveto = server_ip + ':' + server_port + '/' + page;

    // 여기에 moveto 주소로 이동하는 코드 작성하세요
})

// 금쪽이 등록하는 페이지
server.get('/register_page', (req, res) => {

    // 금쪽이 등록하는 html 페이지 -> return : pw, 주인이름, 주인지역, 주인번호, 금쪽 이름, 금쪽 종류, 금쪽 나이, 금쪽 특징
    var pw;
    var owner_name;
    var owner_location;
    var owner_number;
    var pet_name;
    var pet_breed;
    var pet_age;
    var pet_feature;

    const moveto = server_ip + ':' + server_port + '/register/?pw=' +
        pw + '&owner_name=' + owner_name + '&owner_location=' + owner_location + '&owner_number=' + owner_number +
        '&pet_name=' + pet_name + '&pet_breed=' + pet_breed + '&pet_age=' + pet_age + '&pet_feature=' + pet_feature;

    // 여기에 moveto 주소로 이동하는 코드 작성하세요
})

// 금쪽이 등록하고 QR 보여주는 페이지
server.get('/register', (req, res) => {
    const input_query = url.parse(req.url, true).query;

    // sample url
    // register/?pw=123&owner_name=ato&owner_location=seoul&owner_phone=123&pet_name=choco&pet_breed=dog&pet_feature=black&pet_age=1

    registerPet(caller, input_query['pw'], input_query['owner_name'], input_query['owner_location'], input_query['owner_phone']
        , input_query['pet_name'], input_query['pet_breed'], input_query['pet_age'], input_query['pet_feature'])
        .then((result) => {

            const qr_source = server_ip + ':' + server_port + '/QRcode/?ca=' + result;
            console.log('qr_source :' , qr_source)

            QRCode.toDataURL(qr_source, function (err, url) {
                const data = url.replace(/.*,/, '');
                const img = new Buffer(data, 'base64');
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.end(img);
            })
        })
        .catch((err) => {
            console.log('error in register function',);
        })
})

// QR 코드로 접속하는 페이지
server.get('/QRcode', (req, res) => {

    // sample
    // aws_ip:3001/QRcode/?ca=0x123
    const input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];
    console.log('ca : ', ca);
    res.send('QRcode page');


    // 여기에 페이지 추가 => command 와 password 리턴

    // mockup
    const command = 'report' // or 'found'
    const password = "123"
    // mockup
    const moveto = server_ip + ":" + server_port + "/" + command + "/?ca=" + ca + "%pw=" + password

})

// 금쪽이 분실신고 하는 파트
server.get('/report', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const target_contract = contract_objects[input_query['ca']]

    // sample
    // aws_ip:3001/report/?ca=0x123&pw=123&lost_location=kookminUniv&prize=1
    lostPet(caller, target_contract, input_query['pw'], input_query['lost_location'], input_query['prize'])
        .then(()=> {
            console.log('금쪽이 분실신고 완료');
            res.send('금쪽이 분실신고 완료');
        })
        .catch((err) => {
            console.log('error in report function');
        })
})

// 누군가 금쪽이를 발견한 파트
server.get('/whospet', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const target_contract = contract_objects[input_query['ca']]

    // sample
    // aws_ip:3001/whospet/?ca=0x123

    var owner_source = "";
    whosPet(finder, target_contract)
        .then(result => {
            console.log('주인정보 \n', result);
            owner_source = owner_source + result[0] + " " + result[1] + " " + result[2]
            res.send(owner_source);
        })
        .catch((err) => {
            console.log('error in whospet function\n\n', err);
        })

})

// 금쪽이 분실신고 취소하는 파트
server.get('/cancel', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const target_contract = contract_objects[input_query['ca']]

    // sample
    // aws_ip:3001/cancle/?ca=0x123&pw=123

    cancelLost(caller, target_contract, input_query['pw'])
        .then(() => {
            console.log('금쪽이 분실신고 취소완료');
            res.send('금쪽이 분실신고 취소완료')
        })
        .catch((err) => {
            console.log('error in cancel function');
        })
})

// 금쪽이 다시 찾고 현상금 주는 파트
server.get('/found', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const target_contract = contract_objects[input_query['ca']]

    // found/?ca=....&pw=123
    foundPet(caller, target_contract, input_query['pw'])
        .then(() => {
            console.log('현상금 받음');
        })
        .then(() => {
            web3.eth.getBalance(finder)
                .then(result => {
                    console.log(result);
                    res.send(result);
                })
        })
        .catch((err) => {
            console.log('error in found function');
        })
})

// 분실된 금쪽이들을 보여주는 파트
server.get('/browse', (req, res) => {

    var pet_source;
    for (temp_ca in contract_objects) {
        checkLost(caller, contract_objects[temp_ca])
            .then(result => {
                console.log(result);
                pet_source = pet_source + result[0] + " " + result[1] + " " + result[2] + " " + result[3] + " " + result[4] + " " + result[5] + " ";
            })
            .catch((err) => {
                console.log('error in browse function\n', err);
            })
    }
    res.send(pet_source);
})

function compile() {
    const filePath = path.resolve(__dirname, 'contracts', 'FindMyPet3.sol');
    const source_code = fs.readFileSync(filePath, 'utf8');
    const solidity_compile_input = {
        language: 'Solidity',
        sources: {
            'FindMyPet3.sol' : {
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
    return solidity_compiled_result.contracts["FindMyPet3.sol"].FindMyPet3;

}
async function registerPet(caller, pw, owner_name, owner_location, owner_phone,
                           pet_name, pet_breed, pet_age, pet_feature) {
    console.log('start registerPet function');

    const solidity_compiled_result = compile();
    const interface = solidity_compiled_result.abi;
    const bytecode = solidity_compiled_result.evm.bytecode.object;

    console.log('compile was done');

    var ca;
    await new web3.eth.Contract(interface)
        .deploy({data : bytecode, arguments : [pw, owner_name, owner_location, owner_phone, pet_name, pet_breed, pet_age, pet_feature]})
        .send({gas : 3000000 , from : caller})
        .then(result => {
            console.log('deploy was done');

            ca = result.options.address;
            contract_objects[ca] = result;
            console.log('result of registerPet : ', ca);

            })
    return ca;
}

async function lostPet(caller, target_contract, pw, lost_location, prize) {
    console.log('start lostPet function');

    await target_contract.methods.lostPet(pw, lost_location)
        .send({from : caller, gas : 3000000 , value : prize});
}
async function cancelLost(caller, target_contract, pw) {
    console.log('start cancelLost function');

    await target_contract.methods.cancelLost(pw)
        .call({from : caller});
}

async function whosPet(finder, target_contract) {
    console.log('start whosPet function');

    await target_contract.methods.setFinder()
        .send({from : finder, gas : 3000000 })
        .then(console.log('setFinder Done'));


    return await target_contract.methods.getOwner()
        .call({from : finder})
        .then(console.log('getOwner Done'));
}

async function foundPet(caller, target_contract, pw) {
    console.log('start foundPet function');

    return await target_contract.methods.foundPet(pw)
        .send({from : caller, gas : 3000000 });
}

async function checkLost(caller, target_contract) {
    console.log('start checkLost function');
    return await target_contract.methods.checkLost()
        .call({from : caller})
}

server.listen(server_port, () => {
    console.log('FindMyRoamer server open');
})