// SPDX-License-Identifier: UNLICENSED
// 
pragma solidity ^0.8.13;

contract FindMyPet2 {

    uint private password;

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
        string breed;
        uint age;
        string feature;
    }
    Pet private pet;

    // lost condition
    bool private lost = false;
    string private lost_location;

    constructor (uint _password, string memory _owner_name, string memory _owner_location, uint _owner_phone
    , string memory _pet_name, string memory _pet_breed, uint _pet_age, string memory _pet_feature) {
        password = _password;
        owner.name = _owner_name;
        owner.location = _owner_location;
        owner.phone = _owner_phone;

        pet.name = _pet_name;
        pet.breed = _pet_breed;
        pet.age = _pet_age;
        pet.feature = _pet_feature;
    }

    function lostPet(uint _password, string memory _lost_location) public {
        require(password == _password);
        require(lost == false);

        lost = true;
        lost_location = _lost_location;
    }

    function foundPet() public view returns (Owner memory) {
        require(lost == true);

        return owner;
    }

    function cancelLost(uint _password) public {
        require(password == _password);
        require(lost == true);

        lost = false;
        lost_location = "";
    }

    function checkLost() public view returns (Pet memory) {
        require(lost == true);

        return pet;
    }

}