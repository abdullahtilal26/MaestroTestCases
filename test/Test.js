const { expect } = require("chai");
// const { ethers } = require("ethers");
const { ethers } = require("hardhat");

const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("Test Cases for Individual Limit of each List", function () {
  // this.timeout(120000);
  let data = {};
  const whiteListO = [];
  const whiteListL = [];
  const whiteListOWallet = [];
  const whiteListLWallet = [];
  before(async function () {
    const [address1] = await ethers.getSigners();

    //GENERATING OG ACCOUNTS
    for (let i = 0; i < 10; i++) {
      let wallet = await ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await address1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });

      whiteListOWallet.push(wallet);
      whiteListO.push(wallet.address);
      // console.log(wallet.address, "++++");
    }

    //GENERATING WL ACCOUNTS
    for (let i = 0; i < 10; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await address1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });

      whiteListLWallet.push(wallet);
      whiteListL.push(wallet.address);
      // console.log(wallet.address, "---------");
    }

    const leafNodesO = whiteListO.map((addr) => keccak256(addr));
    const leafNodesL = whiteListL.map((addr) => keccak256(addr));

    const merkleTreeO = new MerkleTree(leafNodesO, keccak256, {
      sortPairs: true,
    });
    const merkleTreeL = new MerkleTree(leafNodesL, keccak256, {
      sortPairs: true,
    });

    const rootHashO = merkleTreeO.getRoot();
    const rootHashL = merkleTreeL.getRoot();

    const merkleProofO = leafNodesO.map((addr) =>
      merkleTreeO.getHexProof(addr)
    );
    // console.log(leafNodesO);
    // console.log("------------merkle tree\n", merkleTreeO);
    // console.log("------------merkle tree\n", merkleTreeO.toString());
    // console.log("------------root\n", rootHashO.toString("hex"));
    // console.log(
    //   "------------proof\n",
    //   // merkleProofO,
    //   merkleTreeO.getHexProof(leafNodesO[1])
    // );

    data["OG ROOT HASH"] = "0x" + rootHashO.toString("hex");
    data["WL ROOT HASH"] = "0x" + rootHashL.toString("hex");

    data["OG_PROOFS"] = {};
    data["WL_PROOFS"] = {};

    leafNodesO.map((ogLeafNode, key) => {
      data["OG_PROOFS"][whiteListO[key]] = merkleTreeO.getHexProof(ogLeafNode);
    });

    leafNodesL.map((wlLeafNode, key) => {
      data["WL_PROOFS"][whiteListL[key]] = merkleTreeL.getHexProof(wlLeafNode);
    });

    // console.log(
    //   merkleTreeO.verify(
    //     merkleTreeO.getHexProof(leafNodesO[0]),
    //     rootHashO.toString("hex"),
    //     keccak256("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4")
    //   )
    // );
  });

  it("Donot Excede the free per wallet limit of public sale", async function () {
    const publicAccount = [];
    const [addr1] = await ethers.getSigners();
    for (let i = 0; i < 1; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await addr1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });
      publicAccount.push(wallet);
      // console.log(wallet.address, "---------");
    }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract.connect(publicAccount[i]).PublicMint(1);
    }
    expect(await contract.balanceOf(publicAccount[0].address)).to.equal(1);
    console.log();
  });

  it("Excede the free per wallet limit of public sale with 0.001 ether ", async function () {
    const acc = await ethers.getSigners();
    const publicAccount = [];
    const [addr1] = await ethers.getSigners();
    for (let i = 0; i < 1; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await addr1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });
      publicAccount.push(wallet);
    }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(publicAccount[i])
        .PublicMint(3, { value: ethers.utils.parseEther("0.001").toString() });
    }
    expect(await contract.publicFreeMinted()).to.equal(2);
    expect(await contract.balanceOf(publicAccount[0].address)).to.equal(3);
    console.log();
  });

  it("Excede the free per wallet limit of public sale with 0 ether", async function () {
    const acc = await ethers.getSigners();
    const publicAccount = [];
    const [addr1] = await ethers.getSigners();
    for (let i = 0; i < 1; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await addr1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });
      publicAccount.push(wallet);
    }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(publicAccount[i])
        .PublicMint(3, { value: ethers.utils.parseEther("0.001").toString() });
    }
    await expect(
      contract.connect(publicAccount[0]).PublicMint(1)
    ).to.be.revertedWith("Insuffiecient funds transfered");

    console.log();
  });

  it("Excede the total per wallet limit of public sale", async function () {
    const acc = await ethers.getSigners();
    const publicAccount = [];
    const [addr1] = await ethers.getSigners();
    for (let i = 0; i < 1; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await addr1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });
      publicAccount.push(wallet);
    }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(publicAccount[i])
        .PublicMint(10, { value: ethers.utils.parseEther("0.008").toString() });
    }
    await expect(
      contract
        .connect(publicAccount[0])
        .PublicMint(1, { value: ethers.utils.parseEther("0.001").toString() })
    ).to.be.revertedWith("Max lmit of tokens exceeded");
  });

  // //   ------------------------------
  it("Donot Excede the free per wallet limit of OG", async function () {
    // const acc = await ethers.getSigners();
    // const publicAccount = [];
    // const publicAccountAddress = [];
    // const [addr1] = await ethers.getSigners();
    // for (let i = 0; i < 1; i++) {
    //   let wallet = ethers.Wallet.createRandom();
    //   // add the provider from Hardhat
    //   wallet = wallet.connect(ethers.provider);
    //   await addr1.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("1"),
    //   });
    //   publicAccount.push(wallet);
    //   publicAccountAddress.push(wallet.address);
    // }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(whiteListOWallet[i])
        .OGMint(4, data["OG_PROOFS"][whiteListO[i]]);
    }
    expect(await contract.balanceOf(whiteListOWallet[0].address)).to.equal(4);
  });

  it("Excede the free per wallet limit of OG with 0.001 ether ", async function () {
    // const acc = await ethers.getSigners();
    // const publicAccount = [];
    // const publicAccountAddress = [];
    // const [addr1] = await ethers.getSigners();
    // for (let i = 0; i < 1; i++) {
    //   let wallet = ethers.Wallet.createRandom();
    //   // add the provider from Hardhat
    //   wallet = wallet.connect(ethers.provider);
    //   await addr1.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("1"),
    //   });
    //   publicAccount.push(wallet);
    //   publicAccountAddress.push(wallet.address);
    // }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(whiteListOWallet[i])
        .OGMint(5, data["OG_PROOFS"][whiteListO[i]], {
          value: ethers.utils.parseEther("0.001").toString(),
        });
    }
    expect(await contract.OGMinted()).to.equal(4);
    expect(await contract.balanceOf(whiteListOWallet[0].address)).to.equal(5);
    console.log();
  });

  it("Excede the free per wallet limit of OG with 0 ether", async function () {
    // const acc = await ethers.getSigners();
    // const publicAccount = [];
    // const publicAccountAddress = [];
    // const [addr1] = await ethers.getSigners();
    // for (let i = 0; i < 1; i++) {
    //   let wallet = ethers.Wallet.createRandom();
    //   // add the provider from Hardhat
    //   wallet = wallet.connect(ethers.provider);
    //   await addr1.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("1"),
    //   });
    //   publicAccount.push(wallet);
    //   publicAccountAddress.push(wallet.address);
    // }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(whiteListOWallet[i])
        .OGMint(4, data["OG_PROOFS"][whiteListO[i]]);
    }
    await expect(
      contract
        .connect(whiteListOWallet[0])
        .OGMint(1, data["OG_PROOFS"][whiteListO[0]])
    ).to.be.revertedWith("Insuffiecient funds transfered");

    console.log();
  });

  it("Excede the total per wallet limit of OG", async function () {
    // const acc = await ethers.getSigners();
    // const publicAccount = [];
    // const publicAccountAddress = [];
    // const [addr1] = await ethers.getSigners();
    // for (let i = 0; i < 1; i++) {
    //   let wallet = ethers.Wallet.createRandom();
    //   // add the provider from Hardhat
    //   wallet = wallet.connect(ethers.provider);
    //   await addr1.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("1"),
    //   });
    //   publicAccount.push(wallet);
    //   publicAccountAddress.push(wallet.address);
    // }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(whiteListOWallet[i])
        .OGMint(10, data["OG_PROOFS"][whiteListO[i]], {
          value: ethers.utils.parseEther("0.006").toString(),
        });
    }
    await expect(
      contract
        .connect(whiteListOWallet[0])
        .OGMint(1, data["OG_PROOFS"][whiteListO[0]], {
          value: ethers.utils.parseEther("0.001").toString(),
        })
    ).to.be.revertedWith("Max lmit of tokens exceeded");
  });
  // // ---------------------------------------- WL-----------------
  it("Donot Excede the free per wallet limit of WL", async function () {
    // const acc = await ethers.getSigners();
    // const publicAccount = [];
    // const publicAccountAddress = [];
    // const [addr1] = await ethers.getSigners();
    // for (let i = 0; i < 1; i++) {
    //   let wallet = ethers.Wallet.createRandom();
    //   // add the provider from Hardhat
    //   wallet = wallet.connect(ethers.provider);
    //   await addr1.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("1"),
    //   });
    //   publicAccount.push(wallet);
    //   publicAccountAddress.push(wallet.address);
    // }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(whiteListLWallet[i])
        .WLMint(3, data["WL_PROOFS"][whiteListL[i]]);
    }
    expect(await contract.balanceOf(whiteListLWallet[0].address)).to.equal(3);
    console.log();
  });

  it("Excede the free per wallet limit of WL with 0 ether", async function () {
    // const acc = await ethers.getSigners();
    // const publicAccount = [];
    // const publicAccountAddress = [];
    // const [addr1] = await ethers.getSigners();
    // for (let i = 0; i < 1; i++) {
    //   let wallet = ethers.Wallet.createRandom();
    //   // add the provider from Hardhat
    //   wallet = wallet.connect(ethers.provider);
    //   await addr1.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.utils.parseEther("1"),
    //   });
    //   publicAccount.push(wallet);
    //   publicAccountAddress.push(wallet.address);
    // }
    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 1; i++) {
      await contract
        .connect(whiteListLWallet[i])
        .WLMint(3, data["WL_PROOFS"][whiteListL[i]]);
    }
    await expect(
      contract
        .connect(whiteListLWallet[0])
        .WLMint(1, data["WL_PROOFS"][whiteListL[0]])
    ).to.be.revertedWith("Insuffiecient funds transfered");

    console.log();
  });

  // it("Excede the total imit of WL", async function () {
  //   // const acc = await ethers.getSigners();
  //   // const publicAccount = [];
  //   // const publicAccountAddress = [];
  //   // const [addr1] = await ethers.getSigners();
  //   // for (let i = 0; i < 1; i++) {
  //   //   let wallet = ethers.Wallet.createRandom();
  //   //   // add the provider from Hardhat
  //   //   wallet = wallet.connect(ethers.provider);
  //   //   await addr1.sendTransaction({
  //   //     to: wallet.address,
  //   //     value: ethers.utils.parseEther("1"),
  //   //   });
  //   //   publicAccount.push(wallet);
  //   //   publicAccountAddress.push(wallet.address);
  //   // }

  //   const TestContract = await ethers.getContractFactory("MaestrosMix");
  //   const contract = await TestContract.deploy(
  //     "a",
  //     "A",
  //     "B",
  //     "C",
  //     data["OG ROOT HASH"],
  //     data["WL ROOT HASH"]
  //   );

  //   //   for (let i = 0; i < 1; i++) {
  //   //     await contract.connect(whiteListLWallet[i]).WLMint(10,);
  //   //   }
  //   //   expect(
  //   //     await contract.balanceOf(whiteListLWallet[0].address)
  //   //   ).to.be.revertedWith("Max lmit of tokens exceeded for Whitelists");
  //   // });

  //   for (let i = 0; i < 10; i++) {
  //     await contract
  //       .connect(whiteListLWallet[i])
  //       .WLMint(1, data["WL_PROOFS"][whiteListL[i]]);
  //   }
  //   expect(await contract.WLMinted()).to.equal(10);
  //   console.log();
  // });

  //   it("Excede the limit of whitelist sale", async function () {
  //     const acc = await ethers.getSigners();
  //     const whiteListAccounts = [];
  //     const whiteListAccountsAddr = [];
  //     const [addr1] = await ethers.getSigners();
  //     for (let i = 0; i < 251; i++) {
  //       let wallet = ethers.Wallet.createRandom();
  //       // add the provider from Hardhat
  //       wallet = wallet.connect(ethers.provider);
  //       await addr1.sendTransaction({
  //         to: wallet.address,
  //         value: ethers.utils.parseEther("1"),
  //       });
  //       whiteListAccounts.push(wallet);
  //       whiteListAccountsAddr.push(wallet.address);
  //     }

  //     const TestContract = await ethers.getContractFactory("NFTA");
  //     const contract = await TestContract.deploy(
  //       "a",
  //       "A",
  //       "B",
  //       "C",
  //       whiteListAccountsAddr,
  //       []
  //     );

  //     for (let i = 0; i < 251; i++) {
  //       await contract.connect(whiteListAccounts[i]).preSaleMint(2);
  //     }
  //     expect(await contract.whitelistFreeMinted()).to.throw(new Error());
  //     console.log();
  //   });
});

