// 서버 개설 모듈
const express = require('express');
const server = express();
const server_port = 3001;
const server_ip = 'http://3.39.196.91'

// ejs 엔진을 실행하기 위한 코드
server.set('views', __dirname + '/views');
server.set('view engine', 'ejs');

// 블록체인 연동 모듈
const solc = require('solc');
const Web3 = require('web3');
const blockchain_endpoint = 'http://172.31.8.46:8545';
const web3 = new Web3(Web3.givenProvider || blockchain_endpoint);

// Owner, caller2 고정 (Mock up)
var caller;
var caller2;
var finder;
web3.eth.getAccounts().then(result => {
    caller = result[0];
    caller2 = result[1];
    finder = result[2];
    
    console.log('caller : ', caller);
    console.log('caller2 : ', caller2);
    console.log('finder : ', finder);

    web3.eth.personal.unlockAccount(caller, "123", 0);
    web3.eth.personal.unlockAccount(caller2, "123", 0);
    web3.eth.personal.unlockAccount(finder, "123", 0)
})
contract_objects = {} // key : CA, value : Contract


// QR코드 생성 모듈
const url = require('url');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

// ejs 페이지 모음
// 엔트리 페이지
server.get('/', (req, res) => {
    res.render('main.ejs', { title: '우리 금쪽이 찾기', message: '네트워크 최신기술 프로젝트' }, function (err, html) {
        if (err) { console.log(err); }
        res.end(html) // 응답 종료
    })
})
// 금쪽이 등록 페이지
server.get('/register_page', (req, res) => {
    res.render('register_page.ejs', function (err, html) {
        if (err) { console.log(err) }
        res.end(html) // 응답 종료
    })
})
// 분실된 금쪽이들을 보여주는 파트
server.get('/browse', (req, res) => {
    let pet_source = [];
    var roamers;

    const getRoamers = async function () {
        for (var temp_ca in contract_objects) {
            await checkLost(caller, contract_objects[temp_ca])
                .then(result => {
                    if (result == 'not roamer') {
                        console.log('reverted');
                    } else {
                        pet_source.push("이름:" + result[0] + " / 나이:" + result[1] + " / 종류:" + result[2] + " / 특징:" + result[3] + " / 분실위치:" + result[4] + " / 사례금:" + parseInt(result[5]) / 1000000000000000000 + " Ether" + "\n");
                    }
                })
        }
    }

    getRoamers().then(() => {
        console.log('pet_source : ', pet_source);

        if (pet_source.length == 0) {
            roamers = '가출한 금쪽이들이 없습니다.';
        } else {
            roamers = pet_source;
        }

        res.render('browse.ejs', { title: 'QR 메인페이지', message: roamers, }, function (err, html) {
            if (err) { console.log(err) }
            res.end(html) // 응답 종료
        })
    })
})
// 내 잔액 보기 페이지
server.get('/balance', (req, res) => {
    web3.eth.getBalance(finder).then(result => {
        res.render('balance.ejs', { data: result/1000000000000000000 }, function (err, html) {
            if (err) { console.log(err)}
            res.end(html) // 응답 종료
        })
    })
})
// QR 코드로 접속하는 페이지
server.get('/QRcode', (req, res) => {
    const input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];

    const moveto = "/?ca=" + ca;
    res.render('qr_main.ejs', { title: 'QR 메인페이지', message: moveto, }, function (err, html) {
        if (err) { console.log(err)}
        res.end(html) // 응답 종료
    })
})
// 금쪽이 분실신고 하는 페이지
server.get('/QRcode/report_page', (req, res) => {
    const input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];

    const moveto = ca;
    res.render('report_page.ejs', { title: '분실신고 페이지', message: moveto, }, function (err, html) {
        if (err) { console.log(err)}
        res.end(html) // 응답 종료
    })
})
// 금쪽이 분실신고 취소하는 페이지
server.get('/QRcode/cancel_page', (req, res) => {
    const input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];

    const moveto = ca;
    res.render('cancel_page.ejs', { title: '분실취소 페이지', message: moveto, }, function (err, html) {
        if (err) { console.log(err) }
        res.end(html) // 응답 종료
    })

})
// 사례금 보내는 페이지
server.get('/QRcode/found_page', (req, res) => {
    const input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];
    const moveto = ca;

    res.render('found_page.ejs', { title: '금쪽이 찾기페이지', message: moveto, }, function (err, html) {
        if (err) { console.log(err) }
        res.end(html) // 응답 종료
    })
})


