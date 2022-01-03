// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Token{
    string public name="Andyriles";
    string public symbol="ANDY";
    uint256 public decimals=18;
    uint256 public totalSupply;
    mapping(address=>uint256) public balanceOf;
    //map address of approver to all the exchanges that have taken place
    //second address is the address of the exchange
    mapping(address=>mapping(address=>uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        totalSupply=100000000*(10**decimals);
        balanceOf[msg.sender]=totalSupply;
    }
    function transfer(address _to, uint256 _value) public returns (bool success){
         require(balanceOf[msg.sender]>=_value, "Insufficient balance");
         _transfer(msg.sender, _to, _value);
            return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal{
        require(_to != address(0), "Invalid address");
        balanceOf[_from]-=_value;
            balanceOf[_to]+=_value;
            emit Transfer(_from,_to,_value);
    }
    //allow exchange of tokens
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
        require(balanceOf[_from]>=_value, "Insufficient balance");
        require(allowance[_from][msg.sender]>=_value, "Insufficient allowance");
        allowance[_from][msg.sender]-=_value;
        _transfer(_from, _to, _value);
        return true;
    }

    //approve the exchange of tokens
    function approve(address _spender, uint256 _value) public returns (bool success){
        require(_spender != address(0), "Invalid address"); 
        require(_value>0, "Invalid value");
        allowance[msg.sender][_spender]=_value;
        emit Approval(msg.sender,_spender,_value);
        return true;
    }
}