describe("Test Cases for Overall Limit of each list", function () {
  let data = {};
  const whiteListO = [];
  const whiteListL = [];
  const whiteListOWallet = [];
  const whiteListLWallet = [];

  before(async function () {
    const [address1] = await ethers.getSigners();

    //GENERATING OG ACCOUNTS
    for (let i = 0; i < 10; i++) {
      let wallet = await ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await address1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });

      whiteListOWallet.push(wallet);
      whiteListO.push(wallet.address);
      // console.log(wallet.address, "++++");
    }

    //GENERATING WL ACCOUNTS
    for (let i = 0; i < 10; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await address1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });

      whiteListLWallet.push(wallet);
      whiteListL.push(wallet.address);
      // console.log(wallet.address, "---------");
    }

    const leafNodesO = whiteListO.map((addr) => keccak256(addr));
    const leafNodesL = whiteListL.map((addr) => keccak256(addr));

    const merkleTreeO = new MerkleTree(leafNodesO, keccak256, {
      sortPairs: true,
    });
    const merkleTreeL = new MerkleTree(leafNodesL, keccak256, {
      sortPairs: true,
    });

    const rootHashO = merkleTreeO.getRoot();
    const rootHashL = merkleTreeL.getRoot();

    const merkleProofO = leafNodesO.map((addr) =>
      merkleTreeO.getHexProof(addr)
    );
    // console.log(leafNodesO);
    // console.log("------------merkle tree\n", merkleTreeO);
    // console.log("------------merkle tree\n", merkleTreeO.toString());
    // console.log("------------root\n", rootHashO.toString("hex"));
    // console.log(
    //   "------------proof\n",
    //   // merkleProofO,
    //   merkleTreeO.getHexProof(leafNodesO[1])
    // );

    data["OG ROOT HASH"] = "0x" + rootHashO.toString("hex");
    data["WL ROOT HASH"] = "0x" + rootHashL.toString("hex");

    data["OG_PROOFS"] = {};
    data["WL_PROOFS"] = {};

    leafNodesO.map((ogLeafNode, key) => {
      data["OG_PROOFS"][whiteListO[key]] = merkleTreeO.getHexProof(ogLeafNode);
    });

    leafNodesL.map((wlLeafNode, key) => {
      data["WL_PROOFS"][whiteListL[key]] = merkleTreeL.getHexProof(wlLeafNode);
    });

    // console.log(
    //   merkleTreeO.verify(
    //     merkleTreeO.getHexProof(leafNodesO[0]),
    //     rootHashO.toString("hex"),
    //     keccak256("0x5B38Da6a701c568545dCfcB03FcB875f56beddC4")
    //   )
    // );
  });

  it("Donot Excede the limit of public sale", async function () {
    const acc = await ethers.getSigners();
    const whiteListAccounts = [];
    const [addr1] = await ethers.getSigners();
    for (let i = 0; i < 10; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await addr1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });
      whiteListAccounts.push(wallet);
    }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 10; i++) {
      await contract.connect(whiteListAccounts[i]).PublicMint(1);
    }
    expect(await contract.publicFreeMinted()).to.equal(10);
    console.log();
  });

  it("Excede the limit of public sale", async function () {
    const acc = await ethers.getSigners();
    const whiteListAccounts = [];
    const [addr1] = await ethers.getSigners();
    for (let i = 0; i < 11; i++) {
      let wallet = ethers.Wallet.createRandom();
      // add the provider from Hardhat
      wallet = wallet.connect(ethers.provider);
      await addr1.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1"),
      });
      whiteListAccounts.push(wallet);
    }

    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 10; i++) {
      await contract.connect(whiteListAccounts[i]).PublicMint(1);
    }

    await expect(
      contract.connect(whiteListAccounts[10]).PublicMint(1)
    ).to.be.revertedWith("Insuffiecient funds transfered");
    // .to.throw(
    //   new Error(
    //     "VM Exception while processing transaction: reverted with reason string 'Insuffiecient funds transfered'"
    //   )
    // );
  });

  it("Donot Excede the limit of OG", async function () {
    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 10; i++) {
      await contract
        .connect(whiteListOWallet[i])
        .OGMint(1, data["OG_PROOFS"][whiteListO[i]]);
    }
    expect(await contract.OGMinted()).to.equal(10);
  });

  it("Excede the limit of OG", async function () {
    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 5; i++) {
      await contract
        .connect(whiteListOWallet[i])
        .OGMint(2, data["OG_PROOFS"][whiteListO[i]]);
    }
    await expect(
      contract
        .connect(whiteListOWallet[5])
        .OGMint(1, data["OG_PROOFS"][whiteListO[5]])
    ).to.be.revertedWith("Insuffiecient funds transfered");
    console.log();
  });
  // // --------------------------
  it("Donot Excede the limit of WL", async function () {
    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 5; i++) {
      await contract
        .connect(whiteListLWallet[i])
        .WLMint(2, data["WL_PROOFS"][whiteListL[i]]);
    }
    expect(await contract.WLMinted()).to.equal(10);
    console.log();
  });

  it("Excede the limit of WL", async function () {
    const TestContract = await ethers.getContractFactory("MaestrosMix");
    const contract = await TestContract.deploy(
      "a",
      "A",
      "B",
      "C",
      data["OG ROOT HASH"],
      data["WL ROOT HASH"]
    );

    for (let i = 0; i < 5; i++) {
      await contract
        .connect(whiteListLWallet[i])
        .WLMint(2, data["WL_PROOFS"][whiteListL[i]]);
    }
    await expect(
      contract
        .connect(whiteListLWallet[5])
        .WLMint(2, data["WL_PROOFS"][whiteListL[5]])
    ).to.be.revertedWith("Insuffiecient funds transfered");
    console.log();
  });
});
