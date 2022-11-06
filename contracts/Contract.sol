//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Strings.sol";
import "../node_modules/@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ERC721A.sol";

/// @title Mestro's Mix Test
/// @author Adam Bawany
contract MaestrosMix is ERC721A, Ownable {

    using Strings for uint256;
    
    bool public paused = false; 
    bool public revealed = false;
    bool public pauseOG = false; //To pause only OG
    bool public pauseWL = false; //To pause only WL
    bool public pausePublicSale = false; //To pause only public
    
    uint8 public maxMintAmountPerWallet = 10; //Max Limit per Wallet
    uint8 public maxOGFreePerWallet =4; //Max Free mint for WL
    uint8 public maxWLFreePerWallet =3; //Max Limit per Wallet for WL
    uint8 public maxPublicFreePerWallet =2; //Max Free mint for WL
    
    uint256 public cost = 0.0001 ether;
    uint256 public maxSupply = 75;

    uint256 public OGMinted=0;
    uint256 public WLMinted=0;
    uint256 public publicFreeMinted=0;
    uint256 public paidMinted=0;

    uint256 public totalOGLimit=10;
    uint256 public totalWLLimit=10;
    uint256 public totalPublicFreeLimit=10;
    uint256 public totalPaidLimit=40;

    string private baseURI;
    string public baseExtension = ".json";
    string private notRevealedUri;

     enum MintType{ OG, WL, Public }

    mapping(address => uint8) tokensMintedPerWallet;

    bytes32 OGRoot;
    bytes32 WLRoot;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedUri,
        bytes32 _OGRoot,
        bytes32 _WLRoot
    ) ERC721A(_name, _symbol) {
        setBaseURI(_initBaseURI);
        setNotRevealedURI(_initNotRevealedUri);
        OGRoot=_OGRoot;
        WLRoot=_WLRoot;
        _safeMint(msg.sender, 5);
    }

    ///@notice some common conditions for public and pre sale that needs to be true like minting is not paused,amount to mint is greater than 0,supply dont exceed more than the total supply and sender dont exceed the max mint amount set
    ///@dev this modifier needs to be added on every function thats going to mint tokens
    ///@param _mintAmount is the amount to mint tokens
    modifier preConditions(uint8 _mintAmount) {
        require(!paused,"Minting is currently paused");
        require(_mintAmount > 0,"Mint amount should be greater than 0");
        require(totalSupply() + _mintAmount <= maxSupply,"Insuffiecient tokens available");
        require(_mintAmount+ tokensMintedPerWallet[msg.sender] <= maxMintAmountPerWallet,"Max lmit of tokens exceeded");
        _;
    }
    
    ///@notice it is the helper mint function which cheks if the mint amount is less than free mint available then it mint wwithout charges.Otherwise it calculates mint amount that need to be charged,alculate and verify the charges and then mint the tokens
    ///@dev  if the mint amount is less than free mint available,then we mint without checking the amount.Otherwise we first calculate how many tokens need to be minted are paid,then checkes the amount send by the minter and then mints the tokens
    ///@param _mintAmount is the number of tokens to mint,senderAmount is the amount send by minter while minting,freeMintAvailable is the number of free tokens that are left for the specified addresss.
    function mint(
        uint8 _mintAmount,
        uint256 senderAmount,
        uint256 freeMintAvailable,
        MintType mintType 
    ) private {
         if (_mintAmount <= freeMintAvailable) {

             if(mintType==MintType.OG){
                // whitelistFreeMinted=whitelistFreeMinted+_mintAmount;
                OGMinted=OGMinted+_mintAmount;
             }
             else if(mintType==MintType.WL){
                //  whitelistFreeMinted=whitelistFreeMinted+_mintAmount;
                 WLMinted=WLMinted+_mintAmount;
             }
             else{
                 publicFreeMinted=publicFreeMinted+_mintAmount;
             }

            _safeMint(msg.sender, _mintAmount);
            tokensMintedPerWallet[msg.sender]+=_mintAmount;
           
           

        } else {

           
            if(mintType==MintType.OG){
                // whitelistFreeMinted=whitelistFreeMinted+freeMintAvailable;
                 OGMinted=OGMinted+freeMintAvailable;
            }
            else if(mintType==MintType.WL){
                // whitelistFreeMinted=whitelistFreeMinted+freeMintAvailable;
                WLMinted=WLMinted+freeMintAvailable;
            }
             else{
                 publicFreeMinted=publicFreeMinted+freeMintAvailable;
             }
             

            uint256 paidMint = _mintAmount - freeMintAvailable;
            require(senderAmount >= paidMint * cost,"Insuffiecient funds transfered");
            require(paidMinted+paidMint<=totalPaidLimit,"paid limit is exceded");
            _safeMint(msg.sender, _mintAmount);
            tokensMintedPerWallet[msg.sender]+=_mintAmount;
            paidMinted=paidMinted+paidMint;
           
        }
    }

    ///@notice It returns the number of free mint available for the specific address depending on the type of mint such as pre sale and public sale
    ///@dev It is used to calculate the number of free token available for the specific address.It is used as we have different number of free mints for different whitelisting and public sale.
    ///@param maxFreeMintAmount is the maximum amount of tokens available to mint free.
    ///@return it returns the number of free tokens available to mint,in type uint256, for the senders address.
    function getFreeMintAvailableAmount(uint256 maxFreeMintAmount,MintType mintTpe)
        private
        view
        returns (uint256)
    {
        uint256 currentMintAmount = tokensMintedPerWallet[msg.sender];
        if (maxFreeMintAmount > currentMintAmount) {
            uint256 freeMintAvailable=maxFreeMintAmount - currentMintAmount;
            if((mintTpe==MintType.OG&&OGMinted<totalOGLimit)){
                
                if(freeMintAvailable<totalOGLimit-OGMinted){
                    return freeMintAvailable;
                }
                else{
                    return(totalOGLimit-OGMinted);
                }
                    
            }
            else if((mintTpe==MintType.WL&&WLMinted<totalWLLimit)){
                
                if(freeMintAvailable<totalWLLimit-WLMinted){
                    return freeMintAvailable;
                }
                else{
                    return(totalWLLimit-WLMinted);
                }
                    
            }
            else if((mintTpe==MintType.Public&&publicFreeMinted<totalPublicFreeLimit)){

                if(freeMintAvailable<totalPublicFreeLimit-publicFreeMinted){
                    return freeMintAvailable;
                }
                else{
                    return(totalPublicFreeLimit-publicFreeMinted);
                }
            }
            else{
                return 0;
            }
            
        } else {
            return 0;
        }
    }

    /// @notice It is use to allow mint for the adresses added in whitelist
    /// @dev Since we have two whitelist,we calculate there free mint avialble depending on the whitelist and call the private mint function.Cannot break further as free mints are variable to type of sale
    /// @param _mintAmount is the quantity of tocken to mint
    function OGMint(uint8 _mintAmount,bytes32[] calldata proof) preConditions(_mintAmount) public payable {
       
        require(!pauseOG,"Pre sale OG is not active currently");

        // uint256 ownerTokenCount = tokensMintedPerWallet[msg.sender];
        // require(_mintAmount+ownerTokenCount<= nftPerAddressLimitO,"Max lmit of tokens exceeded for Whitelists");

        require(isWalletOG(msg.sender,proof),"This Adresses is not whitelisted, You can Mint Maestro's Mix in Public Sale");
        // if (isWhiteListedO(msg.sender)) {
            // require(ownerTokenCount < nftPerAddressLimitO,"Max lmit of tokens exceeded for OG list");
            uint256 freeMintAvailable = getFreeMintAvailableAmount(
                maxOGFreePerWallet,MintType.OG
            );
            // require(freeMintAvailable+whitelistFreeMinted<=500,"White list free mint are over");
            mint(_mintAmount,msg.value,freeMintAvailable,MintType.OG);
           
        // }
}

    /// @notice It is use to allow mint for the adresses added in whitelist
    /// @dev Since we have two whitelist,we calculate there free mint avialble depending on the whitelist and call the private mint function.Cannot break further as free mints are variable to type of sale
    /// @param _mintAmount is the quantity of tocken to mint
    function WLMint(uint8 _mintAmount,bytes32[] calldata proof) preConditions(_mintAmount) public payable {
       
        require(!pauseWL,"Pre sale WL is not active currently");

        // uint256 ownerTokenCount = tokensMintedPerWallet[msg.sender];
        // require(_mintAmount+ownerTokenCount<= nftPerAddressLimitL,"Max lmit of tokens exceeded for Whitelists");

        require(isWalletWL(msg.sender,proof),"This Adresses is not whitelisted, You can Mint Maestro's Mix in Public Sale");
        // if (isWhiteListedL(msg.sender)) {
            // require(ownerTokenCount < nftPerAddressLimitL,"Max lmit of tokens exceeded for OG list");
            uint256 freeMintAvailable = getFreeMintAvailableAmount(
                maxWLFreePerWallet,MintType.WL
            );
            // require(freeMintAvailable+whitelistFreeMinted<=500,"White list free mint are over");
            mint(_mintAmount,msg.value,freeMintAvailable,MintType.WL);
           
        // }
}

    /// @notice It is use to allow mint for the public sale
    /// @dev Use in public sale.Can also add a check of boolean onlyPulicSale in order to make it discrete with onlyWhiteListed.Cause as of now when whitelisting is off,public sales gets active immediately.Can also add lazy minting for optimization
    /// @param _mintAmount is the quantity of tocken to mint
    function PublicMint(uint8 _mintAmount) preConditions(_mintAmount) public payable {
       
        require(!pausePublicSale,"Public sale is currently inactive");
        //require(_mintAmount <= nftPerAddressLimitPublic,"Mint amount should be greater than 0");
        // uint256 ownerTokenCount = tokensMintedPerWallet[msg.sender];
        // require(_mintAmount+ownerTokenCount <= nftPerAddressLimitPublic,"Max lmit of tokens exceeded for public sale");

        uint256 freeMintAvailable = getFreeMintAvailableAmount(
            maxPublicFreePerWallet,MintType.Public
        );

        // require(freeMintAvailable+publicFreeMinted<=1000,"Public free mint is over free");

         mint( _mintAmount,msg.value,freeMintAvailable,MintType.Public);
    }

    function mintOwner(uint256 _mintAmount) public onlyOwner {
         _safeMint(msg.sender, _mintAmount);
    }

    /// @notice check if the address is in whitelisted og list
    /// @dev use to check if address is in whitelisted og list
    /// @param _user is the address of wallet to check
    /// @return it returns the boolen,true if address exist in the whitelist og list
    function isWalletOG(address _user,bytes32[] calldata proof) public view returns (bool) {
        bytes32 leaf=keccak256(abi.encodePacked(_user));
        return MerkleProof.verify(proof,OGRoot,leaf);
    }

    /// @notice check if the address is in whitelisted og list
    /// @dev use to check if address is in whitelisted og list
    /// @param _user is the address of wallet to check
    /// @return it returns the boolen,true if address exist in the whitelist og list
    function isWalletWL(address _user,bytes32[] calldata proof) public view returns (bool) {
       bytes32 leaf=keccak256(abi.encodePacked(_user));
        return MerkleProof.verify(proof,WLRoot,leaf);
    }


    /// @notice set the max amount of token that can be minted by a simgle wallet
    /// @dev it is to set max amount of token that can be minted by a simgle wallet
    /// @param _maxMintAmountPerWallet is the new max amount that a single wallet can mint totally
    function setMaxMintAmountPerWallet(uint8 _maxMintAmountPerWallet) public onlyOwner {
        maxMintAmountPerWallet = _maxMintAmountPerWallet;
    }
      
    ///@notice To set the number of token allowed to free mint in OG whitelist per address
    ///@dev set the number of token allowed to free mint in OG list
    ///@param _maxOGFreePerWallet of type uint8 is the number of free tokens allowed to mint in OG whitelist
    function setMaxOGFreePerWallet (uint8 _maxOGFreePerWallet) public onlyOwner{
       maxOGFreePerWallet=_maxOGFreePerWallet;
       
    }
    
    ///@notice To set the total number of token allowed to mint in OG whitelist per address
    ///@dev set the total number of token allowed to mint in OG list per address
    ///@param _maxWLFreePerWallet of type uint8 is the total number of tokens allowed to mint in OG whitelist per address
    function setMaxWLFreePerWallet (uint8 _maxWLFreePerWallet) public onlyOwner{
        maxWLFreePerWallet=_maxWLFreePerWallet;
    }

     ///@notice To set the number of token allowed to free mint in public sale per address
    ///@dev set the number of token allowed to free mint in public sale per address
    ///@param _maxPublicFreePerWallet of type uint8 is the number of free tokens allowed to mint in public sale per address
    function setMaxPublicFreePerWallet (uint8 _maxPublicFreePerWallet) public onlyOwner{
        maxPublicFreePerWallet=_maxPublicFreePerWallet;
    }

    
    function setTotalLimitsOfMint(uint256 _totalOGLimit,uint256 _totalWLLimit,uint256 _totalPublicFreeLimit)
        public
        onlyOwner
    {
        totalOGLimit=_totalOGLimit;
        totalWLLimit=_totalWLLimit;
        totalPublicFreeLimit=_totalPublicFreeLimit;
    }

    /// @notice Gives the base uri for tocken
    /// @dev use for the BaseUri setup at the time of initialization
    /// @return base uri of tockens on ipfs in string
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }
    /// @notice gives the token uri of specific token
    /// @dev it is to give us the token uri when minted an nft
    /// @param tokenId is the index of the token for which uri has to return
    /// @return it returns the uri of specific token
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (revealed == false) {
            return notRevealedUri;
        }

        string memory currentBaseURI = _baseURI();
        if(bytes(currentBaseURI).length > 0){
                return string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                );
        }else{
                return "";
            }
    }

    /// @notice reveal the nft art
    /// @dev set the reveal to true inorder to reveal nft art.
    function reveal() public onlyOwner {
        revealed = true;
    }

    /// @notice set the cost for paid mint
    /// @dev it is to set the cost for the tokens minted in paid mint
    /// @param _newCost is the new cost to set for the paid mint
    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    /// @notice it sets the uri for the image to show when tokens are not revealed
    /// @dev it is to set uri of json that has details to show along with image when the tokens are not revealed
    /// @param _notRevealedURI is the new uri of json for the metadata when tokens are not revealed
    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    /// @notice it sets the uri for the data including images,description to show when tokens are  revealed
    /// @dev it is to set domain uri of json metadata that has details to show along with image when the tokens are revealed
    /// @param _newBaseURI is the new domain uri of json for the metadata when tokens are  revealed
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    /// @notice it sets the extension of file containing metadata
    /// @dev it is to set file extension of metadata that has details to show along with image when the tokens are not revealed
    /// @param _newBaseExtension is the new extension of the metadata file
    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    /// @notice it is to withraw funds from the paid mint
    /// @dev it withdraws the fund from minting to the wallet of owner
    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }

    /// @notice it to track addresses that mints and thier amount
    /// @dev it is added to stop addresses from selling and minting again
    /// @param wallet is the wallet addr of minter
    function getTokensMintedPerWallet(address wallet) public view returns (uint8){
    return tokensMintedPerWallet[wallet];
    }
    
    /// @notice it stops/resume wallet from minting.
    /// @dev it is to stop/resume the minting process.Could be used when system is compromised.
    /// @param _state is the boolean to whther resume or pause the minting process.
    function setPause(bool _state) public onlyOwner {
        paused = _state;
    }

    /// @notice it toggle the whitelistog
    /// @dev it toggle the whitelistog
    /// @param _pauseOG is the bool to toggle the whitelistog
    function setPauseOG(bool _pauseOG)
        public
        onlyOwner
    {
        pauseOG=_pauseOG;
    }
    /// @notice it toggle the whitelist
    /// @dev it toggle the whitelist
    /// @param _pauseWL is the bool to toggle the whitelist
    function setPauseWL(bool _pauseWL)
        public
        onlyOwner
    {
        pauseWL=_pauseWL;
    }
    /// @notice it toggle the publicSale
    /// @dev it toggle the publicsale
    /// @param _pausePublicSale is the bool to toggle the whitelist
    function setPausePublicSale(bool _pausePublicSale)
        public
        onlyOwner
    {
        pausePublicSale=_pausePublicSale;
    }

     /// @notice this sets the og and wl proofs
    /// @dev this sets the og and wl proofs
    /// @param _OGRoot _WLRoot are the merkle proofs
    function setProofs( bytes32 _OGRoot,bytes32 _WLRoot)
        public
        onlyOwner
    {
        OGRoot=_OGRoot;
        WLRoot=_WLRoot;
    }
}