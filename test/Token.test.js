const Token = artifacts.require("./Token");
const chai = require("chai");
const BN = require("bn.js");
chai.use(require("chai-bn")(BN));
chai.use(require("chai-as-promised")).should();

contract("Token", ([deployer, receiver, exchange]) => {
  let token;
  const name = "Andyriles";
  const symbol = "ANDY";
  const decimals = new BN("18");
  const totalSupply = new BN("100000000000000000000000000");
  beforeEach(async () => {
    token = await Token.new();
  });
  describe("Deployment", () => {
    it("Should have a name", async () => {
      const result = await token.name();
      result.should.equal(name);
    });
    it("Should have a symbol", async () => {
      const result = await token.symbol();
      result.should.equal(symbol);
    });
    it("Should have decimal", async () => {
      const result = await token.decimals();
      result.should.be.a.bignumber.that.equals(decimals);
    });
    it("Should have correct total supply", async () => {
      const result = await token.totalSupply();
      result.should.be.a.bignumber.that.equals(totalSupply);
    });
    it("should assign total supply to deployer", async () => {
      const result = await token.balanceOf(deployer);
      result.should.be.a.bignumber.that.equals(totalSupply);
    });
  });

  describe("Sending ANDY", () => {
    let amount;
    let result;
    let remainder;
    describe("success", () => {
      beforeEach(async () => {
        amount = new BN("100000000000000000000");
        remainder = new BN("99999900000000000000000000");
        result = await token.transfer(receiver, amount, {
          from: deployer,
        });
      });
      it("transfers ANDYs", async () => {
        let balanceOf;
        //after transfer
        balanceOf = await token.balanceOf(deployer);
        balanceOf.should.bignumber.equal(remainder);
        balanceOf = await token.balanceOf(receiver);
        balanceOf.should.bignumber.equal(amount);
      });
      it("emits a transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.should.bignumber.equal(deployer);
        event.to.should.bignumber.equal(receiver);
        event.value.should.bignumber.equal(amount);
      });
    });
    describe("failure", () => {
      it("has insufficient balance", async () => {
        let invalidAmount = new BN("100000000000000000000000001"); //1 token greater than total supply
        let error = "Insufficient balance";
        await token
          .transfer(receiver, invalidAmount, {
            from: deployer,
          })
          .should.be.rejectedWith(error);
        //test for cases where sender does not have any token to send
        await token
          .transfer(deployer, invalidAmount, {
            from: receiver,
          })
          .should.be.rejectedWith(error);
      });
      //test for cases where address is invalid
      it("rejects invalid recipients", async () => {
        let invalidAddress = "0x0000000000000000000000000000000000000000";
        let error = "Invalid address";
        await token
          .transfer(invalidAddress, amount, {
            from: deployer,
          })
          .should.be.rejectedWith(error);
      });
    });
  });

  describe("Approving tokens", () => {
    let result;
    let amount;
    describe("success", () => {
      beforeEach(async () => {
        amount = new BN("100000000000000000000");
        result = await token.approve(exchange, amount, { from: deployer });
      });
      it("allocates allowance for spending on exchange", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.should.be.bignumber.equal(amount);
      });
      it("emits an approval event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Approval");
        const event = log.args;
        event.owner.should.equal(deployer);
        event.spender.should.equal(exchange);
        event.value.should.bignumber.equal(amount);
      });
    });
    describe("failure", () => {
      it("rejects invalid spenders", async () => {
        let invalidAddress = "0x0000000000000000000000000000000000000000";
        await token
          .approve(invalidAddress, amount, { from: deployer })
          .should.be.rejectedWith("Invalid address");
      });
    });
  });

  describe("exchanging ANDY", () => {
    let amount;
    let result;
    let remainder;
    //you need to approve the exchange to spend the tokens
    beforeEach(async () => {
      amount = new BN("100000000000000000000");
      await token.approve(exchange, amount, { from: deployer });
    });
    describe("success", () => {
      beforeEach(async () => {
        remainder = new BN("99999900000000000000000000");
        result = await token.transferFrom(deployer, receiver, amount, {
          from: exchange,
        });
      });
      it("transfers ANDYs", async () => {
        let balanceOf;
        //after transfer
        balanceOf = await token.balanceOf(deployer);
        balanceOf.should.bignumber.equal(remainder);
        balanceOf = await token.balanceOf(receiver);
        balanceOf.should.bignumber.equal(amount);
      });
      it("resets the allowance", async () => {
        const allowance = await token.allowance(deployer, exchange);
        allowance.should.be.bignumber.equal("0");
      });
      it("emits a transfer event", async () => {
        const log = result.logs[0];
        log.event.should.equal("Transfer");
        const event = log.args;
        event.from.should.bignumber.equal(deployer);
        event.to.should.bignumber.equal(receiver);
        event.value.should.bignumber.equal(amount);
      });
    });
    describe("failure", () => {
      it("has insufficient balance", async () => {
        let invalidAmount = new BN("100000000000000000000000001"); //1 token greater than total supply
        let error = "Insufficient balance";
        await token
          .transferFrom(deployer, receiver, invalidAmount, {
            from: exchange,
          })
          .should.be.rejectedWith(error);
      });
      //test for cases where address is invalid
      it("rejects invalid recipients", async () => {
        let invalidAddress = "0x0000000000000000000000000000000000000000";
        let error = "Invalid address";
        await token
          .transferFrom(deployer, invalidAddress, amount, {
            from: exchange,
          })
          .should.be.rejectedWith(error);
      });
    });
  });
});
