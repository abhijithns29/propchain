/**
 * ============================================================
 *  PropChain - Smart Contract Tests  (White-Box)
 *  Category  : Smart Contract Testing + Code-Level White Box
 *  Framework : Mocha + Chai (via Hardhat)  |  Ethers Engine
 *  Tools     : Hardhat, Ethers, Mocha, Chai
 *  Run with  : npm run test:contracts
 * ============================================================
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('LandRegistry Smart Contract - Blockchain Tests', function () {
  let LandRegistry;
  let landRegistry;
  let owner, admin, user1, user2;

  beforeEach(async function () {
    [owner, admin, user1, user2] = await ethers.getSigners();
    LandRegistry = await ethers.getContractFactory('LandRegistry');
    landRegistry = await LandRegistry.deploy();
    await landRegistry.deployed();
    await landRegistry.addAdmin(admin.address);
  });

  // ─── 1. Deployment & Admin Roles ──────────────────────────
  describe('1. Contract Deployment & Admin Roles', function () {

    it('TC-SC-01: should set deployer as contract owner', async function () {
      expect(await landRegistry.owner()).to.equal(owner.address);
    });

    it('TC-SC-02: should set deployer as admin automatically', async function () {
      expect(await landRegistry.admins(owner.address)).to.equal(true);
    });

    it('TC-SC-03: should add secondary admin via addAdmin()', async function () {
      expect(await landRegistry.admins(admin.address)).to.equal(true);
    });

    it('TC-SC-04: regular users must NOT have admin privileges', async function () {
      expect(await landRegistry.admins(user1.address)).to.equal(false);
    });

    it('TC-SC-05: only owner can add admin — non-owner should revert', async function () {
      await expect(
        landRegistry.connect(user1).addAdmin(user2.address)
      ).to.be.revertedWith('Only contract owner can perform this action');
    });

    it('TC-SC-06: owner can remove admin role', async function () {
      await landRegistry.connect(owner).removeAdmin(admin.address);
      expect(await landRegistry.admins(admin.address)).to.equal(false);
    });
  });

  // ─── 2. Property Registration ──────────────────────────────
  describe('2. Property Registration', function () {

    it('TC-SC-07: admin can register a property with correct data', async function () {
      const ipfsHash  = 'QmTest123PropChain';
      const location  = '14 Gandhi Nagar, Chennai, TN';
      const size      = 2400;
      const valuation = ethers.utils.parseEther('120');

      await landRegistry.connect(admin).registerProperty(
        user1.address, ipfsHash, location, size, valuation
      );

      const property = await landRegistry.getProperty(1);
      expect(property.owner).to.equal(user1.address);
      expect(property.location).to.equal(location);
      expect(property.size).to.equal(size);
      expect(property.valuation).to.equal(valuation);
      expect(property.isVerified).to.equal(true);
      expect(property.status).to.equal(0); // AVAILABLE
    });

    it('TC-SC-08: property counter increments on each registration', async function () {
      await landRegistry.connect(admin).registerProperty(
        user1.address, 'Hash1', 'Loc1', 100, ethers.utils.parseEther('10')
      );
      await landRegistry.connect(admin).registerProperty(
        user2.address, 'Hash2', 'Loc2', 200, ethers.utils.parseEther('20')
      );
      expect(await landRegistry.propertyCounter()).to.equal(2);
    });

    it('TC-SC-09: PropertyRegistered event is emitted on registration', async function () {
      await expect(
        landRegistry.connect(admin).registerProperty(
          user1.address, 'QmEvt', 'EventLocation', 500, ethers.utils.parseEther('5')
        )
      ).to.emit(landRegistry, 'PropertyRegistered');
    });

    it('TC-SC-10: non-admin cannot register a property', async function () {
      await expect(
        landRegistry.connect(user1).registerProperty(
          user1.address, 'hash', 'loc', 100, 1000
        )
      ).to.be.revertedWith('Only admin can perform this action');
    });

    it('TC-SC-11: registered property is added to owners property list', async function () {
      await landRegistry.connect(admin).registerProperty(
        user1.address, 'QmHash', 'Location', 1000, ethers.utils.parseEther('50')
      );
      const ownedIds = await landRegistry.getOwnerProperties(user1.address);
      expect(ownedIds.map(id => id.toString())).to.include('1');
    });
  });

  // ─── 3. Property Sale & Ownership Transfer ────────────────
  describe('3. Property Sale & Ownership Transfer', function () {

    beforeEach(async function () {
      await landRegistry.connect(admin).registerProperty(
        user1.address, 'QmSale', 'SaleLocation', 1000,
        ethers.utils.parseEther('50')
      );
    });

    it('TC-SC-12: property owner can initiate a sale transaction', async function () {
      const saleAmount = ethers.utils.parseEther('65');
      await landRegistry.connect(user1).initiateTransaction(
        1, user2.address, 1, saleAmount
      );

      const txns = await landRegistry.getPropertyTransactions(1);
      expect(txns.length).to.equal(2); // registration + sale
      expect(txns[1].from).to.equal(user1.address);
      expect(txns[1].to).to.equal(user2.address);
      expect(txns[1].amount).to.equal(saleAmount);
      expect(txns[1].isApproved).to.equal(false);
    });

    it('TC-SC-13: non-owner non-admin cannot initiate a transaction', async function () {
      await expect(
        landRegistry.connect(user2).initiateTransaction(
          1, user2.address, 1, ethers.utils.parseEther('10')
        )
      ).to.be.revertedWith('Only property owner or admin can initiate transaction');
    });

    it('TC-SC-14: admin approval transfers ownership to buyer', async function () {
      await landRegistry.connect(user1).initiateTransaction(
        1, user2.address, 1, ethers.utils.parseEther('60')
      );
      await landRegistry.connect(admin).approveTransaction(1, 1, 'CertHash-SALE-001');

      const property = await landRegistry.getProperty(1);
      expect(property.owner).to.equal(user2.address);

      const user1Props = (await landRegistry.getOwnerProperties(user1.address)).map(id => id.toString());
      const user2Props = (await landRegistry.getOwnerProperties(user2.address)).map(id => id.toString());
      expect(user1Props).to.not.include('1');
      expect(user2Props).to.include('1');
    });

    it('TC-SC-15: OwnershipTransferred event is emitted on approval', async function () {
      await landRegistry.connect(user1).initiateTransaction(
        1, user2.address, 1, ethers.utils.parseEther('60')
      );
      await expect(
        landRegistry.connect(admin).approveTransaction(1, 1, 'CertHash-EVT')
      ).to.emit(landRegistry, 'OwnershipTransferred')
        .withArgs(1, user1.address, user2.address);
    });

    it('TC-SC-16: double-approval of same transaction should revert', async function () {
      await landRegistry.connect(user1).initiateTransaction(
        1, user2.address, 1, ethers.utils.parseEther('60')
      );
      await landRegistry.connect(admin).approveTransaction(1, 1, 'CertHash-X');
      await expect(
        landRegistry.connect(admin).approveTransaction(1, 1, 'CertHash-DUPE')
      ).to.be.revertedWith('Transaction already approved');
    });
  });

  // ─── 4. Rent Transactions ─────────────────────────────────
  describe('4. Rent Transactions', function () {

    beforeEach(async function () {
      await landRegistry.connect(admin).registerProperty(
        user1.address, 'QmRent', 'RentLocation', 800,
        ethers.utils.parseEther('30')
      );
    });

    it('TC-SC-17: rent transaction sets property status to RENTED', async function () {
      await landRegistry.connect(user1).initiateTransaction(
        1, user2.address, 2, ethers.utils.parseEther('2') // type 2 = RENT
      );
      await landRegistry.connect(admin).approveTransaction(1, 1, 'RentCert-001');

      const property = await landRegistry.getProperty(1);
      expect(property.status).to.equal(4); // RENTED enum value
    });

    it('TC-SC-18: rent does NOT transfer ownership', async function () {
      await landRegistry.connect(user1).initiateTransaction(
        1, user2.address, 2, ethers.utils.parseEther('2')
      );
      await landRegistry.connect(admin).approveTransaction(1, 1, 'RentCert-002');

      const property = await landRegistry.getProperty(1);
      expect(property.owner).to.equal(user1.address); // owner unchanged
    });
  });

  // ─── 5. Property Status Management ───────────────────────
  describe('5. Property Status Management', function () {

    beforeEach(async function () {
      await landRegistry.connect(admin).registerProperty(
        user1.address, 'QmStatus', 'StatusLoc', 600,
        ethers.utils.parseEther('40')
      );
    });

    it('TC-SC-19: owner can update property status to FOR_SALE', async function () {
      await landRegistry.connect(user1).updatePropertyStatus(1, 1); // FOR_SALE
      const prop = await landRegistry.getProperty(1);
      expect(prop.status).to.equal(1);
    });

    it('TC-SC-20: unauthorized user cannot update property status', async function () {
      await expect(
        landRegistry.connect(user2).updatePropertyStatus(1, 1)
      ).to.be.revertedWith('Not authorized');
    });

    it('TC-SC-21: getProperty reverts for non-existent property ID', async function () {
      await expect(
        landRegistry.getProperty(999)
      ).to.be.revertedWith('Property does not exist');
    });
  });
});
