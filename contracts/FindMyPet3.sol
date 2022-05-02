// SPDX-License-Identifier: UNLICENSED
// 
pragma solidity ^0.8.13;

contract FindMyPet3 {

    // for security
    uint private password;
    address private owner_addr;
    address private finder_addr;

    // lost condition
    bool private lost = false;

    // owner part
    struct Owner {
        string name;
        string location;
        uint phone;
    }
    Owner private owner;

    // pet part
    struct Pet {
        string name;
        uint age;

        string breed;
        string feature;

        string lost_location;
        uint prize;

    }
    Pet private pet;


    modifier OnlyOwner() {
        require(owner_addr == msg.sender);
        _;
    }

    constructor (uint _password, string memory _owner_name, string memory _owner_location, uint _owner_phone
    , string memory _pet_name, string memory _pet_breed, uint _pet_age, string memory _pet_feature) {

        password = _password;

        owner_addr = msg.sender;
        owner.name = _owner_name;
        owner.location = _owner_location;
        owner.phone = _owner_phone;

        pet.name = _pet_name;
        pet.breed = _pet_breed;
        pet.age = _pet_age;
        pet.feature = _pet_feature;
        pet.lost_location = "";
        pet.prize = 0;

    }

    function lostPet(uint _password, string memory _lost_location) payable public OnlyOwner {
        require(password == _password);
        require(lost == false);

        lost = true;
        pet.lost_location = _lost_location;
        pet.prize = msg.value;
    }
    function cancelLost(uint _password) public OnlyOwner {
        require(password == _password);
        require(lost == true);

        lost = false;
        pet.lost_location = "";
        pet.prize = 0;
    }

    function whosPet() public returns (Owner memory) {
        require(lost == true);
        finder_addr = msg.sender;

        return owner;
    }
    function foundPet(uint _password) payable public OnlyOwner {
        require(password == _password);

        payable(finder_addr).transfer(pet.prize);
    }

    function checkLost() public view returns (Pet memory) {
        require(lost == true);

        return pet;
    }

}