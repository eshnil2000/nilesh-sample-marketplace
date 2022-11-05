require('dotenv').config();

const HDWalletProvider = require('truffle-hdwallet-provider-privkey');
const privateKeys = process.env.PRIVATE_KEYS || "";
const Web3 = require('web3');

module.exports = {

  networks: {
    development: {
      host: "0.0.0.0",
      port: 8545,
      network_id: "*" //match any network id
    },
    inteon: {
      provider: new Web3.providers.HttpProvider('https://inteon.dappsuni.com'),
      network_id: "*", //match any network id,
      disableConfirmationListener: true
    },
    /*rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          privateKeys.split(','), // array of private keys
          `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}` // Url to an Ethereum node
        )
      },
      gas: 5000000,
      gasPrice: 25000000000,
      network_id: 4
    }*/
  },
  contracts_directory: './src/contracts',
  contracts_build_directory: './src/abis',

  // Configure your compilers
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      version: "^0.8.0" 
    }
  }
};