// 블록체인 함수실행 모음 (Web3)
// 블록체인에 금쪽이 등록 요청하기
server.get('/register', (req, res) => { //금쪽이 등록완료 페이지
    var context = [
        { 'a': '보호자 성명 : ', 'b': req.query.owner_name },
        { 'a': '보호자 위치 : ', 'b': req.query.owner_location },
        { 'a': '보호자 연락처 : ', 'b': req.query.owner_phone },
        { 'a': '보호자 비밀번호 : ', 'b': req.query.pw },
        { 'a': '금쪽이 이름 : ', 'b': req.query.pet_name },
        { 'a': '금쪽이 나이 : ', 'b': req.query.pet_age },
        { 'a': '금쪽이 종 : ', 'b': req.query.pet_breed },
        { 'a': '금쪽이 특징 : ', 'b': req.query.pet_feature },
    ]

    var moveto = "/?owner_name=" // genqr로 데이터를 파싱하기 위한 코드 (수정 ver1.1)
        + req.query.owner_name
        + '&owner_location='
        + req.query.owner_location
        + '&owner_phone='
        + req.query.owner_phone
        + '&pw='
        + req.query.pw
        + '&pet_name='
        + req.query.pet_name
        + '&pet_age='
        + req.query.pet_age
        + '&pet_breed='
        + req.query.pet_breed
        + '&pet_feature='
        + req.query.pet_feature;

    res.render('register.ejs', { 'data': context, 'message': moveto }, function (err, html) {
        if (err) { console.log(err) }
        res.end(html) // 응답 종료
    })
});
// 금쪽이 QR 코드 생성
server.get('/register/genqr/', (req, res) => { //QR코드 생성 페이지 (수정 ver1.1)
    const input_query = url.parse(req.url, true).query; //debug qr코드 페이지로 제대로 url이 넘어오는지 확인하기 위한 코드

    registerPet(caller, input_query['pw'], input_query['owner_name'], input_query['owner_location'], input_query['owner_phone'].replace('-','')
        , input_query['pet_name'], input_query['pet_breed'], input_query['pet_age'], input_query['pet_feature'])
        .then((result) => {
            console.log('블록체인에 금쪽이 정보 등록 완료');

            const qr_source = server_ip + ':' + server_port + '/QRcode/?ca=' + result;

            QRCode.toDataURL(qr_source, function (err, url) {
                const data = url.replace(/.*,/, '');
                const img = new Buffer.from(data, 'base64');
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.end(img);
            })

            console.log('사용자에게 QR코드 발급 완료');
        })
        .catch((err) => { console.log('error in register function', err); })
});
// 블록체인에 금쪽이 가출 요청하기
server.get('/QRcode/report_page/report', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];
    const target_contract = contract_objects[input_query['ca']]

    lostPet(caller, target_contract, input_query['pw'], input_query['lost_location'], input_query['prize'])
        .then((result)=> {
            if (result == 'wrong password') {
                // 비밀번호 잘못 입력 페이지 렌더링
                res.render('wrong_password.ejs', { title: '패스워드 오류', message: server_ip + ":"+server_port + '/QRcode/report_page/?ca=' + ca }, function (err, html) {
                    if (err) { console.log (err) }
                    res.end(html);
                })
            } else if (result == 'not roamer') {
                // 가출 상태가 아닙니다 페이지 렌더링
                res.render('not_roamer.ejs', { title: '이미 가출 신고가 되었습니다.', message: server_ip + ":"+server_port + '/QRcode/?ca=' + ca }, function (err, html) {
                    if (err) { console.log (err) }
                    res.end(html);
                })
            } else {
                console.log('블록체인에 금쪽이 분실신고 완료');
                res.render('report.ejs', function (err, html) {
                    if (err) { console.log(err) }
                    res.end(html) // 응답 종료
                })
            }
        })
})
// 블록체인에 금쪽이 가출취소 요청하기
server.get('/QRcode/cancel_page/cancel', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];
    const target_contract = contract_objects[input_query['ca']]

    cancelLost(caller, target_contract, input_query['pw'])
        .then((result) => {
            if (result == 'wrong password') {
                // 비밀번호 잘못 입력 페이지 렌더링
                res.render('wrong_password.ejs', { title: '패스워드 오류입니다.', message: server_ip + ":" +server_port + '/QRcode/cancel_page/?ca=' + ca }, function (err, html) {
                    if (err) { console.log (err) }
                    res.end(html);
                })
            } else if (result == 'not roamer') {
                // 가출 상태가 아닙니다 페이지 렌더링
                res.render('not_roamer.ejs', { title: '가출 신고가 되지 않았습니다.', message: server_ip + ":" +server_port + '/QRcode/?ca=' + ca }, function (err, html) {
                    if (err) { console.log (err) }
                    res.end(html)
                })
            } else {
                console.log('블록체인에 금쪽이 분실신고 취소완료');
                res.render('cancel.ejs', function (err, html) {
                    if (err) { console.log(err) }
                    res.end(html) // 응답 종료
                })
            }
        })
})
// 블록체인에 금쪽이 주인정보 요청하기
server.get('/QRcode/whospet', (req, res) => {
    const input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];
    const target_contract = contract_objects[input_query['ca']]

    // sample
    // aws_ip:3001/whospet/?ca=0x123

    var owner_source = "";
    whosPet(caller2, finder, target_contract)
        .then(result => {
            if (result == 'not roamer') {
                // 비밀번호 잘못 입력 페이지 렌더링
                res.render('not_roamer.ejs', { title: '가출 신고된 금쪽이가 아닙니다.', message: server_ip + ":" +server_port + '/QRcode/?ca=' + ca }, function (err, html) {
                    if (err) { console.log (err) }
                    res.end(html);
                })
            } else {
                owner_source = owner_source + result[0] + " " + result[1] + " " + result[2]
                res.render('whospet.ejs', { title: '금쪽이 찾기페이지', message: owner_source, }, function (err, html) {
                    if (err) {
                        console.log(err)
                    }
                    res.end(html) // 응답 종료
                })
            }
        })
})
// 블록체인에 사례금 전송 요청하기
server.get('/QRcode/found_page/found', (req, res) => {
    let input_query = url.parse(req.url, true).query;
    const ca = input_query['ca'];
    const target_contract = contract_objects[input_query['ca']]

    foundPet(caller, target_contract, input_query['pw'])
        .then((result) => {
            if (result == 'wrong password') {
                // 비밀번호 잘못 입력 페이지 렌더링
                res.render('wrong_password.ejs', { title: '패스워드 오류입니다.', message: server_ip + ":"+server_port + '/QRcode/found_page/?ca=' + ca }, function (err, html) {
                    if (err) { console.log (err) }
                    res.end(html);
                })
            } else if (result == 'not founder') {
                // 가출 상태가 아닙니다 페이지 렌더링
                res.render('not_finder.ejs', {
                    title: '금쪽이를 발견한 사람이 없습니다.',
                    message: server_ip + ":"+server_port + '/QRcode/?ca=' + ca }, function (err, html) {
                    if (err) {
                        console.log(err)
                    }
                    res.end(html);
                })
            } else {
                console.log('블록체인에서 사례금 전송 완료');
                res.render('found.ejs', function (err, html) {
                    if (err) { console.log(err) }
                    res.end(html) // 응답 종료
                })
            }
        })
        .catch((err) => { console.log('error in found function', err); })
})


