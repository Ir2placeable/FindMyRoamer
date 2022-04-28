// SPDX-License-Identifier: UNLICENSED
// 
pragma solidity ^0.8.13;

contract FindMyPet {
    owner pet_owner;
    pet my_pet;


    struct owner {
        string password;
        string name;
        string location;
        uint phone;
    }

    struct pet {
        owner master;
        string pet_name;
        string breed;
        string feature;
        uint age;
        bool lost;

        string qrcode;
    }

//    modifier OnlyOwner (){
//        require(msg.sender == pet_owner.id);
//        _;
//    }

    constructor (string memory _password, string memory owner_name, string memory owner_location, uint owner_phone) {
        pet_owner.password = _password;
        pet_owner.name = owner_name;
        pet_owner.location = owner_location;
        pet_owner.phone = owner_phone;
    }

    function registerPet(string memory pet_name, string memory pet_breed, string memory pet_feature, uint pet_age) public {
        my_pet.master = pet_owner;
        my_pet.pet_name = pet_name;
        my_pet.breed = pet_breed;
        my_pet.feature = pet_feature;
        my_pet.age = pet_age;
        my_pet.lost = false;
    }

    function getMyPet(string memory _password) public view returns(string memory) {
        require(pet_owner.password = _password);
        return my_pet.qrcode;
    }

    function lostPet() public OnlyOwner {
        require(my_pet.lost == false);
        my_pet.lost = true;
    }

    function findPet(string memory _qrcode) public OnlyOwner{
        require(keccak256(abi.encodePacked(my_pet.qrcode)) == keccak256(abi.encodePacked(_qrcode)));
        require(my_pet.lost == true);

        my_pet.lost = false;
    }

    function whosPet(string memory _qrcode) public view returns(owner memory){
        require(keccak256(abi.encodePacked(my_pet.qrcode)) == keccak256(abi.encodePacked(_qrcode)));
        require(my_pet.lost == true);

        return pet_owner;
    }


}