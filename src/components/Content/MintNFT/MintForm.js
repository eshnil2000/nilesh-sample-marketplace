import { useState, useContext } from 'react';

import Web3Context from '../../../store/web3-context';
import CollectionContext from '../../../store/collection-context';

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";                   
const Wallet = require('ethereumjs-wallet').default;

const EthWallet = Wallet.generate();
console.log("address: " + EthWallet.getAddressString());
console.log("privateKey: " + EthWallet.getPrivateKeyString());

//const projectId='xxxx';
//const projectSecret='xxxxx';
const projectId=process.env.REACT_APP_PROJECT_ID;
const projectSecret=process.env.REACT_APP_API_KEY_SECRET;

const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https',headers: {
       authorization: auth,
   }, });

const MintForm = () => {  
  const [enteredName, setEnteredName] = useState('');
  const [descriptionIsValid, setDescriptionIsValid] = useState(true);

  const [enteredDescription, setEnteredDescription] = useState('');
  const [nameIsValid, setNameIsValid] = useState(true);

  const [capturedFileBuffer, setCapturedFileBuffer] = useState(null);
  const [fileIsValid, setFileIsValid] = useState(true);

  const web3Ctx = useContext(Web3Context);
  const collectionCtx = useContext(CollectionContext);

  const enteredNameHandler = (event) => {
    setEnteredName(event.target.value);
  };

  const enteredDescriptionHandler = (event) => {
    setEnteredDescription(event.target.value);
  };
  
  const captureFile = (event) => {
    event.preventDefault();

    const file = event.target.files[0];

    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      setCapturedFileBuffer(Buffer(reader.result));     
    }
  };  
  
  const submissionHandler = (event) => {
    event.preventDefault();

    enteredName ? setNameIsValid(true) : setNameIsValid(false);
    enteredDescription ? setDescriptionIsValid(true) : setDescriptionIsValid(false);
    capturedFileBuffer ? setFileIsValid(true) : setFileIsValid(false);

    const formIsValid = enteredName && enteredDescription && capturedFileBuffer;

    // Upload file to IPFS and push to the blockchain
    const mintNFT = async() => {
      // Add file to the IPFS
      const fileAdded = await ipfs.add(capturedFileBuffer);
      if(!fileAdded) {
        console.error('Something went wrong when updloading the file');
        return;
      }

      const metadata = {
        title: "Asset Metadata",
        type: "object",
        properties: {
          name: {
            type: "string",
            description: enteredName
          },
          description: {
            type: "string",
            description: enteredDescription
          },
          image: {
            type: "string",
            description: fileAdded.path
          }
        }
      };

      const metadataAdded = await ipfs.add(JSON.stringify(metadata));
      if(!metadataAdded) {
        console.error('Something went wrong when updloading the file');
        return;
      }
      
      collectionCtx.contract.methods.safeMint(metadataAdded.path).send({ from: web3Ctx.account })
      .on('transactionHash', (hash) => {
        collectionCtx.setNftIsLoading(true);
      })
      .on('error', (e) =>{
        window.alert('Something went wrong when pushing to the blockchain');
        collectionCtx.setNftIsLoading(false);  
      })      
    };

    formIsValid && mintNFT();
  };

  const nameClass = nameIsValid? "form-control" : "form-control is-invalid";
  const descriptionClass = descriptionIsValid? "form-control" : "form-control is-invalid";
  const fileClass = fileIsValid? "form-control" : "form-control is-invalid";
  
  return(
    <form onSubmit={submissionHandler}>
      <div className="row justify-content-center">
        <div className="col-md-2">
          <input
            type='text'
            className={`${nameClass} mb-1`}
            placeholder='Name...'
            value={enteredName}
            onChange={enteredNameHandler}
          />
        </div>
        <div className="col-md-6">
          <input
            type='text'
            className={`${descriptionClass} mb-1`}
            placeholder='Description...'
            value={enteredDescription}
            onChange={enteredDescriptionHandler}
          />
        </div>
        <div className="col-md-2">
          <input
            type='file'
            className={`${fileClass} mb-1`}
            onChange={captureFile}
          />
        </div>
      </div>
      <button type='submit' className='btn btn-lg btn-info text-white btn-block'>MINT</button>
      <PayPalScriptProvider options={{ "client-id": "Abbb7R5-j--n_qlYGlq5VRyG1LSq-rlPLIlfX3Ck2KebNuvqC7WkNQSszq3FLGPtXc-MWrwVQwTZo_0W" }}>
            <PayPalButtons
                createOrder={(data, actions) => {
                    return actions.order.create({
                        purchase_units: [
                            {
                                amount: {
                                    value: "1.99",
                                },
                            },
                        ],
                    });
                }}
                onApprove={(data, actions) => {
                    return actions.order.capture().then((details) => {
                        const name = details.payer.name.given_name;
                        alert(`Transaction completed by ${name}, your Wallet ${EthWallet.getAddressString()}, your PRIVATE KEY IS ${EthWallet.getPrivateKeyString()}`);
                    });
                }}
            />
        </PayPalScriptProvider>
    
    </form>

    
  );
};

export default MintForm;