// 스마트 컨트랙트 구동 함수
function compile() {
    const filePath = path.resolve(__dirname, 'contracts', 'FindMyPet4.sol');
    const source_code = fs.readFileSync(filePath, 'utf8');
    const solidity_compile_input = {
        language: 'Solidity',
        sources: {
            'FindMyPet4.sol' : {
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
    return solidity_compiled_result.contracts["FindMyPet4.sol"].FindMyPet4;

}
async function registerPet(caller, pw, owner_name, owner_location, owner_phone, pet_name, pet_breed, pet_age, pet_feature) {
    const solidity_compiled_result = compile();
    const interface = solidity_compiled_result.abi;
    const bytecode = solidity_compiled_result.evm.bytecode.object;

    var ca;
    await new web3.eth.Contract(interface)
        .deploy({data : bytecode, arguments : [pw, owner_name, owner_location, owner_phone, pet_name, pet_breed, pet_age, pet_feature]})
        .send({gas : 3000000 , from : caller})
        .then(result => {
            ca = result.options.address;
            contract_objects[ca] = result;
            })
        .catch(err => { console.log('error in deploy', err) })
    return ca;
}
async function lostPet(caller, target_contract, pw, lost_location, prize) {
    try {
        await target_contract.methods.checkPassword(pw)
            .call({from : caller})
    } catch { return 'wrong password'; }

    try {
        await target_contract.methods.lostPet(lost_location)
            .send({from : caller, gas : 3000000, value : web3.utils.toWei(prize, 'ether')})
    } catch { return 'not roamer' }
}
async function cancelLost(caller, target_contract, pw) {
    try {
        await target_contract.methods.checkPassword(pw)
            .call({from : caller})
    } catch { return 'wrong password'; }

    try {
        await target_contract.methods.cancelLost()
            .send({from : caller, gas : 3000000 })
    } catch { return 'not roamer' }
}
async function whosPet(caller2, finder, target_contract) {
    try {
        await target_contract.methods.setFinder(finder)
            .send({from : caller2, gas : 3000000 })
    } catch { return 'not roamer'; }

    return await target_contract.methods.getOwner()
        .call({from : caller2})
}
async function foundPet(caller, target_contract, pw) {
    try {
        await target_contract.methods.checkPassword(pw)
            .call({from : caller})
    } catch { return 'wrong password'; }

    try {
        await target_contract.methods.foundPet()
            .send({from : caller, gas : 3000000 })
    } catch { return 'not founder'; }
}
async function checkLost(caller, target_contract) {
    try {
        return await target_contract.methods.checkLost()
            .call({from : caller})
    } catch { return 'not roamer'; }
}
async function checkPassword(caller, target_contract, password) {
    await target_contract.methods.checkPassword(password)
        .call({from : caller})
}

server.listen(server_port, () => {
    console.log('FindMyRoamer server open');
})